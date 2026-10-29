CREATE TABLE IF NOT EXISTS ofs_episodes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_episodes_host_id ON ofs_episodes(host_id);
CREATE INDEX IF NOT EXISTS idx_ofs_episodes_status ON ofs_episodes(status);