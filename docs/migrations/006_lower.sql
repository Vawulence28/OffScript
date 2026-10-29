CREATE TABLE IF NOT EXISTS ofs_lower_thirds (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(150),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_lower_thirds_episode ON ofs_lower_thirds(episode_id);