const db = require('../config/db');

const getPublicEpisodeBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      `SELECT e.*, u.full_name as host_name 
       FROM ofs_episodes e 
       LEFT JOIN ofs_users u ON e.host_id = u.id 
       WHERE e.slug = $1 AND e.status IN ('SCHEDULED', 'PUBLISHED', 'ARCHIVED')`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json({ episode: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const result = await db.query(
      `SELECT * FROM ofs_comments WHERE episode_id = $1 AND is_hidden = FALSE ORDER BY created_at ASC LIMIT 100`,
      [episode_id]
    );
    return res.json({ comments: result.rows });
  } catch (err) {
    next(err);
  }
};

const postComment = async (req, res, next) => {
  try {
    const { episode_id } = req.params;
    const { display_name, message } = req.body;

    if (!display_name || !message) {
      return res.status(400).json({ error: 'Display name and message are required.' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Comment message cannot exceed 500 characters.' });
    }

    const result = await db.query(
      `INSERT INTO ofs_comments (episode_id, display_name, message, is_featured, is_hidden)
       VALUES ($1, $2, $3, FALSE, FALSE)
       RETURNING *`,
      [episode_id, display_name.trim(), message.trim()]
    );

    const comment = result.rows[0];

    // Broadcast comment via socket if io is available
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(episode_id.toString()).emit('new-comment', comment);
    }

    return res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

const moderateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_hidden, is_featured } = req.body;

    let query = 'UPDATE ofs_comments SET ';
    let params = [];
    let setClauses = [];

    if (is_hidden !== undefined) {
      params.push(is_hidden);
      setClauses.push(`is_hidden = $${params.length}`);
    }

    if (is_featured !== undefined) {
      params.push(is_featured);
      setClauses.push(`is_featured = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No moderation fields provided.' });
    }

    params.push(id);
    query += setClauses.join(', ') + ` WHERE id = $${params.length} RETURNING *`;

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    return res.json({ comment: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicEpisodeBySlug,
  getComments,
  postComment,
  moderateComment
};