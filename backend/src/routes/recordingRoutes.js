const express = require('express');
const router = express.Router();
const recordingController = require('../controllers/recordingController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.get('/recordings', authenticateToken, requireHost, recordingController.getRecordings);
router.post('/recordings', authenticateToken, requireHost, recordingController.createRecording);
router.delete('/recordings/:id', authenticateToken, requireHost, recordingController.deleteRecording);

module.exports = router;