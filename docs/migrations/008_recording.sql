CREATE TABLE IF NOT EXISTS ofs_recordings (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    status VARCHAR(30) DEFAULT 'READY' NOT NULL CHECK (status IN ('PROCESSING', 'READY', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_recordings_episode ON ofs_recordings(episode_id);