CREATE TABLE IF NOT EXISTS ofs_live_sessions (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    status VARCHAR(30) DEFAULT 'IDLE' NOT NULL CHECK (status IN ('IDLE', 'LIVE', 'PAUSED', 'ENDED')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_live_sessions_episode ON ofs_live_sessions(episode_id);