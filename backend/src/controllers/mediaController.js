const db = require('../config/db');

// Start or get active live session for an episode
const startBroadcast = async (req, res, next) => {
  try {
    const { episode_id } = req.body;
    const host_id = req.user.id;

    if (!episode_id) {
      return res.status(400).json({ error: 'Episode ID is required to start broadcast.' });
    }

    // Verify episode ownership
    const epCheck = await db.query('SELECT id, status FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    // Check if live session already exists
    let session = await db.query('SELECT * FROM ofs_live_sessions WHERE episode_id = $1', [episode_id]);

    let result;
    if (session.rows.length === 0) {
      result = await db.query(
        `INSERT INTO ofs_live_sessions (episode_id, host_id, status, started_at)
         VALUES ($1, $2, 'LIVE', CURRENT_TIMESTAMP)
         RETURNING *`,
        [episode_id, host_id]
      );
    } else {
      result = await db.query(
        `UPDATE ofs_live_sessions 
         SET status = 'LIVE', started_at = CURRENT_TIMESTAMP, ended_at = NULL 
         WHERE episode_id = $1 
         RETURNING *`,
        [episode_id]
      );
    }

    // Update episode status to PUBLISHED
    await db.query(`UPDATE ofs_episodes SET status = 'PUBLISHED' WHERE id = $1`, [episode_id]);

    return res.json({
      message: 'Broadcast started successfully.',
      session: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const endBroadcast = async (req, res, next) => {
  try {
    const { episode_id } = req.body;
    const host_id = req.user.id;

    if (!episode_id) {
      return res.status(400).json({ error: 'Episode ID is required to end broadcast.' });
    }

    const result = await db.query(
      `UPDATE ofs_live_sessions 
       SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP 
       WHERE episode_id = $1 AND host_id = $2 
       RETURNING *`,
      [episode_id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live session not found or unauthorized.' });
    }

    return res.json({
      message: 'Broadcast ended successfully.',
      session: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const getSessionStatus = async (req, res, next) => {
  try {
    const { episode_id } = req.params;

    const result = await db.query(
      `SELECT * FROM ofs_live_sessions WHERE episode_id = $1`,
      [episode_id]
    );

    if (result.rows.length === 0) {
      return res.json({ session: { status: 'IDLE' } });
    }

    return res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startBroadcast,
  endBroadcast,
  getSessionStatus
};