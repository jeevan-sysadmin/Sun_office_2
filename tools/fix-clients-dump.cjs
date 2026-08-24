const fs = require("fs");
const path = require("path");

const inputPath =
  process.argv[2] ||
  "c:/Users/JEEVANLAROSH/Downloads/database file/clients.sql";
const outputPath =
  process.argv[3] ||
  "c:/Users/JEEVANLAROSH/Downloads/database file/clients_fixed_ordered.sql";
const batchSize = Number(process.argv[4] || 200);

function readInsertBlocks(sql) {
  const marker = "INSERT INTO `clients`";
  const blocks = [];
  let searchFrom = 0;

  while (true) {
    const start = sql.indexOf(marker, searchFrom);
    if (start === -1) {
      break;
    }

    const end = sql.indexOf(";\n", start);
    if (end === -1) {
      throw new Error("Could not find end of INSERT statement.");
    }

    blocks.push(sql.slice(start, end + 1));
    searchFrom = end + 2;
  }

  return blocks;
}

function extractId(row) {
  const match = row.match(/^\((\d+),/);
  if (!match) {
    throw new Error(`Could not read id from row: ${row.slice(0, 80)}`);
  }
  return Number(match[1]);
}

function main() {
  const sql = fs.readFileSync(inputPath, "utf8");
  const insertBlocks = readInsertBlocks(sql);

  if (insertBlocks.length === 0) {
    throw new Error("No client INSERT blocks found.");
  }

  const allRows = sql
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\(\d+,/.test(line))
    .map((line) => line.replace(/[;,]\s*$/, ""));

  const sortedRows = allRows
    .slice()
    .sort((left, right) => extractId(left) - extractId(right));

  const firstInsertLine =
    "INSERT INTO `clients` (`id`, `client_code`, `full_name`, `email`, `phone`, `address`, `city`, `state`, `zip_code`, `notes`, `created_at`, `updated_at`) VALUES";

  const firstInsertStart = sql.indexOf(insertBlocks[0]);
  const lastInsert = insertBlocks[insertBlocks.length - 1];
  const lastInsertStart = sql.lastIndexOf(lastInsert);
  const lastInsertEnd = lastInsertStart + lastInsert.length;
  const prefix = sql.slice(0, firstInsertStart);
  const suffix = sql.slice(lastInsertEnd);

  const batchedInserts = [];
  for (let i = 0; i < sortedRows.length; i += batchSize) {
    const batch = sortedRows.slice(i, i + batchSize);
    batchedInserts.push(`${firstInsertLine}\n${batch.join(",\n")};`);
  }

  const output = `${prefix}${batchedInserts.join("\n\n")}${suffix}`;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");

  const ids = sortedRows.map(extractId);
  const summary = {
    inputPath,
    outputPath,
    insertBlocks: insertBlocks.length,
    rowCount: sortedRows.length,
    minId: Math.min(...ids),
    maxId: Math.max(...ids),
    batchSize,
    outputInsertBlocks: Math.ceil(sortedRows.length / batchSize),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
