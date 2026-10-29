const express = require('express');
const router = express.Router();
const lowerThirdController = require('../controllers/lowerThirdController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.get('/episodes/:episode_id/lower-thirds', authenticateToken, requireHost, lowerThirdController.getLowerThirds);
router.post('/episodes/:episode_id/lower-thirds', authenticateToken, requireHost, lowerThirdController.createLowerThird);
router.post('/lower-thirds/:id/toggle', authenticateToken, requireHost, lowerThirdController.toggleLowerThird);
router.delete('/lower-thirds/:id', authenticateToken, requireHost, lowerThirdController.deleteLowerThird);

module.exports = router;