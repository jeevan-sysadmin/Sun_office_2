import "dotenv/config";
import mysql from "mysql2/promise";

const remoteApiBaseUrl = (
  process.env.REMOTE_SYNC_API_BASE_URL || ""
).replace(/\/+$/, "");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sun_office",
});

const fetchJson = async (path) => {
  if (!remoteApiBaseUrl) {
    throw new Error("REMOTE_SYNC_API_BASE_URL is required for sync-live-data.js");
  }

  const response = await fetch(`${remoteApiBaseUrl}/${path}`);
  if (!response.ok) {
    throw new Error(`Remote fetch failed for ${path}: ${response.status}`);
  }

  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  return JSON.parse(text);
};

const fetchPaginated = async (path, getItems, getPagination, limit = 100) => {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  do {
    const separator = path.includes("?") ? "&" : "?";
    const payload = await fetchJson(`${path}${separator}page=${page}&limit=${limit}`);
    const items = getItems(payload);
    const pagination = getPagination(payload) || {};

    if (Array.isArray(items)) {
      allItems.push(...items);
    }

    totalPages = Number(
      pagination.total_pages ||
      pagination.pages ||
      1,
    );
    page += 1;
  } while (page <= totalPages);

  return allItems;
};

const toNullable = (value) =>
  value === undefined || value === null || value === "" ? null : value;

const toJsonArray = (value) =>
  Array.isArray(value) && value.length > 0 ? JSON.stringify(value) : null;

const upsert = async (tableName, columns, values, updateColumns = null) => {
  const placeholders = columns.map(() => "?").join(", ");
  const columnsToUpdate = (updateColumns || columns)
    .filter((column) => column !== "id")
    .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
    .join(", ");

  const sql = `
    INSERT INTO \`${tableName}\` (${columns.map((column) => `\`${column}\``).join(", ")})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${columnsToUpdate}
  `;

  await connection.query(sql, values);
};

const pruneMissingIds = async (tableName, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  const placeholders = uniqueIds.map(() => "?").join(", ");
  await connection.query(
    `DELETE FROM \`${tableName}\` WHERE id NOT IN (${placeholders})`,
    uniqueIds,
  );
};

const syncUsers = async () => {
  const payload = await fetchJson("users.php");
  const users = Array.isArray(payload.users) ? payload.users : [];

  for (const user of users) {
    await upsert(
      "users",
      [
        "id",
        "name",
        "email",
        "password",
        "role",
        "phone",
        "is_active",
        "last_login",
        "created_at",
        "updated_at",
      ],
      [
        user.id,
        user.name,
        user.email,
        "$2y$10$placeholderplaceholderplaceholderplaceholderplaceholder12",
        user.role || "staff",
        toNullable(user.phone),
        user.is_active ? 1 : 0,
        toNullable(user.last_login),
        toNullable(user.created_at),
        toNullable(user.updated_at),
      ],
      [
        "name",
        "email",
        "role",
        "phone",
        "is_active",
        "last_login",
        "created_at",
        "updated_at",
      ],
    );
  }

  const activeEmails = users
    .map((user) => String(user.email || "").trim())
    .filter(Boolean);

  if (activeEmails.length > 0) {
    const placeholders = activeEmails.map(() => "?").join(", ");
    await connection.query(
      `UPDATE users SET is_active = 0 WHERE email NOT IN (${placeholders})`,
      activeEmails,
    );
  }

  return users.length;
};

const syncCustomers = async () => {
  const payload = await fetchJson("customers.php");
  const customers = Array.isArray(payload.customers) ? payload.customers : [];

  for (const customer of customers) {
    await upsert(
      "customers",
      [
        "id",
        "customer_code",
        "full_name",
        "email",
        "phone",
        "alternate_phone",
        "address",
        "city",
        "state",
        "zip_code",
        "notes",
        "created_at",
        "updated_at",
      ],
      [
        customer.id,
        customer.customer_code,
        customer.full_name,
        toNullable(customer.email),
        toNullable(customer.phone),
        toNullable(customer.alternate_phone),
        toNullable(customer.address),
        toNullable(customer.city),
        toNullable(customer.state),
        toNullable(customer.zip_code),
        toNullable(customer.notes),
        toNullable(customer.created_at),
        toNullable(customer.updated_at),
      ],
    );
  }

  return customers.length;
};

const syncBatteries = async () => {
  const batteries = await fetchPaginated(
    "batteries.php",
    (payload) => payload?.data?.batteries,
    (payload) => payload?.data?.pagination,
    100,
  );

  for (const battery of batteries) {
    await upsert(
      "batteries",
      [
        "id",
        "battery_code",
        "battery_model",
        "battery_serial",
        "brand",
        "capacity",
        "voltage",
        "battery_type",
        "category",
        "specifications",
        "purchase_date",
        "warranty_period",
        "amc_period",
        "price",
        "status",
        "installation_date",
        "battery_condition",
        "created_at",
        "updated_at",
        "inverter",
      ],
      [
        battery.id,
        battery.battery_code ?? "",
        toNullable(battery.battery_model),
        toNullable(battery.battery_serial),
        toNullable(battery.brand),
        toNullable(battery.capacity),
        toNullable(battery.voltage),
        toNullable(battery.battery_type),
        toNullable(battery.category),
        toNullable(battery.specifications),
        toNullable(battery.purchase_date),
        toNullable(battery.warranty_period),
        toNullable(battery.amc_period),
        Number(battery.price || 0),
        toNullable(battery.status) || "active",
        toNullable(battery.installation_date),
        toNullable(battery.battery_condition),
        toNullable(battery.created_at),
        toNullable(battery.updated_at),
        toNullable(battery.inverter),
      ],
    );
  }

  return batteries.length;
};

const syncInverters = async () => {
  const inverters = await fetchPaginated(
    "inverters.php",
    (payload) => payload?.data,
    (payload) => payload?.pagination,
    100,
  );

  for (const inverter of inverters) {
    await upsert(
      "inverters",
      [
        "id",
        "inverter_code",
        "inverter_model",
        "inverter_serial",
        "inverter_brand",
        "power_rating",
        "type",
        "wave_type",
        "input_voltage",
        "output_voltage",
        "efficiency",
        "battery_voltage",
        "specifications",
        "warranty_period",
        "price",
        "status",
        "purchase_date",
        "installation_date",
        "inverter_condition",
        "created_at",
        "updated_at",
      ],
      [
        inverter.id,
        inverter.inverter_code ?? "",
        toNullable(inverter.inverter_model),
        toNullable(inverter.inverter_serial),
        toNullable(inverter.inverter_brand),
        toNullable(inverter.power_rating),
        toNullable(inverter.type) || "inverter",
        toNullable(inverter.wave_type) || "modified_sine",
        toNullable(inverter.input_voltage),
        toNullable(inverter.output_voltage),
        toNullable(inverter.efficiency),
        toNullable(inverter.battery_voltage),
        toNullable(inverter.specifications),
        toNullable(inverter.warranty_period),
        Number(inverter.price || 0),
        toNullable(inverter.status) || "active",
        toNullable(inverter.purchase_date),
        toNullable(inverter.installation_date),
        toNullable(inverter.inverter_condition) || "good",
        toNullable(inverter.created_at),
        toNullable(inverter.updated_at),
      ],
    );
  }

  return inverters.length;
};

const syncServices = async () => {
  const services = await fetchPaginated(
    "services.php",
    (payload) => payload?.data,
    (payload) => payload?.pagination,
    100,
  );

  for (const service of services) {
    await upsert(
      "service_orders",
      [
        "id",
        "service_code",
        "customer_id",
        "customer_phone",
        "battery_id",
        "service_staff_id",
        "issue_description",
        "warranty_status",
        "amc_status",
        "estimated_cost",
        "final_cost",
        "payment_status",
        "estimated_completion_date",
        "priority",
        "notes",
        "deposit_amount",
        "created_at",
        "updated_at",
        "inverter_id",
        "battery_ids",
        "inverter_ids",
      ],
      [
        service.id,
        service.service_code ?? "",
        toNullable(service.customer_id),
        toNullable(service.customer_phone || service.customer_phone_number),
        toNullable(service.battery_id),
        toNullable(service.service_staff_id),
        "",
        toNullable(service.warranty_status),
        toNullable(service.amc_status),
        0,
        0,
        "pending",
        null,
        "medium",
        toNullable(service.notes),
        0,
        toNullable(service.created_at),
        toNullable(service.updated_at),
        toNullable(service.inverter_id),
        toJsonArray(service.battery_ids),
        toJsonArray(service.inverter_ids),
      ],
    );
  }

  await pruneMissingIds(
    "service_orders",
    services.map((service) => service.id),
  );

  return services.length;
};

const syncWaterServices = async () => {
  const payload = await fetchJson("water_services.php");
  const records = Array.isArray(payload.records) ? payload.records : [];

  for (const record of records) {
    await upsert(
      "water_services",
      [
        "id",
        "service_id",
        "customer_id",
        "battery_id",
        "amount",
        "payment_status",
        "service_date",
        "notes",
        "created_by",
        "service_staff_id",
        "created_at",
      ],
      [
        record.id,
        record.service_id,
        toNullable(record.customer_id),
        toNullable(record.battery_id),
        Number(record.amount || 0),
        toNullable(record.payment_status) || "pending",
        toNullable(record.service_date),
        toNullable(record.notes),
        toNullable(record.created_by),
        toNullable(record.service_staff_id),
        toNullable(record.created_at),
      ],
    );
  }

  await pruneMissingIds(
    "water_services",
    records.map((record) => record.id),
  );

  return records.length;
};

const syncSalary = async () => {
  const payload = await fetchJson("salary.php");
  const salaries = Array.isArray(payload.data) ? payload.data : [];

  for (const salary of salaries) {
    await upsert(
      "salary",
      [
        "id",
        "staff_id",
        "service_type",
        "staff_name",
        "amount",
        "salary_date",
        "salary_month",
        "payment_method",
        "transaction_id",
        "bonus",
        "deductions",
        "notes",
        "paid_by",
        "paid_at",
        "created_at",
        "updated_at",
      ],
      [
        salary.id,
        toNullable(salary.staff_id),
        toNullable(salary.service_type) || "water",
        salary.staff_name,
        Number(salary.amount || 0),
        salary.salary_date,
        salary.salary_month,
        toNullable(salary.payment_method) || "cash",
        toNullable(salary.transaction_id),
        Number(salary.bonus || 0),
        Number(salary.deductions || 0),
        toNullable(salary.notes),
        toNullable(salary.paid_by),
        toNullable(salary.paid_at),
        toNullable(salary.created_at),
        toNullable(salary.updated_at),
      ],
    );
  }

  await pruneMissingIds(
    "salary",
    salaries.map((salary) => salary.id),
  );

  return salaries.length;
};

try {
  const results = {};
  results.users = await syncUsers();
  results.customers = await syncCustomers();
  results.batteries = await syncBatteries();
  results.inverters = await syncInverters();
  results.services = await syncServices();
  results.water_services = await syncWaterServices();
  results.salary = await syncSalary();

  console.log("Live data sync completed.");
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  console.error(
    "Live data sync failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
} finally {
  await connection.end();
}
