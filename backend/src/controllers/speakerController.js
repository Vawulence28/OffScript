const crypto = require('crypto');
const db = require('../config/db');

// Create invitation for an episode
const createInvitation = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const { speaker_name, speaker_email } = req.body;
    const host_id = req.user.id;

    if (!speaker_name || !speaker_email) {
      return res.status(400).json({ error: 'Speaker name and email are required.' });
    }

    const epCheck = await db.query('SELECT id FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO ofs_invitations (episode_id, host_id, speaker_name, speaker_email, token, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
       RETURNING *`,
      [episode_id, host_id, speaker_name, speaker_email, token, expiresAt]
    );

    return res.status(201).json({
      message: 'Speaker invitation created successfully.',
      invitation: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// List invitations for an episode
const getInvitations = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      `SELECT * FROM ofs_invitations WHERE episode_id = $1 AND host_id = $2 ORDER BY created_at DESC`,
      [episode_id, host_id]
    );

    return res.json({ invitations: result.rows });
  } catch (err) {
    next(err);
  }
};

// Revoke/Delete invitation
const revokeInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      `UPDATE ofs_invitations SET status = 'REVOKED' WHERE id = $1 AND host_id = $2 RETURNING *`,
      [id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or unauthorized.' });
    }

    return res.json({ message: 'Invitation revoked successfully.', invitation: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Verify invitation token for speaker pre-join
const verifyInvitationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT i.*, e.title as episode_title, e.status as episode_status
       FROM ofs_invitations i
       JOIN ofs_episodes e ON i.episode_id = e.id
       WHERE i.token = $1 AND i.status NOT IN ('REVOKED', 'EXPIRED') AND i.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid, expired, or revoked invitation link.' });
    }

    return res.json({ invitation: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Speaker joins waiting room
const joinWaitingRoom = async (req, res, next) => {
  try {
    const { token } = req.body;

    const invResult = await db.query(
      `SELECT * FROM ofs_invitations WHERE token = $1 AND status NOT IN ('REVOKED', 'EXPIRED') AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (invResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired invitation.' });
    }

    const invitation = invResult.rows[0];

    const admittedCount = await db.query(
      `SELECT COUNT(*) FROM ofs_invitations WHERE episode_id = $1 AND status = 'ADMITTED'`,
      [invitation.episode_id]
    );

    if (parseInt(admittedCount.rows[0].count) >= 7) {
      return res.status(403).json({ error: 'Session has reached the maximum capacity of 8 participants.' });
    }

    const updated = await db.query(
      `UPDATE ofs_invitations SET status = 'WAITING' WHERE id = $1 RETURNING *`,
      [invitation.id]
    );

    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(invitation.episode_id.toString()).emit('speaker-status-changed', updated.rows[0]);
    }

    return res.json({ message: 'Entered waiting room successfully.', invitation: updated.rows[0] });
  } catch (err) {
    next(err);
  }
};

// Host admits speaker
const admitSpeaker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const inv = await db.query(`SELECT * FROM ofs_invitations WHERE id = $1 AND host_id = $2`, [id, host_id]);
    if (inv.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or unauthorized.' });
    }

    const admittedCount = await db.query(
      `SELECT COUNT(*) FROM ofs_invitations WHERE episode_id = $1 AND status = 'ADMITTED'`,
      [inv.rows[0].episode_id]
    );

    if (parseInt(admittedCount.rows[0].count) >= 7) {
      return res.status(403).json({ error: 'Maximum participant limit of 8 reached.' });
    }

    const result = await db.query(
      `UPDATE ofs_invitations SET status = 'ADMITTED' WHERE id = $1 AND host_id = $2 RETURNING *`,
      [id, host_id]
    );

    const updatedInv = result.rows[0];
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(updatedInv.episode_id.toString()).emit('speaker-status-changed', updatedInv);
    }

    return res.json({ message: 'Speaker admitted successfully.', invitation: updatedInv });
  } catch (err) {
    next(err);
  }
};

// Host removes speaker
const removeSpeaker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      `UPDATE ofs_invitations SET status = 'REMOVED' WHERE id = $1 AND host_id = $2 RETURNING *`,
      [id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or unauthorized.' });
    }

    const updatedInv = result.rows[0];
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(updatedInv.episode_id.toString()).emit('speaker-status-changed', updatedInv);
    }

    return res.json({ message: 'Speaker removed from session.', invitation: updatedInv });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvitation,
  getInvitations,
  revokeInvitation,
  verifyInvitationToken,
  joinWaitingRoom,
  admitSpeaker,
  removeSpeaker
};