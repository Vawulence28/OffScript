const db = require('../config/db');

const getLowerThirds = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const result = await db.query(
      `SELECT * FROM ofs_lower_thirds WHERE episode_id = $1 ORDER BY created_at DESC`,
      [episode_id]
    );
    return res.json({ lowerThirds: result.rows });
  } catch (err) {
    next(err);
  }
};

const createLowerThird = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const { title, subtitle } = req.body;
    const host_id = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Lower third title/name is required.' });
    }

    // Verify episode ownership
    const epCheck = await db.query('SELECT id FROM ofs_episodes WHERE id = $1 AND host_id = $2', [episode_id, host_id]);
    if (epCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    const result = await db.query(
      `INSERT INTO ofs_lower_thirds (episode_id, host_id, title, subtitle, is_active)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING *`,
      [episode_id, host_id, title, subtitle || '']
    );

    return res.status(201).json({
      message: 'Lower third created successfully.',
      lowerThird: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const toggleLowerThird = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    // Get lower third and episode
    const ltCheck = await db.query(
      `SELECT lt.*, e.host_id FROM ofs_lower_thirds lt JOIN ofs_episodes e ON lt.episode_id = e.id WHERE lt.id = $1`,
      [id]
    );

    if (ltCheck.rows.length === 0 || ltCheck.rows[0].host_id !== host_id) {
      return res.status(404).json({ error: 'Lower third not found or unauthorized.' });
    }

    const lt = ltCheck.rows[0];
    const newActiveState = !lt.is_active;

    // If activating this one, deactivate all others for this episode first
    if (newActiveState) {
      await db.query(`UPDATE ofs_lower_thirds SET is_active = FALSE WHERE episode_id = $1`, [lt.episode_id]);
    }

    const result = await db.query(
      `UPDATE ofs_lower_thirds SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newActiveState, id]
    );

    return res.json({
      message: 'Lower third state updated.',
      lowerThird: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const deleteLowerThird = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const ltCheck = await db.query(
      `SELECT lt.*, e.host_id FROM ofs_lower_thirds lt JOIN ofs_episodes e ON lt.episode_id = e.id WHERE lt.id = $1`,
      [id]
    );

    if (ltCheck.rows.length === 0 || ltCheck.rows[0].host_id !== host_id) {
      return res.status(404).json({ error: 'Lower third not found or unauthorized.' });
    }

    await db.query(`DELETE FROM ofs_lower_thirds WHERE id = $1`, [id]);
    return res.json({ message: 'Lower third deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLowerThirds,
  createLowerThird,
  toggleLowerThird,
  deleteLowerThird
};