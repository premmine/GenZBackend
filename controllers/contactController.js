const Contact = require('../models/Contact');
const notificationController = require('./notificationController');

exports.submitContact = async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();

        // Trigger Admin Notification
        await notificationController.createNotificationInternal({
            title: "New Contact Message",
            message: `New message from ${contact.name}: ${contact.subject || 'No Subject'}`,
            type: "contact",
            name: contact.name,
            referenceId: contact._id,
            email: contact.email,
            phone: contact.phone,
            priority: "medium"
        });

        res.status(201).json({ message: "Message sent successfully", contact });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        // Admin only in practice, but for now we'll allow it if needed for dashboard
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMessageById = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);
        if (!message) return res.status(404).json({ message: "Message not found" });
        res.json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
