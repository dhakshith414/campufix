const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/summary', authenticate, authorize('staff', 'admin'), getSummary);

module.exports = router;
