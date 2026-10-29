const db = require('../config/db');

// Helper to generate URL-friendly slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
};

const createEpisode = async (req, res, next) => {
  try {
    const { title, description, cover_image_url, scheduled_for, status } = req.body;
    const host_id = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Episode title is required.' });
    }

    const episodeStatus = status || 'DRAFT';
    const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];
    if (!validStatuses.includes(episodeStatus)) {
      return res.status(400).json({ error: 'Invalid episode status.' });
    }

    if (episodeStatus === 'SCHEDULED' && !scheduled_for) {
      return res.status(400).json({ error: 'Scheduled date and time are required for scheduled episodes.' });
    }

    const slug = generateSlug(title);

    const result = await db.query(
      `INSERT INTO ofs_episodes (title, slug, description, cover_image_url, status, scheduled_for, host_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, slug, description || '', cover_image_url || '', episodeStatus, scheduled_for || null, host_id]
    );

    return res.status(201).json({
      message: 'Episode created successfully.',
      episode: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUBLIC: Get scheduled or published episodes for landing page viewers
const getPublicEpisodes = async (req, res, next) => {
  try {
    const { status = 'SCHEDULED', limit = 50, offset = 0 } = req.query;
    
    const result = await db.query(
      `SELECT id, title, slug, description, cover_image_url, status, scheduled_for, created_at 
       FROM ofs_episodes 
       WHERE status = $1 
       ORDER BY scheduled_for ASC LIMIT $2 OFFSET $3`,
      [status, parseInt(limit), parseInt(offset)]
    );

    return res.json({ episodes: result.rows });
  } catch (err) {
    next(err);
  }
};

// PROTECTED: Get episodes for logged-in host dashboard
const getEpisodes = async (req, res, next) => {
  try {
    const host_id = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM ofs_episodes WHERE host_id = $1';
    let params = [host_id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
      query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
      params.push(parseInt(limit), parseInt(offset));
    } else {
      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(parseInt(limit), parseInt(offset));
    }

    const result = await db.query(query, params);
    return res.json({ episodes: result.rows });
  } catch (err) {
    next(err);
  }
};

const getEpisodeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      'SELECT * FROM ofs_episodes WHERE id = $1 AND host_id = $2',
      [id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    return res.json({ episode: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateEpisode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;
    const { title, description, cover_image_url, status, scheduled_for } = req.body;

    const existing = await db.query(
      'SELECT * FROM ofs_episodes WHERE id = $1 AND host_id = $2',
      [id, host_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    const currentEpisode = existing.rows[0];
    const newStatus = status || currentEpisode.status;
    const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid episode status.' });
    }

    if (newStatus === 'SCHEDULED' && !scheduled_for && !currentEpisode.scheduled_for) {
      return res.status(400).json({ error: 'Scheduled date and time are required for scheduled episodes.' });
    }

    const updatedTitle = title !== undefined ? title : currentEpisode.title;
    const updatedDescription = description !== undefined ? description : currentEpisode.description;
    const updatedCover = cover_image_url !== undefined ? cover_image_url : currentEpisode.cover_image_url;
    const updatedScheduledFor = scheduled_for !== undefined ? scheduled_for : currentEpisode.scheduled_for;

    const result = await db.query(
      `UPDATE ofs_episodes 
       SET title = $1, description = $2, cover_image_url = $3, status = $4, scheduled_for = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND host_id = $7
       RETURNING *`,
      [updatedTitle, updatedDescription, updatedCover, newStatus, updatedScheduledFor, id, host_id]
    );

    return res.json({
      message: 'Episode updated successfully.',
      episode: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const deleteEpisode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const host_id = req.user.id;

    const result = await db.query(
      'DELETE FROM ofs_episodes WHERE id = $1 AND host_id = $2 RETURNING id',
      [id, host_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found or unauthorized.' });
    }

    return res.json({ message: 'Episode deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEpisode,
  getPublicEpisodes,
  getEpisodes,
  getEpisodeById,
  updateEpisode,
  deleteEpisode
};