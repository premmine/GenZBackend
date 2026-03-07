const Notification = require('../models/Notification');

// Get all notifications for Admin
exports.getNotifications = async (req, res) => {
    try {
        const { type, isRead, page = 1, limit = 20 } = req.query;
        let filter = {};

        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            notifications,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Mark single as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Notification deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Internal helper to create notifications (called from other controllers)
exports.createNotificationInternal = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();

        // We will emit socket event here once socket is integrated
        if (global.io) {
            global.io.emit('newNotification', notification);
            console.log(`📡 Socket.IO: Emitted newNotification for type ${data.type}`);
        }

        return notification;
    } catch (err) {
        console.error('Error creating internal notification:', err);
    }
};
