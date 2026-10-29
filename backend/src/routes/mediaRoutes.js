const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.post('/start', authenticateToken, requireHost, mediaController.startBroadcast);
router.post('/end', authenticateToken, requireHost, mediaController.endBroadcast);
router.get('/status/:episode_id', mediaController.getSessionStatus);

module.exports = router;