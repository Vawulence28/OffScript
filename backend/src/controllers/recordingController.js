const db = require('../config/db');

const getRecordings = async (req, res, next) => {
  try {
    const host_id = req.user.id;
    const result = await db.query(
      `SELECT r.*, e.title as episode_title, e.slug as episode_slug 
       FROM ofs_recordings r
       JOIN ofs_episodes e ON r.episode_id = e.id
       WHERE r.host_id = $1
       ORDER BY r.created_at DESC`,
      [host_id]
    );
    return res.json({ recordings: result.rows });
  } catch (err) {
    next(err);
  }
};

const createRecording = async (req, res, next) => {
  try {
    const { episode_id, file_url, file_size, duration_seconds } = req.body;
    const host_id = req.user.id;

    if (!episode_id || !file_url) {
      return res.status(400).json({ error: 'Episode ID and file URL are required.' });
    }

    // Verify episode ownership
    const epCheck = await db.query('SELECT id FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    const result = await db.query(
      `INSERT INTO ofs_recordings (episode_id, host_id, file_url, file_size, duration_seconds, status)
       VALUES ($1, $2, $3, $4, $5, 'READY')
       RETURNING *`,
      [episode_id, host_id, file_url, file_size || 0, duration_seconds || 0]
    );

    return res.status(201).json({
      message: 'Recording saved successfully.',
      recording: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const deleteRecording = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      `DELETE FROM ofs_recordings WHERE id = $1 AND host_id = $2 RETURNING id`,
      [id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found or unauthorized.' });
    }

    return res.json({ message: 'Recording deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecordings,
  createRecording,
  deleteRecording
};