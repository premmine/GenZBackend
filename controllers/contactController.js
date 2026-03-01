const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        // In a real app, send email to admin here
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
