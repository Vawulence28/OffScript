const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerHost = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM ofs_users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO ofs_users (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, 'host') 
       RETURNING id, email, full_name, role, created_at`,
      [email, password_hash, full_name]
    );

    const newUser = result.rows[0];
    return res.status(201).json({
      message: 'Host registered successfully.',
      user: newUser
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM ofs_users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role, full_name: user.full_name };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    // Return the token directly in the JSON response for Bearer auth
    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // With token-based localStorage auth, logout is handled on the client side by clearing localStorage.
  return res.json({ message: 'Logged out successfully.' });
};

const getMe = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, email, full_name, role, created_at FROM ofs_users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerHost,
  login,
  logout,
  getMe
};