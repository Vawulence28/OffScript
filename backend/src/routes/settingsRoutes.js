const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.get('/settings', authenticateToken, requireHost, settingsController.getSettings);
router.put('/settings', authenticateToken, requireHost, settingsController.updateSettings);

module.exports = router;