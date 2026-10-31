const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken, requireHost } = require('../middleware/auth');

// Public route to fetch published episode by slug
router.get('/public/episodes/:slug', commentController.getPublicEpisodeBySlug);

// Public comment routes for audience chat (No authentication required)
router.get('/episodes/:episode_id/comments', commentController.getComments);
router.post('/episodes/:episode_id/comments', commentController.postComment);

// Protected host moderation route
router.patch('/comments/:id/moderate', authenticateToken, requireHost, commentController.moderateComment);

module.exports = router;