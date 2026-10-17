// Uses Node's built-in SQLite (node:sqlite, Node >= 22.13), so there is no native
// module to compile and `npm install` works on Windows/macOS/Linux without build tools.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const dbFile = process.env.DB_FILE || path.join(__dirname, 'ats.db');
const raw = new DatabaseSync(dbFile);
raw.exec('PRAGMA journal_mode = WAL;');
raw.exec('PRAGMA foreign_keys = ON;');

raw.exec(`
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  position TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '',
  experience_years REAL NOT NULL DEFAULT 0,
  source TEXT,
  stage TEXT NOT NULL DEFAULT 'Applied',
  rating INTEGER,
  resume_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(stage);

CREATE TABLE IF NOT EXISTS stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Small wrapper so the rest of the code can use prepare() and transaction().
const db = {
  prepare: (sql) => raw.prepare(sql),
  exec: (sql) => raw.exec(sql),
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (e) {
      raw.exec('ROLLBACK');
      throw e;
    }
  },
};

module.exports = { db, STAGES };
