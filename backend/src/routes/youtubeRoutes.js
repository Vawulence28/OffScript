const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.get('/episodes/:episode_id/youtube', authenticateToken, requireHost, youtubeController.getDestination);
router.post('/episodes/:episode_id/youtube', authenticateToken, requireHost, youtubeController.configureDestination);
router.post('/episodes/:episode_id/youtube/toggle', authenticateToken, requireHost, youtubeController.toggleDestination);

module.exports = router;