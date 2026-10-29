const crypto = require('crypto');
const db = require('../config/db');

const createPairingSession = async (req, res, next) => {
  try {
    const { episode_id } = req.body;
    const host_id = req.user.id;

    if (!episode_id) {
      return res.status(400).json({ error: 'Episode ID is required for camera pairing.' });
    }

    // Verify episode belongs to host
    const epCheck = await db.query('SELECT id FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    // Revoke any existing active pairing sessions for this episode
    await db.query(
      `UPDATE ofs_pairing_sessions SET status = 'REVOKED' WHERE episode_id = $1 AND status = 'PENDING'`,
      [episode_id]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    const result = await db.query(
      `INSERT INTO ofs_pairing_sessions (episode_id, host_id, token, status, expires_at)
       VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING token, expires_at, episode_id`,
      [episode_id, host_id, token, expiresAt]
    );

    return res.status(201).json({
      message: 'Pairing session created successfully.',
      pairing: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const verifyPairingToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT p.*, e.title as episode_title 
       FROM ofs_pairing_sessions p
       JOIN ofs_episodes e ON p.episode_id = e.id
       WHERE p.token = $1 AND p.status = 'PENDING' AND p.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid, expired, or already used pairing token.' });
    }

    return res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPairingSession,
  verifyPairingToken
};