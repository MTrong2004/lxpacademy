-- Migration 001: Initial Database Schema
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  approved INTEGER DEFAULT 0,
  blocked INTEGER DEFAULT 0,
  last_login TEXT,
  last_activity TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT NOT NULL,
  num INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT,
  answer TEXT NOT NULL,
  answer_text TEXT,
  images TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  has_image INTEGER DEFAULT 0,
  error_risk TEXT DEFAULT 'low',
  error_risk_reason TEXT,
  UNIQUE(subject_code, num)
);

CREATE TABLE IF NOT EXISTS edit_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER,
  question_num INTEGER,
  subject_code TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT,
  old_data TEXT,
  new_data TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS question_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  request_id INTEGER,
  previous_data TEXT,
  new_data TEXT,
  changed_by TEXT,
  approved_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS subject_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  questions_data TEXT,
  user_id TEXT NOT NULL,
  user_email TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS deleted_questions (
  id TEXT PRIMARY KEY,
  original_data TEXT NOT NULL,
  deleted_at TEXT DEFAULT (datetime('now')),
  deleted_by TEXT,
  deleted_by_email TEXT
);

CREATE TABLE IF NOT EXISTS deleted_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_data TEXT NOT NULL,
  deleted_at TEXT DEFAULT (datetime('now')),
  deleted_by TEXT,
  deleted_by_email TEXT
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
