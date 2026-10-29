const db = require('../config/db');

const getSettings = async (req, res, next) => {
  try {
    const host_id = req.user.id;
    let result = await db.query(`SELECT * FROM ofs_settings WHERE host_id = $1`, [host_id]);

    if (result.rows.length === 0) {
      // Create default settings if none exist
      result = await db.query(
        `INSERT INTO ofs_settings (host_id, studio_name, brand_color, auto_record, retention_days)
         VALUES ($1, 'OffScript Studio', '#e11d48', TRUE, 30)
         RETURNING *`,
        [host_id]
      );
    }

    return res.json({ settings: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const host_id = req.user.id;
    const { studio_name, brand_color, auto_record, retention_days } = req.body;

    const result = await db.query(
      `INSERT INTO ofs_settings (host_id, studio_name, brand_color, auto_record, retention_days, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (host_id) 
       DO UPDATE SET 
         studio_name = EXCLUDED.studio_name,
         brand_color = EXCLUDED.brand_color,
         auto_record = EXCLUDED.auto_record,
         retention_days = EXCLUDED.retention_days,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [host_id, studio_name, brand_color, auto_record, retention_days]
    );

    return res.json({
      message: 'Settings updated successfully.',
      settings: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings
};