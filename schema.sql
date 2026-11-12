CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, visitor TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS requests_visitor_time ON requests(visitor,created_at);
CREATE INDEX IF NOT EXISTS requests_time ON requests(created_at);
