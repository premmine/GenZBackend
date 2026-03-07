const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes are protected and admin only
router.use(authMiddleware);

// Middleware to check for Admin role specifically
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Admin access required" });
    }
};

router.use(adminOnly);

router.get('/unread-count', notificationController.getUnreadCount);
router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

console.log('✅ Notification Routes Initialized');
module.exports = router;
