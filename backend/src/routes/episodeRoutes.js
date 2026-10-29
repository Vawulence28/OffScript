const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');
const { authenticateToken, requireHost } = require('../middleware/auth');

// PUBLIC ROUTE: Accessible without a token for the landing page upcoming sessions section
router.get('/public', episodeController.getPublicEpisodes);

// PROTECTED ROUTES: Require authentication and host role for all routes below
router.use(authenticateToken, requireHost);

router.post('/', episodeController.createEpisode);
router.get('/', episodeController.getEpisodes);
router.get('/:id', episodeController.getEpisodeById);
router.put('/:id', episodeController.updateEpisode);
router.delete('/:id', episodeController.deleteEpisode);

module.exports = router;