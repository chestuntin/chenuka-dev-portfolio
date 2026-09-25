CREATE TABLE IF NOT EXISTS page_views (
  page TEXT PRIMARY KEY,
  total INTEGER NOT NULL
);

INSERT OR IGNORE INTO page_views (page, total) VALUES ('home', 0);

CREATE TABLE IF NOT EXISTS visitor_windows (
  visitor_id TEXT PRIMARY KEY,
  last_counted_at INTEGER NOT NULL
);
