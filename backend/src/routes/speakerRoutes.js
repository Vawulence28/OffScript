const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');
const { authenticateToken, requireHost } = require('../middleware/auth');

// Public speaker routes
router.get('/verify/:token', speakerController.verifyInvitationToken);
router.post('/join-waiting-room', speakerController.joinWaitingRoom);

// Host-protected speaker management routes
router.post('/episodes/:episode_id/invitations', authenticateToken, requireHost, speakerController.createInvitation);
router.get('/episodes/:episode_id/invitations', authenticateToken, requireHost, speakerController.getInvitations);
router.delete('/invitations/:id', authenticateToken, requireHost, speakerController.revokeInvitation);
router.post('/invitations/:id/admit', authenticateToken, requireHost, speakerController.admitSpeaker);
router.post('/invitations/:id/remove', authenticateToken, requireHost, speakerController.removeSpeaker);

module.exports = router;