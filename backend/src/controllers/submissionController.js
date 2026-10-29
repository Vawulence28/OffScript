const db = require('../config/db');
const { sendTelegramNotification } = require('../utils/telegramNotifier');

const submitGuest = async (req, res, next) => {
  try {
    const { name, email, experience_bio } = req.body;
    if (!name || !email || !experience_bio) {
      return res.status(400).json({ error: 'All fields are required for guest applications.' });
    }

    const result = await db.query(
      `INSERT INTO ofs_guest_applications (name, email, experience_bio) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, experience_bio]
    );

    const newGuest = result.rows[0];

    // Send direct alert to Telegram
    const telegramMessage = `🎙️ *New OFFSCRIPT Guest Application!*\n\n` +
      `👤 *Name:* ${newGuest.name}\n` +
      `📧 *Email:* ${newGuest.email}\n` +
      `📝 *Bio/Topic Idea:* ${newGuest.experience_bio}`;

    await sendTelegramNotification(telegramMessage);

    return res.status(201).json({ message: 'Guest application submitted successfully.', guest: newGuest });
  } catch (err) {
    next(err);
  }
};

const submitTopic = async (req, res, next) => {
  try {
    const { topic, details } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic title is required.' });
    }

    const result = await db.query(
      `INSERT INTO ofs_topic_suggestions (topic, details) VALUES ($1, $2) RETURNING *`,
      [topic, details || '']
    );

    const newTopic = result.rows[0];

    // Send direct alert to Telegram
    const telegramMessage = `💡 *New OFFSCRIPT Topic Suggestion!*\n\n` +
      `📌 *Topic:* ${newTopic.topic}\n` +
      `📄 *Details:* ${newTopic.details || 'None provided'}`;

    await sendTelegramNotification(telegramMessage);

    return res.status(201).json({ message: 'Topic suggestion submitted successfully.', suggestion: newTopic });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitGuest, submitTopic };