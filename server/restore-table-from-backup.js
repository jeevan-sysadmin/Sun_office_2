import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const tableName = process.argv[2];
const backupFileName = process.argv[3] || "sun_office.sql";

if (!tableName) {
  console.error("Usage: node server/restore-table-from-backup.js <table_name> [backup_file]");
  process.exit(1);
}

const backupPath = path.resolve(
  process.env.PHP_API_BACKUP_DIR || "C:/xampp/htdocs/sun_office/api/backups",
  backupFileName,
);

if (!fs.existsSync(backupPath)) {
  console.error(`Backup file not found: ${backupPath}`);
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sun_office",
  multipleStatements: true,
});

const [[countRow]] = await connection.query(
  `SELECT COUNT(*) AS row_count FROM \`${tableName}\``,
);

if ((countRow?.row_count ?? 0) > 0) {
  console.log(
    `Skipped restore for ${tableName}: table already has ${countRow.row_count} row(s).`,
  );
  await connection.end();
  process.exit(0);
}

const backupContent = fs.readFileSync(backupPath, "utf8");
const insertPattern = new RegExp(
  String.raw`^INSERT INTO \`${tableName}\`[\s\S]*?;$`,
  "gm",
);
const insertStatements = backupContent.match(insertPattern) || [];

if (insertStatements.length === 0) {
  console.error(`No INSERT statements found for ${tableName} in ${backupPath}`);
  await connection.end();
  process.exit(1);
}

await connection.beginTransaction();

try {
  for (const statement of insertStatements) {
    await connection.query(statement);
  }

  await connection.query(
    `SET @max_id := (SELECT COALESCE(MAX(id), 0) FROM \`${tableName}\`)`,
  );
  await connection.query(
    `SET @sql := CONCAT('ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ', @max_id + 1)`,
  );
  await connection.query("PREPARE stmt FROM @sql");
  await connection.query("EXECUTE stmt");
  await connection.query("DEALLOCATE PREPARE stmt");

  await connection.commit();
  console.log(
    `Restored ${insertStatements.length} INSERT statement(s) into ${tableName} from ${backupPath}.`,
  );
} catch (error) {
  await connection.rollback();
  console.error(
    `Restore failed for ${tableName}:`,
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
} finally {
  await connection.end();
}
