const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const requireHost = (req, res, next) => {
  if (!req.user || (req.user.role !== 'host' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Host privileges required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireHost
};