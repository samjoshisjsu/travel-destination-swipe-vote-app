import initSqlJs from 'sql.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir   = join(__dirname, '../data');
mkdirSync(dataDir, { recursive: true });
export const dbPath = join(dataDir, 'app.db');

// Top-level await — works in ESM ("type": "module")
const SQL = await initSqlJs();

const fileBuffer = existsSync(dbPath) ? readFileSync(dbPath) : null;
const _db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

function save() {
  writeFileSync(dbPath, _db.export());
}

// Schema
_db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    image_url   TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT    NOT NULL,
    item_id    INTEGER NOT NULL REFERENCES items(id),
    choice     TEXT    NOT NULL CHECK(choice IN ('yes','no')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, item_id)
  );
`);
save();

// ── Helpers ──────────────────────────────────────────────────────────────────
export function all(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function one(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

export function run(sql, params = []) {
  _db.run(sql, params);
  save();
}

export function transaction(fn) {
  _db.run('BEGIN');
  try {
    fn();
    _db.run('COMMIT');
    save();
  } catch (e) {
    _db.run('ROLLBACK');
    throw e;
  }
}
