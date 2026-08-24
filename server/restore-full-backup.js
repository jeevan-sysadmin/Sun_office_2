import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const backupFileName = process.argv[2] || "sun_office.sql";

const backupPath = path.resolve(
  process.env.PHP_API_BACKUP_DIR || "C:/xampp/htdocs/sun_office/api/backups",
  backupFileName,
);

if (!fs.existsSync(backupPath)) {
  console.error(`Backup file not found: ${backupPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(backupPath, "utf8");

if (!sql.trim()) {
  console.error(`Backup file is empty: ${backupPath}`);
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sun_office",
});

const splitValues = (valuesText) => {
  const values = [];
  let current = "";
  let inQuote = false;

  for (let index = 0; index < valuesText.length; index += 1) {
    const char = valuesText[index];
    const nextChar = valuesText[index + 1];

    if (char === "'" && nextChar === "'") {
      current += "''";
      index += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      continue;
    }

    if (char === "," && !inQuote) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
};

const transformInsertStatement = (tableName, statement) => {
  if (tableName !== "salary") {
    return statement.replace(/^INSERT INTO/i, "INSERT IGNORE INTO");
  }

  const sanitizedStatement = statement.replace(/;$/, "");
  const match = sanitizedStatement.match(/^INSERT INTO `salary` \((.+)\) VALUES \((.+)\)$/i);
  if (!match) {
    return statement.replace(/^INSERT INTO/i, "INSERT IGNORE INTO");
  }

  const columns = match[1].split(",").map((column) => column.trim());
  const values = splitValues(match[2]);
  const netAmountIndex = columns.findIndex((column) => column === "`net_amount`");

  if (netAmountIndex === -1 || values.length !== columns.length) {
    return statement.replace(/^INSERT INTO/i, "INSERT IGNORE INTO");
  }

  columns.splice(netAmountIndex, 1);
  values.splice(netAmountIndex, 1);

  return `INSERT IGNORE INTO \`salary\` (${columns.join(", ")}) VALUES (${values.join(", ")})`;
};

try {
  const [tableRows] = await connection.query("SHOW TABLES");
  const existingTables = new Set(
    tableRows.map((row) => String(Object.values(row)[0])),
  );

  const insertStatements = sql
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^INSERT INTO `/i.test(line));

  let executed = 0;
  let skipped = 0;

  for (const statement of insertStatements) {
    const tableMatch = statement.match(/^INSERT INTO `([^`]+)`/i);
    const tableName = tableMatch?.[1];

    if (!tableName || !existingTables.has(tableName)) {
      skipped += 1;
      continue;
    }

    const transformedStatement = transformInsertStatement(tableName, statement);

    try {
      await connection.query(transformedStatement);
      executed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const ignorable =
        message.includes("Duplicate entry") ||
        message.includes("doesn't exist") ||
        message.includes("Unknown column") ||
        message.includes("Unknown table");

      if (ignorable) {
        skipped += 1;
        continue;
      }

      throw error;
    }
  }

  console.log(
    `Backup data sync completed from ${backupPath}. Executed ${executed} insert statement(s), skipped ${skipped}.`,
  );
} catch (error) {
  console.error(
    "Backup data sync failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
} finally {
  await connection.end();
}
