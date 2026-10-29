const db = require('../config/db');

// Get YouTube destination setup for an episode
const getDestination = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      `SELECT id, episode_id, stream_url, is_active, status, updated_at 
       FROM ofs_youtube_destinations 
       WHERE episode_id = $1 AND host_id = $2`,
      [episode_id, host_id]
    );

    if (result.rows.length === 0) {
      return res.json({ destination: null });
    }

    return res.json({ destination: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Configure or update YouTube destination credentials
const configureDestination = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const { stream_url, stream_key, is_active } = req.body;
    const host_id = req.user.id;

    if (!stream_key && is_active) {
      return res.status(400).json({ error: 'A valid YouTube Stream Key is required to enable YouTube Live broadcasting.' });
    }

    // Verify episode belongs to host
    const epCheck = await db.query('SELECT id FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    const defaultUrl = stream_url || 'rtmp://a.rtmp.youtube.com/live2';

    const result = await db.query(
      `INSERT INTO ofs_youtube_destinations (episode_id, host_id, stream_url, stream_key, is_active, status)
       VALUES ($1, $2, $3, $4, $5, 'IDLE')
       ON CONFLICT (episode_id) 
       DO UPDATE SET 
         stream_url = EXCLUDED.stream_url,
         stream_key = EXCLUDED.stream_key,
         is_active = EXCLUDED.is_active,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, episode_id, stream_url, is_active, status`,
      [episode_id, host_id, defaultUrl, stream_key, is_active || false]
    );

    return res.status(200).json({
      message: 'YouTube Live destination configured successfully.',
      destination: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// Toggle active status
const toggleDestination = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const host_id = req.user.id;

    const dest = await db.query(
      `SELECT * FROM ofs_youtube_destinations WHERE episode_id = $1 AND host_id = $2`,
      [episode_id, host_id]
    );

    if (dest.rows.length === 0) {
      return res.status(404).json({ error: 'YouTube destination not configured.' });
    }

    const newActiveState = !dest.rows[0].is_active;

    const result = await db.query(
      `UPDATE ofs_youtube_destinations 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE episode_id = $2 AND host_id = $3 
       RETURNING id, episode_id, stream_url, is_active, status`,
      [newActiveState, episode_id, host_id]
    );

    return res.json({
      message: `YouTube Live output ${newActiveState ? 'enabled' : 'disabled'}.`,
      destination: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDestination,
  configureDestination,
  toggleDestination
};