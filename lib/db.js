import Database from 'better-sqlite3';
import path from 'path';

let db;
export function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'portland.db');
    db = new Database(dbPath, { readonly: true });
    db.pragma('cache_size = 10000');
  }
  return db;
}
