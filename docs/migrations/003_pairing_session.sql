CREATE TABLE IF NOT EXISTS ofs_pairing_sessions (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ofs_pairing_token ON ofs_pairing_sessions(token);
CREATE INDEX IF NOT EXISTS idx_ofs_pairing_episode ON ofs_pairing_sessions(episode_id);