const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

router.post('/guests', submissionController.submitGuest);
router.post('/topics', submissionController.submitTopic);

module.exports = router;