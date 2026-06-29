-- Learning Hub schema for Turso / SQLite

create table if not exists profiles (
  id text primary key,
  email text unique,
  full_name text,
  avatar_url text,
  role text default 'user',
  approved integer default 0,
  blocked integer default 0,
  last_login text,
  last_activity text,
  created_at text default (datetime('now'))
);

create table if not exists subjects (
  id integer primary key autoincrement,
  code text unique not null,
  name text not null,
  description text,
  cover text,
  sort_order integer default 0,
  is_active integer default 1,
  created_at text default (datetime('now'))
);

create table if not exists questions (
  id integer primary key autoincrement,
  subject_code text default 'HOD102',
  num integer,
  question text,
  options text default '{}',
  answer text,
  answer_text text,
  images text default '[]',
  is_active integer default 1,
  created_at text default (datetime('now')),
  updated_at text default (datetime('now')),
  has_image integer default 0,
  error_risk text default 'low',
  error_risk_reason text,
  unique(subject_code, num)
);

create index if not exists idx_questions_subject_num on questions(subject_code, num);

create table if not exists edit_requests (
  id integer primary key autoincrement,
  question_id integer,
  question_num integer,
  subject_code text,
  user_id text,
  user_email text,
  old_data text,
  new_data text,
  reason text,
  status text default 'pending',
  admin_note text,
  reviewed_at text,
  reviewed_by text,
  created_at text default (datetime('now'))
);

create table if not exists question_history (
  id integer primary key autoincrement,
  question_id integer,
  question_num integer,
  subject_code text,
  request_id integer,
  previous_data text,
  new_data text,
  changed_by text,
  approved_by text,
  created_at text default (datetime('now'))
);

create table if not exists admin_logs (
  id integer primary key autoincrement,
  admin_id text,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  details text default '{}',
  created_at text default (datetime('now'))
);

create table if not exists subject_requests (
  id integer primary key autoincrement,
  code text not null,
  name text not null,
  description text,
  questions_data text default '[]',
  user_id text,
  user_email text,
  status text default 'pending',
  admin_note text,
  reviewed_at text,
  reviewed_by text,
  created_at text default (datetime('now'))
);

create table if not exists deleted_questions (
  id integer primary key,
  original_data text not null,
  deleted_at text default (datetime('now')),
  deleted_by text,
  deleted_by_email text
);

create table if not exists deleted_subjects (
  id integer primary key autoincrement,
  original_data text not null,
  deleted_by text,
  deleted_by_email text,
  deleted_at text default (datetime('now'))
);

create table if not exists site_settings (
  key text primary key,
  value text not null default '{}',
  updated_at text default (datetime('now')),
  updated_by text
);

create table if not exists discord_approval_logs (
  id integer primary key autoincrement,
  user_id text,
  user_email text,
  discord_user_id text,
  discord_username text,
  action text not null,
  message_id text,
  details text default '{}',
  created_at text default (datetime('now'))
);

insert into site_settings (key, value)
values ('registration_mode', '"approval"')
on conflict(key) do nothing;

insert into subjects (code, name, description, cover, sort_order, is_active)
values
  ('HOD102', 'HOD102 Learning', 'Bộ câu hỏi HOD102.', '', 1, 1),
  ('MLN111', 'MLN111 Learning', 'Bộ câu hỏi MLN111.', '', 2, 1)
on conflict(code) do update set
  name = excluded.name,
  description = excluded.description,
  cover = excluded.cover,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
