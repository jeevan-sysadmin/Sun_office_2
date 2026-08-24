import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sun_office",
  multipleStatements: true,
});

const statements = [
  `
  ALTER TABLE customers
    ADD COLUMN alternate_phone VARCHAR(20) DEFAULT NULL
  `,
  `
  ALTER TABLE service_orders
    ADD COLUMN inverter_id INT DEFAULT NULL
  `,
  `
  ALTER TABLE service_orders
    ADD COLUMN battery_ids LONGTEXT DEFAULT NULL
  `,
  `
  ALTER TABLE service_orders
    ADD COLUMN inverter_ids LONGTEXT DEFAULT NULL
  `,
  `
  ALTER TABLE service_orders
    MODIFY COLUMN battery_id INT NULL
  `,
  `
  ALTER TABLE service_orders
    MODIFY COLUMN issue_description TEXT NULL
  `,
  `
  ALTER TABLE service_orders
    MODIFY COLUMN estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00
  `,
  `
  ALTER TABLE service_orders
    MODIFY COLUMN estimated_completion_date DATE NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN inverter_brand VARCHAR(255) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN power_rating VARCHAR(50) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN type VARCHAR(50) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN wave_type ENUM('pure_sine','modified_sine','square_wave') DEFAULT 'modified_sine'
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN input_voltage VARCHAR(20) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN output_voltage VARCHAR(20) DEFAULT '230V'
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN efficiency VARCHAR(10) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN battery_voltage VARCHAR(20) DEFAULT '12V'
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN warranty_period VARCHAR(20) DEFAULT NULL
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN status VARCHAR(50) DEFAULT 'active'
  `,
  `
  ALTER TABLE inverters
    ADD COLUMN inverter_condition ENUM('excellent','good','fair','poor','dead') DEFAULT 'good'
  `,
  `
  CREATE TABLE IF NOT EXISTS inverter_services (
    id INT NOT NULL AUTO_INCREMENT,
    service_code VARCHAR(20) NOT NULL,
    customer_id INT NOT NULL,
    customer_phone VARCHAR(20) DEFAULT NULL,
    inverter_id INT DEFAULT NULL,
    service_staff_id INT DEFAULT NULL,
    issue_description TEXT DEFAULT NULL,
    diagnostic_results TEXT DEFAULT NULL,
    repair_description TEXT DEFAULT NULL,
    replacement_parts TEXT DEFAULT NULL,
    warranty_status ENUM('in_warranty','extended_warranty','out_of_warranty') NOT NULL DEFAULT 'out_of_warranty',
    amc_status ENUM('active','expired','no_amc') DEFAULT 'no_amc',
    status ENUM('pending','in_progress','diagnostic','repairing','testing','completed','delivered','cancelled') DEFAULT 'pending',
    priority ENUM('urgent','high','medium','low') DEFAULT 'medium',
    payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    final_cost DECIMAL(10,2) DEFAULT 0.00,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    estimated_completion_date DATE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    inverter_claim VARCHAR(50) DEFAULT 'none',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    inverter_ids LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
  CREATE TABLE IF NOT EXISTS expenses (
    id INT NOT NULL AUTO_INCREMENT,
    staff_id INT DEFAULT NULL,
    service_type ENUM('water','inverter') NOT NULL DEFAULT 'water',
    staff_name VARCHAR(100) NOT NULL,
    expense_type ENUM('petrol','others') NOT NULL DEFAULT 'others',
    amount DECIMAL(10,2) NOT NULL,
    description TEXT DEFAULT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash','card','online') DEFAULT 'cash',
    receipt_number VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
  CREATE TABLE IF NOT EXISTS salary (
    id INT NOT NULL AUTO_INCREMENT,
    staff_id INT NOT NULL,
    service_type ENUM('water','inverter') NOT NULL DEFAULT 'water',
    staff_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    salary_date DATE NOT NULL,
    salary_month VARCHAR(7) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    transaction_id VARCHAR(100) DEFAULT NULL,
    funding_source VARCHAR(50) DEFAULT NULL,
    funding_amount DECIMAL(10,2) DEFAULT NULL,
    funding_notes TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    paid_by INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
  CREATE TABLE IF NOT EXISTS water_services (
    id INT NOT NULL AUTO_INCREMENT,
    service_id INT NOT NULL,
    customer_id INT DEFAULT NULL,
    battery_id INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
    service_date DATE NOT NULL,
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    service_staff_id INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
  UPDATE inverters
  SET
    inverter_brand = COALESCE(inverter_brand, 'Unknown'),
    power_rating = COALESCE(power_rating, 'Unknown'),
    type = COALESCE(type, 'inverter'),
    input_voltage = COALESCE(input_voltage, '230V'),
    output_voltage = COALESCE(output_voltage, '230V'),
    battery_voltage = COALESCE(battery_voltage, '12V'),
    warranty_period = COALESCE(warranty_period, '1 year'),
    status = COALESCE(status, 'active'),
    inverter_condition = COALESCE(inverter_condition, 'good')
  `,
];

for (const statement of statements) {
  try {
    await connection.query(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ignorable =
      message.includes("Duplicate column name") ||
      message.includes("already exists");

    if (!ignorable) {
      console.error("Schema sync failed:", message);
      console.error("Statement:", statement);
      await connection.end();
      process.exit(1);
    }
  }
}

console.log("Local MySQL schema sync completed.");
await connection.end();
