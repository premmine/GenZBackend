const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: String, required: true, unique: true }, // Auto-generated
    orderId: { type: String }, // Made optional for historical data
    productId: { type: String }, // Custom ID or String for snapshot persistence
    productName: { type: String },
    productImage: { type: String },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    issueType: { type: String }, // Made optional for historical data
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    description: { type: String }, // Made optional for historical data
    // Support legacy fields found in DB
    subject: { type: String },
    category: { type: String },
    message: { type: String },
    attachments: [{ type: String }],
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    adminReply: { type: String, default: '' },
    replies: [
        {
            sender: { type: String, enum: ['user', 'admin'] },
            message: String,
            date: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
