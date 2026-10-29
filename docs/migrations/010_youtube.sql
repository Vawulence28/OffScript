CREATE TABLE IF NOT EXISTS ofs_youtube_destinations (
    id SERIAL PRIMARY KEY,
    episode_id INTEGER REFERENCES ofs_episodes(id) ON DELETE CASCADE,
    host_id INTEGER REFERENCES ofs_users(id) NOT NULL,
    stream_url VARCHAR(255) DEFAULT 'rtmp://a.rtmp.youtube.com/live2' NOT NULL,
    stream_key VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(30) DEFAULT 'IDLE' NOT NULL CHECK (status IN ('IDLE', 'CONNECTING', 'STREAMING', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofs_youtube_dest_episode ON ofs_youtube_destinations(episode_id);