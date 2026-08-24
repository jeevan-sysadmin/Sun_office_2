import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiPort = Number(process.env.API_PORT || process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "sun-office-dev-secret";
const appBasePath = (() => {
  const raw = String(process.env.VITE_APP_BASE_PATH || "/sunoffice").trim();
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
})();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sun_office",
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const schemaCache = new Map();
const backupDir = process.env.DB_BACKUP_DIR
  ? path.resolve(process.env.DB_BACKUP_DIR)
  : path.join(__dirname, "backups");

const getConnection = () => pool.getConnection();

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseId = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeIdArray = (value) =>
  parseJsonArray(value)
    .map((item) => parseId(item))
    .filter((item) => item !== null);

const normalizeNullableDate = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const serviceOrderTriggerStatements = [
  "DROP TRIGGER IF EXISTS before_service_insert",
  "DROP TRIGGER IF EXISTS before_service_order_insert",
  "DROP TRIGGER IF EXISTS before_service_orders_insert",
  "DROP TRIGGER IF EXISTS trg_fix_battery_statuses_json_ins",
  "DROP TRIGGER IF EXISTS trg_fix_battery_statuses_json_upd",
  "DROP TRIGGER IF EXISTS trg_service_orders_fix_status_json_ins",
  "DROP TRIGGER IF EXISTS trg_service_orders_fix_status_json_upd",
  "DROP TRIGGER IF EXISTS trg_service_orders_delivery_from_battery_json",
  `
  CREATE TRIGGER before_service_orders_insert
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  BEGIN
    IF NEW.service_code IS NULL OR NEW.service_code = '' COLLATE utf8mb4_general_ci THEN
      SET NEW.service_code = CONCAT(
        'SVC-',
        DATE_FORMAT(NOW(), '%Y%m%d'),
        '-',
        LPAD(
          (
            SELECT COALESCE(MAX(CAST(SUBSTRING(service_code, 14) AS UNSIGNED)), 0) + 1
            FROM service_orders
            WHERE service_code COLLATE utf8mb4_general_ci LIKE CONCAT('SVC-', DATE_FORMAT(NOW(), '%Y%m%d'), '-%') COLLATE utf8mb4_general_ci
          ),
          4,
          '0'
        )
      );
    END IF;
  END
  `,
  `
  CREATE TRIGGER trg_service_orders_fix_status_json_ins
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  BEGIN
    IF NEW.battery_statuses_json IS NOT NULL THEN
      SET NEW.battery_statuses_json = REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(NEW.battery_statuses_json,
                  '"service_status":"null"', '"service_status":"pending"'
                ),
                '"service_status": "null"', '"service_status":"pending"'
              ),
              '"service_status":null', '"service_status":"pending"'
            ),
            '"service_status": null', '"service_status":"pending"'
          ),
          '"service_status":"shop"', '"service_status":"pending"'
        ),
        '"service_status":"company"', '"service_status":"pending"'
      );
      SET NEW.battery_statuses_json = REPLACE(
        REPLACE(NEW.battery_statuses_json,
          '"service_status":"suntocomp"', '"service_status":"pending"'
        ),
        '"service_status":"comptosun"', '"service_status":"pending"'
      );
    END IF;
  END
  `,
  `
  CREATE TRIGGER trg_service_orders_fix_status_json_upd
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  BEGIN
    IF NEW.battery_statuses_json IS NOT NULL THEN
      SET NEW.battery_statuses_json = REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(NEW.battery_statuses_json,
                  '"service_status":"null"', '"service_status":"pending"'
                ),
                '"service_status": "null"', '"service_status":"pending"'
              ),
              '"service_status":null', '"service_status":"pending"'
            ),
            '"service_status": null', '"service_status":"pending"'
          ),
          '"service_status":"shop"', '"service_status":"pending"'
        ),
        '"service_status":"company"', '"service_status":"pending"'
      );
      SET NEW.battery_statuses_json = REPLACE(
        REPLACE(NEW.battery_statuses_json,
          '"service_status":"suntocomp"', '"service_status":"pending"'
        ),
        '"service_status":"comptosun"', '"service_status":"pending"'
      );
    END IF;
  END
  `,
  `
  CREATE TRIGGER trg_service_orders_delivery_from_battery_json
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE j INT DEFAULT 0;
    DECLARE new_len INT DEFAULT 0;
    DECLARE old_len INT DEFAULT 0;
    DECLARE v_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_battery_id INT;
    DECLARE v_battery_serial VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE old_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE old_battery_id INT;
    DECLARE old_battery_serial VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE old_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE new_status_cmp VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE new_battery_id_cmp INT;
    DECLARE new_battery_serial_cmp VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE still_delivered TINYINT DEFAULT 0;

    IF NEW.battery_statuses_json IS NOT NULL
       AND JSON_VALID(NEW.battery_statuses_json)
       AND (
         OLD.battery_statuses_json IS NULL
         OR OLD.battery_statuses_json COLLATE utf8mb4_general_ci <> NEW.battery_statuses_json COLLATE utf8mb4_general_ci
       ) THEN
      SET new_len = JSON_LENGTH(NEW.battery_statuses_json);

      SET i = 0;
      WHILE i < new_len DO
        SET v_status = LOWER(JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', i, '].service_status'))));
        SET v_battery_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', i, '].battery_id'))) AS UNSIGNED);
        SET v_battery_serial = JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', i, '].battery_serial')));
        SET v_note = CONCAT(
          'Auto-created from battery_statuses_json | service ',
          NEW.service_code,
          ' | battery_id:',
          COALESCE(v_battery_id, 0),
          ' | battery_serial:',
          COALESCE(v_battery_serial, 'N/A')
        );

        IF v_status = 'delivered' COLLATE utf8mb4_general_ci THEN
          IF NOT EXISTS (
            SELECT 1
            FROM deliveries d
            WHERE d.service_id = NEW.id
              AND d.notes COLLATE utf8mb4_general_ci = v_note COLLATE utf8mb4_general_ci
          ) THEN
            INSERT INTO deliveries (
              delivery_code,
              service_id,
              customer_id,
              delivery_type,
              address,
              contact_person,
              contact_phone,
              scheduled_date,
              scheduled_time,
              delivery_person,
              notes,
              status,
              delivered_date,
              created_at,
              updated_at
            )
            VALUES (
              NULL,
              NEW.id,
              NEW.customer_id,
              'home_delivery',
              'Address to be confirmed',
              'Customer',
              COALESCE(NEW.customer_phone, 'Not provided'),
              CURDATE(),
              '12:00:00',
              'Delivery Staff',
              v_note,
              'delivered',
              NOW(),
              NOW(),
              NOW()
            );
          END IF;
        ELSE
          DELETE FROM deliveries
          WHERE service_id = NEW.id
            AND notes COLLATE utf8mb4_general_ci = v_note COLLATE utf8mb4_general_ci
            AND notes COLLATE utf8mb4_general_ci LIKE 'Auto-created from battery_statuses_json | service %' COLLATE utf8mb4_general_ci;
        END IF;

        SET i = i + 1;
      END WHILE;

      IF OLD.battery_statuses_json IS NOT NULL AND JSON_VALID(OLD.battery_statuses_json) THEN
        SET old_len = JSON_LENGTH(OLD.battery_statuses_json);
        SET i = 0;

        WHILE i < old_len DO
          SET old_status = LOWER(JSON_UNQUOTE(JSON_EXTRACT(OLD.battery_statuses_json, CONCAT('$[', i, '].service_status'))));

          IF old_status = 'delivered' COLLATE utf8mb4_general_ci THEN
            SET old_battery_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(OLD.battery_statuses_json, CONCAT('$[', i, '].battery_id'))) AS UNSIGNED);
            SET old_battery_serial = JSON_UNQUOTE(JSON_EXTRACT(OLD.battery_statuses_json, CONCAT('$[', i, '].battery_serial')));
            SET still_delivered = 0;
            SET j = 0;

            WHILE j < new_len DO
              SET new_status_cmp = LOWER(JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', j, '].service_status'))));
              SET new_battery_id_cmp = CAST(JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', j, '].battery_id'))) AS UNSIGNED);
              SET new_battery_serial_cmp = JSON_UNQUOTE(JSON_EXTRACT(NEW.battery_statuses_json, CONCAT('$[', j, '].battery_serial')));

              IF new_status_cmp = 'delivered' COLLATE utf8mb4_general_ci
                 AND COALESCE(new_battery_id_cmp, 0) = COALESCE(old_battery_id, 0)
                 AND COALESCE(new_battery_serial_cmp, '') COLLATE utf8mb4_general_ci = COALESCE(old_battery_serial, '') COLLATE utf8mb4_general_ci THEN
                SET still_delivered = 1;
              END IF;

              SET j = j + 1;
            END WHILE;

            IF still_delivered = 0 THEN
              SET old_note = CONCAT(
                'Auto-created from battery_statuses_json | service ',
                NEW.service_code,
                ' | battery_id:',
                COALESCE(old_battery_id, 0),
                ' | battery_serial:',
                COALESCE(old_battery_serial, 'N/A')
              );

              DELETE FROM deliveries
              WHERE service_id = NEW.id
                AND notes COLLATE utf8mb4_general_ci = old_note COLLATE utf8mb4_general_ci
                AND notes COLLATE utf8mb4_general_ci LIKE 'Auto-created from battery_statuses_json | service %' COLLATE utf8mb4_general_ci;
            END IF;
          END IF;

          SET i = i + 1;
        END WHILE;
      END IF;
    END IF;
  END
  `,
];

const ensureServiceOrderTriggers = async (connection) => {
  for (const statement of serviceOrderTriggerStatements) {
    await connection.query(statement);
  }
};

const salarySchemaStatements = [
  `
  ALTER TABLE salary
    MODIFY COLUMN service_type ENUM('water','inverter','both') NOT NULL DEFAULT 'water'
  `,
  `
  ALTER TABLE salary
    ADD COLUMN funding_source VARCHAR(50) DEFAULT NULL
  `,
  `
  ALTER TABLE salary
    ADD COLUMN funding_amount DECIMAL(10,2) DEFAULT NULL
  `,
  `
  ALTER TABLE salary
    ADD COLUMN funding_notes TEXT DEFAULT NULL
  `,
];

const ensureSalarySchema = async (connection) => {
  for (const statement of salarySchemaStatements) {
    try {
      await connection.query(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const ignorable =
        message.includes("Duplicate column name") ||
        message.includes("already exists") ||
        message.includes("Invalid use of NULL value") ||
        message.includes("Data truncated");

      if (!ignorable) {
        throw error;
      }
    }
  }
};

const generateCode = (prefix) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const tail = `${Date.now()}`.slice(-4);
  return `${prefix}-${y}${m}${d}-${tail}`;
};

const ensureBackupDir = async () => {
  await fs.mkdir(backupDir, { recursive: true });
};

const sanitizeBackupFileName = (value) => {
  const raw = String(value || "").trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe === "." || safe === "..") {
    return null;
  }
  return safe.toLowerCase().endsWith(".sql") ? safe : `${safe}.sql`;
};

const buildTimestampSuffix = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
};

const buildBackupFileName = (requestedName) => {
  const safeName = sanitizeBackupFileName(requestedName) || "sun_office.sql";
  const ext = path.extname(safeName) || ".sql";
  const baseName = path.basename(safeName, ext) || "sun_office";
  return `${baseName}-${buildTimestampSuffix()}${ext}`;
};

const escapeIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const serializeRowValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return "NULL";
  }
  return mysql.escape(value);
};

const createInsertStatements = (tableName, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const columnNames = Object.keys(rows[0] || {});
  if (!columnNames.length) {
    return [];
  }

  const escapedColumns = columnNames.map(escapeIdentifier).join(", ");
  const chunkSize = 100;
  const statements = [];

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const valuesSql = chunk
      .map((row) => {
        const values = columnNames.map((columnName) => serializeRowValue(row[columnName]));
        return `(${values.join(", ")})`;
      })
      .join(",\n");

    statements.push(
      `INSERT INTO ${escapeIdentifier(tableName)} (${escapedColumns}) VALUES\n${valuesSql};`
    );
  }

  return statements;
};

const buildDatabaseBackupSql = async (connection) => {
  const sqlParts = [
    "-- SUN Office database backup",
    `-- Generated at ${new Date().toISOString()}`,
    `-- Database: ${dbConfig.database}`,
    "SET FOREIGN_KEY_CHECKS=0;",
    "",
  ];

  const [tableRows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableNames = Array.isArray(tableRows)
    ? tableRows
        .map((row) => row[`Tables_in_${dbConfig.database}`] || Object.values(row)[0])
        .filter(Boolean)
    : [];

  for (const tableName of tableNames) {
    const [createRows] = await connection.query(`SHOW CREATE TABLE ${escapeIdentifier(tableName)}`);
    const createStatement = Array.isArray(createRows) ? createRows[0]?.["Create Table"] : null;
    if (!createStatement) {
      continue;
    }

    sqlParts.push(`-- Table: ${tableName}`);
    sqlParts.push(`DROP TABLE IF EXISTS ${escapeIdentifier(tableName)};`);
    sqlParts.push(`${createStatement};`);

    const [dataRows] = await connection.query(`SELECT * FROM ${escapeIdentifier(tableName)}`);
    const insertStatements = createInsertStatements(tableName, Array.isArray(dataRows) ? dataRows : []);
    if (insertStatements.length) {
      sqlParts.push(...insertStatements);
    }
    sqlParts.push("");
  }

  const [triggerRows] = await connection.query(`SHOW TRIGGERS FROM ${escapeIdentifier(dbConfig.database)}`);
  if (Array.isArray(triggerRows) && triggerRows.length) {
    sqlParts.push("-- Triggers");
    for (const triggerRow of triggerRows) {
      const triggerName = triggerRow.Trigger || triggerRow.trigger;
      if (!triggerName) {
        continue;
      }
      const [createTriggerRows] = await connection.query(`SHOW CREATE TRIGGER ${escapeIdentifier(triggerName)}`);
      const createTrigger = Array.isArray(createTriggerRows)
        ? createTriggerRows[0]?.["SQL Original Statement"] || createTriggerRows[0]?.["Create Trigger"]
        : null;
      if (!createTrigger) {
        continue;
      }

      sqlParts.push(`DROP TRIGGER IF EXISTS ${escapeIdentifier(triggerName)};`);
      sqlParts.push(`${createTrigger};`);
      sqlParts.push("");
    }
  }

  sqlParts.push("SET FOREIGN_KEY_CHECKS=1;");
  sqlParts.push("");

  return sqlParts.join("\n");
};

const listBackupFiles = async () => {
  await ensureBackupDir();
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
      .map(async (entry) => {
        const filePath = path.join(backupDir, entry.name);
        const stats = await fs.stat(filePath);
        return {
          id: entry.name,
          file_name: entry.name,
          created_at: stats.birthtime?.toISOString?.() || stats.mtime.toISOString(),
          size: stats.size,
        };
      })
  );

  return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const dashboardPath = () => (appBasePath === "/" ? "/dashboard" : `${appBasePath}/dashboard`);

const sanitizeUser = (row) => ({
  id: Number(row.id),
  name: row.name,
  email: row.email,
  role: row.role === "admin" ? "admin" : "staff",
  is_active: Number(row.is_active ?? 0),
  phone: row.phone ?? "",
  last_login: row.last_login ?? null,
  created_at: row.created_at ?? null,
  updated_at: row.updated_at ?? null,
});

const normalizePasswordHash = (hash) => {
  if (!hash) return "";
  return hash.startsWith("$2y$") ? `$2a$${hash.slice(4)}` : hash;
};

const comparePassword = async (plainTextPassword, storedHash) =>
  bcrypt.compare(plainTextPassword, normalizePasswordHash(storedHash));

const withDb = async (handler, res) => {
  let connection;
  try {
    connection = await getConnection();
    return await handler(connection);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database operation failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    connection?.release();
  }
};

const getTableColumns = async (connection, tableName) => {
  if (schemaCache.has(tableName)) {
    return schemaCache.get(tableName);
  }

  const [rows] = await connection.query(`DESCRIBE \`${tableName}\``);
  const columns = Array.isArray(rows) ? rows.map((row) => row.Field) : [];
  schemaCache.set(tableName, columns);
  return columns;
};

const filterPayloadByColumns = async (connection, tableName, payload, options = {}) => {
  const columns = await getTableColumns(connection, tableName);
  const excluded = new Set(["id", "created_at", "updated_at", ...(options.exclude || [])]);
  const filtered = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (!columns.includes(key) || excluded.has(key) || typeof value === "undefined") {
      continue;
    }
    filtered[key] = value;
  }

  return filtered;
};

const insertRow = async (connection, tableName, payload, options = {}) => {
  const filtered = await filterPayloadByColumns(connection, tableName, payload, options);
  const entries = Object.entries(filtered);
  if (entries.length === 0) {
    throw new Error(`No valid fields supplied for ${tableName}`);
  }

  const columns = entries.map(([key]) => `\`${key}\``).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  const values = entries.map(([, value]) => value);

  const [result] = await connection.query(
    `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
    values
  );

  return result.insertId;
};

const updateRow = async (connection, tableName, id, payload, options = {}) => {
  const filtered = await filterPayloadByColumns(connection, tableName, payload, options);
  const entries = Object.entries(filtered);
  if (entries.length === 0) {
    throw new Error(`No valid fields supplied for ${tableName}`);
  }

  const assignments = entries.map(([key]) => `\`${key}\` = ?`).join(", ");
  const values = entries.map(([, value]) => value);
  values.push(id);

  await connection.query(
    `UPDATE \`${tableName}\` SET ${assignments} WHERE id = ?`,
    values
  );
};

const deleteRow = async (connection, tableName, id) => {
  await connection.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
};

const normalizeServiceStatus = (serviceRow) => {
  const parsedStatuses = parseJsonArray(serviceRow.battery_statuses_json);
  const firstStatus = parsedStatuses[0]?.service_status;
  if (firstStatus) return String(firstStatus);
  if (serviceRow.payment_status === "paid") return "completed";
  return "pending";
};

const mapBatteryRow = (row) => ({
  ...row,
  is_spare: row.is_spare ?? 0,
  spare_status: row.spare_status ?? "available",
  total_services: row.total_services ?? 0,
  last_service_date: row.last_service_date ?? null,
});

const fetchBatteriesByIds = async (connection, ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT * FROM batteries WHERE id IN (${placeholders})`,
    ids
  );
  return Array.isArray(rows) ? rows.map(mapBatteryRow) : [];
};

const fetchInvertersByIds = async (connection, ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT i.*,
            (SELECT COUNT(*) FROM inverter_services s
             WHERE s.inverter_id = i.id OR JSON_CONTAINS(COALESCE(s.inverter_ids, '[]'), CAST(i.id AS JSON), '$')) AS total_services
     FROM inverters i
     WHERE i.id IN (${placeholders})`,
    ids
  );
  return Array.isArray(rows) ? rows : [];
};

const fetchServiceOrders = async (connection, filters = {}) => {
  const where = [];
  const params = [];

  if (filters.id) {
    where.push("s.id = ?");
    params.push(filters.id);
  }

  if (filters.customerId) {
    where.push("s.customer_id = ?");
    params.push(filters.customerId);
  }

  const [rows] = await connection.query(
    `SELECT s.*,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.address AS customer_address,
            c.alternate_phone AS customer_alternate_phone,
            c.city AS customer_city,
            c.state AS customer_state,
            u.name AS staff_name,
            u.email AS staff_email,
            b.battery_model,
            b.battery_serial,
            b.brand AS battery_brand,
            b.capacity AS battery_capacity,
            b.voltage AS battery_voltage,
            b.battery_type,
            i.inverter_model,
            i.inverter_serial
     FROM service_orders s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN users u ON u.id = s.service_staff_id
     LEFT JOIN batteries b ON b.id = s.battery_id
     LEFT JOIN inverters i ON i.id = s.inverter_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY s.created_at DESC`,
    params
  );

  const list = Array.isArray(rows) ? rows : [];
  const mapped = [];

  for (const row of list) {
    const batteryIds = normalizeIdArray(row.battery_ids);
    const inverterIds = normalizeIdArray(row.inverter_ids);
    const batteries = await fetchBatteriesByIds(connection, batteryIds);
    const inverters = await fetchInvertersByIds(connection, inverterIds);

    mapped.push({
      ...row,
      status: normalizeServiceStatus(row),
      service_type: "battery_service",
      battery_ids: batteryIds,
      inverter_ids: inverterIds,
      batteries,
      inverters,
    });
  }

  return mapped;
};

const buildPendingCallWaterStatus = async (connection, serviceRow) => {
  const customerId = parseId(serviceRow.customer_id);
  const params = customerId ? [customerId] : [parseId(serviceRow.id) || 0];
  const whereClause = customerId ? "ws.customer_id = ?" : "ws.service_id = ?";

  const [rows] = await connection.query(
    `SELECT ws.id, ws.service_id, ws.amount, ws.service_date, ws.notes, so.service_code
     FROM water_services ws
     LEFT JOIN service_orders so ON so.id = ws.service_id
     WHERE ${whereClause}
     ORDER BY ws.service_date DESC, ws.created_at DESC
     LIMIT 1`,
    params
  );

  const lastService = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (!lastService) {
    return {
      has_service_this_month: false,
      current_month: currentMonth,
      last_service: null,
      days_since_last_service: null,
      pending_status: "never_serviced",
    };
  }

  const serviceDate = new Date(lastService.service_date);
  const today = new Date();
  const diffDays = Number.isNaN(serviceDate.getTime())
    ? null
    : Math.max(0, Math.floor((today.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24)));
  const lastServiceMonth = Number.isNaN(serviceDate.getTime())
    ? ""
    : serviceDate.toISOString().slice(0, 7);

  return {
    has_service_this_month: lastServiceMonth === currentMonth,
    current_month: currentMonth,
    last_service: {
      id: Number(lastService.id),
      service_id: Number(lastService.service_id),
      service_code: lastService.service_code || serviceRow.service_code || "",
      amount: parseNumber(lastService.amount),
      service_date: lastService.service_date,
      notes: lastService.notes || "",
    },
    days_since_last_service: diffDays,
    pending_status: diffDays === null
      ? "unknown"
      : diffDays > 30
        ? "overdue"
        : lastServiceMonth === currentMonth
          ? "up_to_date"
          : "due_soon",
  };
};

const buildPendingCallActiveServices = (serviceRow) => {
  const list = [{
    service_code: serviceRow.service_code || "",
    battery_model: serviceRow.battery_model || undefined,
    inverter_model: serviceRow.inverter_model || undefined,
    product_name: serviceRow.battery_model || serviceRow.inverter_model || undefined,
    product_names: [
      serviceRow.battery_model,
      serviceRow.inverter_model,
    ].filter(Boolean),
    serial_number: serviceRow.battery_serial || serviceRow.inverter_serial || undefined,
    serial_numbers: [
      serviceRow.battery_serial,
      serviceRow.inverter_serial,
    ].filter(Boolean),
    created_date: serviceRow.created_at || "",
  }];

  return {
    count: list.length,
    list,
  };
};

const pendingPriorityWeight = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const resolvePendingPriority = (currentPriority, nextPriority) => {
  const current = String(currentPriority || "medium").toLowerCase();
  const next = String(nextPriority || "medium").toLowerCase();
  return (pendingPriorityWeight[next] || 0) > (pendingPriorityWeight[current] || 0) ? next : current;
};

const fetchInverterServices = async (connection, filters = {}) => {
  const where = [];
  const params = [];

  if (filters.id) {
    where.push("s.id = ?");
    params.push(filters.id);
  }

  const [rows] = await connection.query(
    `SELECT s.*,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.address AS customer_address,
            u.name AS staff_name,
            u.email AS staff_email,
            i.inverter_model,
            i.inverter_serial,
            i.inverter_brand,
            i.power_rating AS inverter_power_rating,
            i.type AS inverter_type,
            i.wave_type AS inverter_wave_type
     FROM inverter_services s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN users u ON u.id = s.service_staff_id
     LEFT JOIN inverters i ON i.id = s.inverter_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY s.created_at DESC`,
    params
  );

  const list = Array.isArray(rows) ? rows : [];
  const mapped = [];

  for (const row of list) {
    const inverterIds = normalizeIdArray(row.inverter_ids);
    const inverters = await fetchInvertersByIds(connection, inverterIds);
    mapped.push({
      ...row,
      service_type: "inverter_service",
      inverter_ids: inverterIds,
      inverters,
    });
  }

  return mapped;
};

const buildServiceBatteryStatuses = (batteryIds, status) =>
  JSON.stringify(
    batteryIds.map((batteryId) => ({
      battery_id: batteryId,
      service_status: status || "pending",
    }))
  );

const normalizeBatteryClaim = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "none" || normalized === "null") {
    return null;
  }

  const allowedClaims = new Set(["shop", "company", "suntocomp", "comptosun"]);
  return allowedClaims.has(normalized) ? normalized : null;
};

const getDateWindow = (query) => {
  const today = new Date();
  const year = parseNumber(query.year, today.getFullYear());
  const month = parseId(query.month);
  const dateRange = String(query.date_range || "all");
  const customFrom = query.from_date ? new Date(String(query.from_date)) : null;
  const customTo = query.to_date ? new Date(String(query.to_date)) : null;

  let from = new Date(year, 0, 1);
  let to = new Date(year, 11, 31, 23, 59, 59, 999);

  if (dateRange === "custom" && customFrom && customTo && !Number.isNaN(customFrom.getTime()) && !Number.isNaN(customTo.getTime())) {
    from = customFrom;
    to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
  } else if (month) {
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (dateRange === "today") {
    from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  } else if (dateRange === "week") {
    from = new Date(today);
    from.setDate(today.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    to = new Date(today);
    to.setHours(23, 59, 59, 999);
  } else if (dateRange === "month") {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (dateRange === "year" || dateRange === "all") {
    from = new Date(year, 0, 1);
    to = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  const fmt = (date) => date.toISOString().slice(0, 10);
  return {
    from,
    to,
    fromSql: fmt(from),
    toSql: fmt(to),
    period: month ? `${year}-${String(month).padStart(2, "0")}` : `${year}`,
  };
};

const sumBy = (rows, field) =>
  rows.reduce((sum, row) => sum + parseNumber(row[field]), 0);

const summarizeIncome = (rows, amountField, customerField) => {
  const amounts = rows.map((row) => parseNumber(row[amountField]));
  const total = amounts.reduce((sum, value) => sum + value, 0);
  return {
    total,
    transaction_count: rows.length,
    unique_customers: new Set(rows.map((row) => row[customerField]).filter(Boolean)).size,
    average: rows.length ? total / rows.length : 0,
    min: rows.length ? Math.min(...amounts) : 0,
    max: rows.length ? Math.max(...amounts) : 0,
  };
};

const summarizeExpenses = (rows) => {
  const petrol = rows
    .filter((row) => row.expense_type === "petrol")
    .reduce((sum, row) => sum + parseNumber(row.amount), 0);
  const others = rows
    .filter((row) => row.expense_type !== "petrol")
    .reduce((sum, row) => sum + parseNumber(row.amount), 0);
  return {
    by_type: {
      petrol,
      others,
    },
    total: petrol + others,
  };
};

const summarizeSalaries = (rows) => ({
  base_salary: rows.reduce((sum, row) => sum + parseNumber(row.amount), 0),
  bonus: rows.reduce((sum, row) => sum + parseNumber(row.bonus), 0),
  deductions: rows.reduce((sum, row) => sum + parseNumber(row.deductions), 0),
  total: rows.reduce((sum, row) => sum + parseNumber(row.net_amount), 0),
  unique_staff: new Set(rows.map((row) => row.staff_id).filter(Boolean)).size,
});

app.post("/api/login.php", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  await withDb(async (connection) => {
    const [rows] = await connection.query(
      `SELECT id, name, email, password, role, phone, is_active, last_login, created_at, updated_at
       FROM users WHERE LOWER(email) = ? LIMIT 1`,
      [email]
    );

    const userRow = Array.isArray(rows) ? rows[0] : null;
    if (!userRow) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    if (!Number(userRow.is_active)) {
      res.status(403).json({ success: false, message: "Your account is inactive. Please contact admin." });
      return;
    }

    const passwordMatches = await comparePassword(password, String(userRow.password || ""));
    if (!passwordMatches) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    await connection.query("UPDATE users SET last_login = NOW() WHERE id = ?", [userRow.id]);
    const user = sanitizeUser({ ...userRow, last_login: new Date().toISOString() });
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user,
      role: user.role,
      redirect_to: dashboardPath(),
      dashboard_url: dashboardPath(),
    });
  }, res);
});

app.get("/api/users.php", async (_req, res) => {
  await withDb(async (connection) => {
    const [rows] = await connection.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ success: true, users: Array.isArray(rows) ? rows.map(sanitizeUser) : [] });
  }, res);
});

app.post("/api/users.php", async (req, res) => {
  await withDb(async (connection) => {
    const payload = { ...req.body };
    if (!payload.name || !payload.email || !payload.password) {
      res.status(400).json({ success: false, message: "Name, email and password are required" });
      return;
    }
    payload.password = await bcrypt.hash(String(payload.password), 10);
    payload.role = payload.role === "admin" ? "admin" : "staff";
    payload.is_active = Number(payload.is_active ?? 1) ? 1 : 0;
    const id = await insertRow(connection, "users", payload);
    const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "User created successfully", user: sanitizeUser(rows[0]) });
  }, res);
});

app.put("/api/users.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid user id is required" });
    return;
  }
  await withDb(async (connection) => {
    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await bcrypt.hash(String(payload.password), 10);
    }
    if ("is_active" in payload) {
      payload.is_active = Number(payload.is_active) ? 1 : 0;
    }
    await updateRow(connection, "users", id, payload);
    const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "User updated successfully", user: sanitizeUser(rows[0]) });
  }, res);
});

app.delete("/api/users.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid user id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "users", id);
    res.json({ success: true, message: "User deleted successfully" });
  }, res);
});

app.get("/api/customers.php", async (_req, res) => {
  await withDb(async (connection) => {
    const [rows] = await connection.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM service_orders s WHERE s.customer_id = c.id) +
              (SELECT COUNT(*) FROM inverter_services i WHERE i.customer_id = c.id) AS total_services
       FROM customers c
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, customers: Array.isArray(rows) ? rows : [] });
  }, res);
});

app.post("/api/customers.php", async (req, res) => {
  await withDb(async (connection) => {
    const payload = { ...req.body };
    if (!payload.full_name || !payload.phone) {
      res.status(400).json({ success: false, message: "Full name and phone are required" });
      return;
    }
    payload.customer_code = payload.customer_code || generateCode("CUS");
    const id = await insertRow(connection, "customers", payload);
    const [rows] = await connection.query("SELECT * FROM customers WHERE id = ?", [id]);
    res.json({ success: true, message: "Customer saved successfully", customer: rows[0] });
  }, res);
});

app.put("/api/customers.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid customer id is required" });
    return;
  }
  await withDb(async (connection) => {
    await updateRow(connection, "customers", id, req.body);
    const [rows] = await connection.query("SELECT * FROM customers WHERE id = ?", [id]);
    res.json({ success: true, message: "Customer updated successfully", customer: rows[0] });
  }, res);
});

app.delete("/api/customers.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid customer id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "customers", id);
    res.json({ success: true, message: "Customer deleted successfully" });
  }, res);
});

app.get("/api/batteries.php", async (_req, res) => {
  await withDb(async (connection) => {
    const [rows] = await connection.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM service_orders s WHERE s.battery_id = b.id) AS total_services,
              (SELECT MAX(service_date) FROM water_services w WHERE w.battery_id = b.id) AS last_service_date
       FROM batteries b
       ORDER BY b.created_at DESC`
    );
    const batteries = Array.isArray(rows) ? rows.map(mapBatteryRow) : [];
    res.json({ success: true, data: { batteries }, batteries });
  }, res);
});

app.post("/api/batteries.php", async (req, res) => {
  await withDb(async (connection) => {
    const payload = { ...req.body, battery_code: req.body?.battery_code || generateCode("BAT") };
    const id = await insertRow(connection, "batteries", payload);
    const [rows] = await connection.query("SELECT * FROM batteries WHERE id = ?", [id]);
    res.json({ success: true, message: "Battery saved successfully", battery: mapBatteryRow(rows[0]) });
  }, res);
});

app.put("/api/batteries.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid battery id is required" });
    return;
  }
  await withDb(async (connection) => {
    await updateRow(connection, "batteries", id, req.body);
    const [rows] = await connection.query("SELECT * FROM batteries WHERE id = ?", [id]);
    res.json({ success: true, message: "Battery updated successfully", battery: mapBatteryRow(rows[0]) });
  }, res);
});

app.delete("/api/batteries.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid battery id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "batteries", id);
    res.json({ success: true, message: "Battery deleted successfully" });
  }, res);
});

app.get("/api/inverters.php", async (_req, res) => {
  await withDb(async (connection) => {
    const [rows] = await connection.query(
      `SELECT i.*,
              (SELECT COUNT(*) FROM inverter_services s
               WHERE s.inverter_id = i.id OR JSON_CONTAINS(COALESCE(s.inverter_ids, '[]'), CAST(i.id AS JSON), '$')) AS total_services
       FROM inverters i
       ORDER BY i.created_at DESC`
    );
    res.json({ success: true, data: Array.isArray(rows) ? rows : [], inverters: Array.isArray(rows) ? rows : [] });
  }, res);
});

app.post("/api/inverters.php", async (req, res) => {
  await withDb(async (connection) => {
    const payload = { ...req.body, inverter_code: req.body?.inverter_code || generateCode("INV") };
    const id = await insertRow(connection, "inverters", payload);
    const [rows] = await connection.query("SELECT * FROM inverters WHERE id = ?", [id]);
    res.json({ success: true, message: "Inverter saved successfully", inverter: rows[0] });
  }, res);
});

app.put("/api/inverters.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid inverter id is required" });
    return;
  }
  await withDb(async (connection) => {
    await updateRow(connection, "inverters", id, req.body);
    const [rows] = await connection.query("SELECT * FROM inverters WHERE id = ?", [id]);
    res.json({ success: true, message: "Inverter updated successfully", inverter: rows[0] });
  }, res);
});

app.delete("/api/inverters.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid inverter id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "inverters", id);
    res.json({ success: true, message: "Inverter deleted successfully" });
  }, res);
});

app.get("/api/services.php", async (req, res) => {
  await withDb(async (connection) => {
    const id = parseId(req.query.id);
    const data = await fetchServiceOrders(connection, { id });
    res.json({ success: true, data: id ? data[0] || null : data });
  }, res);
});

app.post("/api/services.php", async (req, res) => {
  await withDb(async (connection) => {
    const batteryIds = normalizeIdArray(req.body?.battery_ids);
    const inverterIds = normalizeIdArray(req.body?.inverter_ids);
    const payload = {
      ...req.body,
      service_code: req.body?.service_code || generateCode("SVC"),
      battery_id: parseId(req.body?.battery_id) || batteryIds[0] || null,
      inverter_id: parseId(req.body?.inverter_id) || inverterIds[0] || null,
      battery_ids: JSON.stringify(batteryIds),
      inverter_ids: JSON.stringify(inverterIds),
      estimated_completion_date: normalizeNullableDate(req.body?.estimated_completion_date),
      battery_claim: normalizeBatteryClaim(req.body?.battery_claim),
      battery_statuses_json: buildServiceBatteryStatuses(batteryIds, req.body?.status),
    };
    const id = await insertRow(connection, "service_orders", payload);
    const data = await fetchServiceOrders(connection, { id });
    res.json({ success: true, message: "Service saved successfully", data: data[0] || null });
  }, res);
});

app.put("/api/services.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid service id is required" });
    return;
  }
  await withDb(async (connection) => {
    const batteryIds = normalizeIdArray(req.body?.battery_ids);
    const inverterIds = normalizeIdArray(req.body?.inverter_ids);
    const payload = {
      ...req.body,
      battery_id: parseId(req.body?.battery_id) || batteryIds[0] || null,
      inverter_id: parseId(req.body?.inverter_id) || inverterIds[0] || null,
      battery_ids: JSON.stringify(batteryIds),
      inverter_ids: JSON.stringify(inverterIds),
      estimated_completion_date: normalizeNullableDate(req.body?.estimated_completion_date),
      battery_claim: normalizeBatteryClaim(req.body?.battery_claim),
    };
    if (batteryIds.length) {
      payload.battery_statuses_json = buildServiceBatteryStatuses(batteryIds, req.body?.status);
    }
    await updateRow(connection, "service_orders", id, payload);
    const data = await fetchServiceOrders(connection, { id });
    res.json({ success: true, message: "Service updated successfully", data: data[0] || null });
  }, res);
});

app.delete("/api/services.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid service id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "service_orders", id);
    res.json({ success: true, message: "Service deleted successfully" });
  }, res);
});

app.get("/api/inverter_services.php", async (req, res) => {
  await withDb(async (connection) => {
    const id = parseId(req.query.id);
    const data = await fetchInverterServices(connection, { id });
    res.json({ success: true, data: id ? data[0] || null : data });
  }, res);
});

app.post("/api/inverter_services.php", async (req, res) => {
  await withDb(async (connection) => {
    const inverterIds = normalizeIdArray(req.body?.inverter_ids);
    const payload = {
      ...req.body,
      service_code: req.body?.service_code || generateCode("IVS"),
      inverter_id: parseId(req.body?.inverter_id) || inverterIds[0] || null,
      inverter_ids: JSON.stringify(inverterIds),
      estimated_completion_date: normalizeNullableDate(req.body?.estimated_completion_date),
    };
    const id = await insertRow(connection, "inverter_services", payload);
    const data = await fetchInverterServices(connection, { id });
    res.json({ success: true, message: "Inverter service saved successfully", data: data[0] || null });
  }, res);
});

app.put("/api/inverter_services.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid inverter service id is required" });
    return;
  }
  await withDb(async (connection) => {
    const inverterIds = normalizeIdArray(req.body?.inverter_ids);
    const payload = {
      ...req.body,
      inverter_id: parseId(req.body?.inverter_id) || inverterIds[0] || null,
      inverter_ids: JSON.stringify(inverterIds),
      estimated_completion_date: normalizeNullableDate(req.body?.estimated_completion_date),
    };
    await updateRow(connection, "inverter_services", id, payload);
    const data = await fetchInverterServices(connection, { id });
    res.json({ success: true, message: "Inverter service updated successfully", data: data[0] || null });
  }, res);
});

app.delete("/api/inverter_services.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid inverter service id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "inverter_services", id);
    res.json({ success: true, message: "Inverter service deleted successfully" });
  }, res);
});

app.get("/api/pending_calls.php", async (req, res) => {
  const city = String(req.query.city || "").trim();
  await withDb(async (connection) => {
    const services = await fetchServiceOrders(connection);
    const filtered = services.filter((service) => {
      const status = String(service.status || "").toLowerCase();
      const cityMatch = !city || String(service.customer_city || "").toLowerCase() === city.toLowerCase();
      return cityMatch && !["completed", "delivered", "cancelled"].includes(status);
    });

    const pendingCallMap = new Map();
    for (const service of filtered) {
      const customerId = Number(service.customer_id || 0);
      const key = customerId > 0 ? `customer-${customerId}` : `service-${service.id}`;
      const activeServices = buildPendingCallActiveServices(service);
      const existing = pendingCallMap.get(key);

      if (!existing) {
        pendingCallMap.set(key, {
          id: customerId || Number(service.id || 0),
          customer_id: customerId,
          customer_code: service.customer_code || "",
          full_name: service.customer_name || "",
          email: service.customer_email || "",
          phone: service.customer_phone || "",
          address: service.customer_address || "",
          city: service.customer_city || city,
          state: service.customer_state || "",
          zip_code: service.customer_zip_code || "",
          notes: service.notes || null,
          created_at: service.created_at,
          updated_at: service.updated_at,
          active_services: activeServices,
          water_service_status: await buildPendingCallWaterStatus(connection, service),
          priority: String(service.priority || "medium").toLowerCase(),
        });
        continue;
      }

      existing.priority = resolvePendingPriority(existing.priority, service.priority);
      existing.updated_at = new Date(service.updated_at || 0) > new Date(existing.updated_at || 0)
        ? service.updated_at
        : existing.updated_at;
      existing.created_at = new Date(service.created_at || 0) < new Date(existing.created_at || 0)
        ? service.created_at
        : existing.created_at;
      if (!existing.notes && service.notes) {
        existing.notes = service.notes;
      }
      if (!existing.email && service.customer_email) {
        existing.email = service.customer_email;
      }
      if (!existing.phone && service.customer_phone) {
        existing.phone = service.customer_phone;
      }

      const mergedServices = [...existing.active_services.list];
      for (const activeService of activeServices.list) {
        const duplicate = mergedServices.some((item) => item.service_code === activeService.service_code);
        if (!duplicate) {
          mergedServices.push(activeService);
        }
      }
      existing.active_services = {
        count: mergedServices.length,
        list: mergedServices,
      };
    }

    const pendingCalls = Array.from(pendingCallMap.values())
      .filter((call) => !call.water_service_status?.has_service_this_month)
      .sort(
      (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    );

    res.json({
      success: true,
      city,
      total_pending_calls: pendingCalls.length,
      current_month: new Date().toISOString().slice(0, 7),
      pending_calls: pendingCalls,
    });
  }, res);
});

app.get("/api/salary.php", async (req, res) => {
  await withDb(async (connection) => {
    const action = String(req.query.action || "");
    const staffId = parseId(req.query.staff_id);
    const month = String(req.query.month || "");

    if (action === "stats") {
      const where = [];
      const params = [];
      if (staffId) {
        where.push("staff_id = ?");
        params.push(staffId);
      }
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS total_records,
                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(SUM(bonus), 0) AS total_bonus,
                COALESCE(SUM(deductions), 0) AS total_deductions,
                COALESCE(SUM(net_amount), 0) AS total_net_amount
         FROM salary
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
        params
      );
      res.json({ success: true, data: rows[0] || {} });
      return;
    }

    const where = [];
    const params = [];
    if (staffId) {
      where.push("staff_id = ?");
      params.push(staffId);
    }
    if (month) {
      where.push("salary_month = ?");
      params.push(month);
    }
    const [rows] = await connection.query(
      `SELECT * FROM salary ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY salary_date DESC, created_at DESC`,
      params
    );
    res.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  }, res);
});

function getSalaryDateFromMonth(salaryMonth) {
  const month = String(salaryMonth || "").trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }
  return `${month}-28`;
}

app.post("/api/salary.php", async (req, res) => {
  await withDb(async (connection) => {
    const payload = { ...req.body };
    if (!payload.staff_name || !payload.salary_month) {
      res.status(400).json({ success: false, message: "Salary data is incomplete" });
      return;
    }
    payload.salary_date = getSalaryDateFromMonth(payload.salary_month);
    if (!payload.salary_date) {
      res.status(400).json({ success: false, message: "Salary month must be in YYYY-MM format" });
      return;
    }
    const id = await insertRow(connection, "salary", payload, { exclude: ["net_amount"] });
    const [rows] = await connection.query("SELECT * FROM salary WHERE id = ?", [id]);
    res.json({ success: true, message: "Salary recorded successfully", data: rows[0] });
  }, res);
});

app.put("/api/salary.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid salary id is required" });
    return;
  }
  await withDb(async (connection) => {
    const payload = { ...req.body };
    if (payload.salary_month !== undefined) {
      payload.salary_date = getSalaryDateFromMonth(payload.salary_month);
      if (!payload.salary_date) {
        res.status(400).json({ success: false, message: "Salary month must be in YYYY-MM format" });
        return;
      }
    } else {
      delete payload.salary_date;
    }
    await updateRow(connection, "salary", id, payload, { exclude: ["net_amount"] });
    const [rows] = await connection.query("SELECT * FROM salary WHERE id = ?", [id]);
    res.json({ success: true, message: "Salary updated successfully", data: rows[0] });
  }, res);
});

app.delete("/api/salary.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid salary id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "salary", id);
    res.json({ success: true, message: "Salary deleted successfully" });
  }, res);
});

app.get("/api/expenses.php", async (req, res) => {
  await withDb(async (connection) => {
    const action = String(req.query.action || "");
    const staffId = parseId(req.query.staff_id);

    if (action === "stats") {
      const where = [];
      const params = [];
      if (staffId) {
        where.push("staff_id = ?");
        params.push(staffId);
      }
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS total_records,
                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(SUM(CASE WHEN expense_type = 'petrol' THEN amount ELSE 0 END), 0) AS petrol_amount,
                COALESCE(SUM(CASE WHEN expense_type <> 'petrol' THEN amount ELSE 0 END), 0) AS others_amount
         FROM expenses
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
        params
      );
      res.json({ success: true, data: rows[0] || {} });
      return;
    }

    const where = [];
    const params = [];
    if (staffId) {
      where.push("staff_id = ?");
      params.push(staffId);
    }
    const [rows] = await connection.query(
      `SELECT * FROM expenses ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY expense_date DESC, created_at DESC`,
      params
    );
    res.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  }, res);
});

app.post("/api/expenses.php", async (req, res) => {
  await withDb(async (connection) => {
    const id = await insertRow(connection, "expenses", req.body);
    const [rows] = await connection.query("SELECT * FROM expenses WHERE id = ?", [id]);
    res.json({ success: true, message: "Expense recorded successfully", data: rows[0] });
  }, res);
});

app.put("/api/expenses.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid expense id is required" });
    return;
  }
  await withDb(async (connection) => {
    await updateRow(connection, "expenses", id, req.body);
    const [rows] = await connection.query("SELECT * FROM expenses WHERE id = ?", [id]);
    res.json({ success: true, message: "Expense updated successfully", data: rows[0] });
  }, res);
});

app.delete("/api/expenses.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid expense id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "expenses", id);
    res.json({ success: true, message: "Expense deleted successfully" });
  }, res);
});

app.get("/api/water_services.php", async (req, res) => {
  await withDb(async (connection) => {
    const action = String(req.query.action || "");

    if (action === "staff_list") {
      const [rows] = await connection.query(
        "SELECT id, name FROM users WHERE is_active = 1 ORDER BY name ASC"
      );
      res.json({ success: true, records: Array.isArray(rows) ? rows : [] });
      return;
    }

    if (action === "staff_monthly_summary") {
      const month = String(req.query.month || "");
      const [rows] = await connection.query(
        `SELECT ws.id, ws.service_id, ws.amount, ws.service_date, ws.notes, ws.service_staff_id,
                u.name AS service_staff_name, so.service_code, c.full_name AS customer_name
         FROM water_services ws
         LEFT JOIN users u ON u.id = ws.service_staff_id
         LEFT JOIN service_orders so ON so.id = ws.service_id
         LEFT JOIN customers c ON c.id = ws.customer_id
         WHERE (? = '' OR DATE_FORMAT(ws.service_date, IF(LENGTH(?) = 4, '%Y', '%Y-%m')) = ?)
         ORDER BY ws.service_date DESC, ws.created_at DESC`,
        [month, month, month]
      );
      res.json({ success: true, payments: Array.isArray(rows) ? rows : [] });
      return;
    }

    const id = parseId(req.query.id);
    const serviceId = parseId(req.query.service_id);
    const where = [];
    const params = [];
    if (id) {
      where.push("ws.id = ?");
      params.push(id);
    }
    if (serviceId) {
      where.push("ws.service_id = ?");
      params.push(serviceId);
    }

    const [rows] = await connection.query(
      `SELECT ws.*,
              u.name AS service_staff_name,
              so.service_code,
              c.full_name AS customer_name
       FROM water_services ws
       LEFT JOIN users u ON u.id = ws.service_staff_id
       LEFT JOIN service_orders so ON so.id = ws.service_id
       LEFT JOIN customers c ON c.id = ws.customer_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ws.service_date DESC, ws.created_at DESC`,
      params
    );
    res.json({ success: true, records: Array.isArray(rows) ? rows : [] });
  }, res);
});

app.post("/api/water_services.php", async (req, res) => {
  await withDb(async (connection) => {
    const id = await insertRow(connection, "water_services", req.body);
    const [rows] = await connection.query("SELECT * FROM water_services WHERE id = ?", [id]);
    res.json({ success: true, message: "Water service payment saved successfully", record: rows[0] });
  }, res);
});

app.put("/api/water_services.php", async (req, res) => {
  const id = parseId(req.query.id || req.body?.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid payment id is required" });
    return;
  }
  await withDb(async (connection) => {
    await updateRow(connection, "water_services", id, req.body);
    const [rows] = await connection.query("SELECT * FROM water_services WHERE id = ?", [id]);
    res.json({ success: true, message: "Water service payment updated successfully", record: rows[0] });
  }, res);
});

app.delete("/api/water_services.php", async (req, res) => {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ success: false, message: "Valid payment id is required" });
    return;
  }
  await withDb(async (connection) => {
    await deleteRow(connection, "water_services", id);
    res.json({ success: true, message: "Water service payment deleted successfully" });
  }, res);
});

app.get("/api/revenue.php", async (req, res) => {
  await withDb(async (connection) => {
    const window = getDateWindow(req.query);

    const [waterRows] = await connection.query(
      "SELECT * FROM water_services WHERE DATE(service_date) BETWEEN ? AND ?",
      [window.fromSql, window.toSql]
    );
    const [inverterRows] = await connection.query(
      "SELECT * FROM inverter_services WHERE DATE(created_at) BETWEEN ? AND ?",
      [window.fromSql, window.toSql]
    );
    const [expenseRows] = await connection.query(
      "SELECT * FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?",
      [window.fromSql, window.toSql]
    );
    const [salaryRows] = await connection.query(
      "SELECT * FROM salary WHERE DATE(salary_date) BETWEEN ? AND ?",
      [window.fromSql, window.toSql]
    );

    const waterServices = Array.isArray(waterRows) ? waterRows : [];
    const inverterServices = Array.isArray(inverterRows) ? inverterRows : [];
    const expenses = Array.isArray(expenseRows) ? expenseRows : [];
    const salaries = Array.isArray(salaryRows) ? salaryRows : [];

    const waterIncome = summarizeIncome(waterServices, "amount", "customer_id");
    const inverterIncome = summarizeIncome(inverterServices, "final_cost", "customer_id");

    const waterExpensesRows = expenses.filter((row) => row.service_type === "water");
    const inverterExpensesRows = expenses.filter((row) => row.service_type === "inverter");
    const waterSalaryRows = salaries.filter((row) => row.service_type === "water");
    const inverterSalaryRows = salaries.filter((row) => row.service_type === "inverter");

    const waterExpenseSummary = summarizeExpenses(waterExpensesRows);
    const inverterExpenseSummary = summarizeExpenses(inverterExpensesRows);
    const waterSalarySummary = summarizeSalaries(waterSalaryRows);
    const inverterSalarySummary = summarizeSalaries(inverterSalaryRows);

    const waterTotalCosts = waterExpenseSummary.total + waterSalarySummary.total;
    const inverterTotalCosts = inverterExpenseSummary.total + inverterSalarySummary.total;
    const waterNetProfit = waterIncome.total - waterTotalCosts;
    const inverterNetProfit = inverterIncome.total - inverterTotalCosts;

    const totalIncome = waterIncome.total + inverterIncome.total;
    const totalExpenses = waterExpenseSummary.total + inverterExpenseSummary.total;
    const totalSalaries = waterSalarySummary.total + inverterSalarySummary.total;
    const totalCosts = totalExpenses + totalSalaries;
    const netProfit = totalIncome - totalCosts;

    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const incomePercentage = totalIncome > 0 ? 100 : 0;
    const expensesPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    const salariesPercentage = totalIncome > 0 ? (totalSalaries / totalIncome) * 100 : 0;
    const profitPercentage = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    res.json({
      success: true,
      summary: {
        period: window.period,
        date_range: {
          from: window.fromSql,
          to: window.toSql,
        },
        water_services: {
          income: waterIncome,
          expenses: waterExpenseSummary,
          salaries: waterSalarySummary,
          total_costs: waterTotalCosts,
          net_profit: waterNetProfit,
          profit_margin: waterIncome.total > 0 ? (waterNetProfit / waterIncome.total) * 100 : 0,
          profit_status: waterNetProfit >= 0 ? "profit" : "loss",
        },
        inverter_services: {
          income: inverterIncome,
          expenses: inverterExpenseSummary,
          salaries: inverterSalarySummary,
          total_costs: inverterTotalCosts,
          net_profit: inverterNetProfit,
          profit_margin: inverterIncome.total > 0 ? (inverterNetProfit / inverterIncome.total) * 100 : 0,
          profit_status: inverterNetProfit >= 0 ? "profit" : "loss",
        },
        overall: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          total_salaries: totalSalaries,
          total_costs: totalCosts,
          net_profit: netProfit,
          profit_margin: profitMargin,
          profit_status: netProfit >= 0 ? "profit" : "loss",
          is_profitable: netProfit >= 0,
          total_transactions: waterServices.length + inverterServices.length,
          paid_transactions:
            waterServices.filter((row) => row.payment_status === "paid").length +
            inverterServices.filter((row) => row.payment_status === "paid").length,
          unique_customers: new Set([
            ...waterServices.map((row) => row.customer_id),
            ...inverterServices.map((row) => row.customer_id),
          ].filter(Boolean)).size,
        },
      },
      profit_analysis: {
        revenue_vs_costs: {
          income_percentage: incomePercentage,
          expenses_percentage: expensesPercentage,
          salaries_percentage: salariesPercentage,
          profit_percentage: profitPercentage,
        },
        break_even_point: {
          current_income: totalIncome,
          needed_income: totalCosts,
          gap: totalCosts - totalIncome,
          is_profitable: netProfit >= 0,
        },
        service_type_breakdown: {
          water_services: {
            income_percentage: totalIncome > 0 ? (waterIncome.total / totalIncome) * 100 : 0,
            costs_percentage: totalCosts > 0 ? (waterTotalCosts / totalCosts) * 100 : 0,
          },
          inverter_services: {
            income_percentage: totalIncome > 0 ? (inverterIncome.total / totalIncome) * 100 : 0,
            costs_percentage: totalCosts > 0 ? (inverterTotalCosts / totalCosts) * 100 : 0,
          },
        },
      },
    });
  }, res);
});

app.get("/api/dashboard_stats.php", async (req, res) => {
  await withDb(async (connection) => {
    const selectedYear = Math.max(2000, parseNumber(req.query.year, new Date().getFullYear()));
    const selectedMonth = Math.min(12, Math.max(1, parseNumber(req.query.month, new Date().getMonth() + 1)));

    const [countRows] = await connection.query(
      `SELECT
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM batteries) AS total_batteries,
          (SELECT COUNT(*) FROM inverters) AS total_inverters,
          (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_staff,
          (SELECT COUNT(*) FROM service_orders) AS total_services,
          (SELECT COUNT(*) FROM inverter_services) AS total_inverter_services`
    );

    const counts = Array.isArray(countRows) ? countRows[0] : {};
    const services = await fetchServiceOrders(connection);
    const pendingServices = services.filter((service) =>
      !["completed", "delivered", "cancelled"].includes(String(service.status || "").toLowerCase())
    ).length;

    const [waterRevenueRows] = await connection.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM water_services WHERE MONTH(service_date) = ? AND YEAR(service_date) = ?",
      [selectedMonth, selectedYear]
    );
    const [inverterRevenueRows] = await connection.query(
      "SELECT COALESCE(SUM(final_cost), 0) AS total FROM inverter_services WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?",
      [selectedMonth, selectedYear]
    );
    const [expenseRows] = await connection.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?",
      [selectedMonth, selectedYear]
    );
    const [salaryRows] = await connection.query(
      "SELECT COALESCE(SUM(net_amount), 0) AS total FROM salary WHERE salary_month = ?",
      [`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`]
    );
    const [batteryConditionsRows] = await connection.query(
      "SELECT battery_condition, COUNT(*) AS count FROM batteries WHERE battery_condition IS NOT NULL GROUP BY battery_condition"
    );
    const [inverterConditionsRows] = await connection.query(
      "SELECT inverter_condition, COUNT(*) AS count FROM inverters WHERE inverter_condition IS NOT NULL GROUP BY inverter_condition"
    );
    const [warrantyRows] = await connection.query(
      "SELECT warranty_status, COUNT(*) AS count FROM service_orders WHERE warranty_status IS NOT NULL GROUP BY warranty_status"
    );

    const makeConditionMap = (rows, keyField) => {
      const map = { excellent: 0, good: 0, fair: 0, poor: 0, dead: 0 };
      for (const row of rows || []) {
        const key = String(row[keyField] || "").toLowerCase();
        if (key in map) {
          map[key] = Number(row.count || 0);
        }
      }
      return map;
    };

    const warrantyStatus = { "": 0, in_warranty: 0, extended_warranty: 0, out_of_warranty: 0, no_warranty: 0 };
    for (const row of warrantyRows || []) {
      const key = String(row.warranty_status || "");
      if (key in warrantyStatus) {
        warrantyStatus[key] = Number(row.count || 0);
      }
    }

    const waterRevenue = parseNumber(waterRevenueRows[0]?.total);
    const inverterRevenue = parseNumber(inverterRevenueRows[0]?.total);
    const monthlyExpenses = parseNumber(expenseRows[0]?.total);
    const monthlySalary = parseNumber(salaryRows[0]?.total);

    res.json({
      success: true,
      data: {
        total_customers: parseNumber(counts.total_customers),
        total_batteries: parseNumber(counts.total_batteries),
        total_inverters: parseNumber(counts.total_inverters),
        active_batteries: parseNumber(counts.total_batteries),
        active_inverters: parseNumber(counts.total_inverters),
        total_services: parseNumber(counts.total_services) + parseNumber(counts.total_inverter_services),
        pending_services: pendingServices,
        total_staff: parseNumber(counts.total_staff),
        monthly_revenue: waterRevenue + inverterRevenue,
        monthly_expenses: monthlyExpenses,
        monthly_salary: monthlySalary,
        monthly_profit: waterRevenue + inverterRevenue - monthlyExpenses - monthlySalary,
        battery_conditions: makeConditionMap(batteryConditionsRows, "battery_condition"),
        inverter_conditions: makeConditionMap(inverterConditionsRows, "inverter_condition"),
        warranty_status: warrantyStatus,
      },
      message: "Summary statistics retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  }, res);
});

app.get("/api/health", async (_req, res) => {
  await withDb(async (connection) => {
    const [rows] = await connection.query("SELECT DATABASE() AS db_name, NOW() AS server_time");
    res.json({
      success: true,
      runtime: "node",
      database: Array.isArray(rows) ? rows[0] : null,
      checked_at: new Date().toISOString(),
    });
  }, res);
});

app.get("/api/backup.php", async (req, res) => {
  const action = String(req.query.action || "").trim().toLowerCase();

  if (action === "list") {
    try {
      const files = await listBackupFiles();
      res.json({
        success: true,
        data: files,
        message: "Backup history retrieved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to load backup history",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (action === "download") {
    try {
      const fileName = sanitizeBackupFileName(req.query.file);
      if (!fileName) {
        res.status(400).json({ success: false, message: "Valid backup file name is required" });
        return;
      }

      const filePath = path.join(backupDir, fileName);
      await fs.access(filePath);
      res.download(filePath, fileName);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Backup file not found",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (action === "take_download") {
    let connection;
    try {
      await ensureBackupDir();
      connection = await getConnection();
      const fileName = buildBackupFileName(req.query.file);
      const filePath = path.join(backupDir, fileName);
      const backupSql = await buildDatabaseBackupSql(connection);

      await fs.writeFile(filePath, backupSql, "utf8");
      res.download(filePath, fileName);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create database backup",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      connection?.release();
    }
    return;
  }

  res.status(400).json({
    success: false,
    message: "Unsupported backup action",
  });
});

app.all(/^\/api\/.*\.php$/i, (req, res) => {
  res.status(501).json({
    success: false,
    message: `Node API route not implemented yet: ${req.path}`,
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

const bootstrap = async () => {
  const connection = await getConnection();
  try {
    await ensureSalarySchema(connection);
    await ensureServiceOrderTriggers(connection);
  } finally {
    connection.release();
  }

  app.listen(apiPort, () => {
    console.log(`SUN Office Node API running on http://localhost:${apiPort}`);
    console.log("PHP/Apache forwarding is disabled. Using Node.js + MySQL only.");
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start SUN Office Node API:", error);
  process.exit(1);
});
