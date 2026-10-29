CREATE TABLE IF NOT EXISTS ofs_settings (
    id SERIAL PRIMARY KEY,
    host_id INTEGER REFERENCES ofs_users(id) UNIQUE NOT NULL,
    studio_name VARCHAR(100) DEFAULT 'OffScript Studio' NOT NULL,
    brand_color VARCHAR(20) DEFAULT '#e11d48' NOT NULL,
    auto_record BOOLEAN DEFAULT TRUE NOT NULL,
    retention_days INTEGER DEFAULT 30 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_settings_host ON ofs_settings(host_id);