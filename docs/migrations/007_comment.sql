CREATE TABLE IF NOT EXISTS ofs_comments (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_comments_episode ON ofs_comments(episode_id);