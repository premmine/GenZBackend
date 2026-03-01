const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Payment', 'Delivery', 'Refund', 'Technical Issue', 'Other']
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    adminReply: { type: String, default: '' },
    attachments: [{ type: String }], // URLs to screenshots/images
}, { timestamps: true });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
