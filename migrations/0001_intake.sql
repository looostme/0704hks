CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'collecting',
  skipped_categories_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS raw_inputs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  modality TEXT NOT NULL,
  source_uri TEXT NOT NULL,
  mime_type TEXT,
  quality_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  modality TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence TEXT NOT NULL,
  dimension_hint_json TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS profile_outputs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_inputs_session_id ON raw_inputs(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_session_id ON signals(session_id);
CREATE INDEX IF NOT EXISTS idx_profile_outputs_session_id ON profile_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_session_id ON audit_events(session_id);
