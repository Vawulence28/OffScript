CREATE TABLE IF NOT EXISTS ofs_invitations (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    speaker_name VARCHAR(100) NOT NULL,
    speaker_email VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'WAITING', 'ADMITTED', 'REMOVED', 'EXPIRED', 'REVOKED')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_invitations_token ON ofs_invitations(token);
CREATE INDEX IF NOT EXISTS idx_ofs_invitations_episode ON ofs_invitations(episode_id);