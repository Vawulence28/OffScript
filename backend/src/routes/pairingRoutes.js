const express = require('express');
const router = express.Router();
const pairingController = require('../controllers/pairingController');
const { authenticateToken, requireHost } = require('../middleware/auth');

router.post('/', authenticateToken, requireHost, pairingController.createPairingSession);
router.get('/:token', pairingController.verifyPairingToken);

module.exports = router;