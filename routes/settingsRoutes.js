const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public route to fetch settings (used by frontend layout)
router.get('/', settingsController.getSettings);

// Admin route to update settings
router.put('/', authMiddleware, adminMiddleware, settingsController.updateSettings);

module.exports = router;
