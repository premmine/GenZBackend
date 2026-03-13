const Ticket = require('../models/Ticket');
const User = require('../models/User');
const emailService = require('../services/emailService');
const notificationController = require('./notificationController');

exports.createTicket = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const ticketId = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const {
            orderId, productId, productName, productImage,
            issueType, priority, description, message, category, subject
        } = req.body;

        // Expand raw HTML select values and short codes to full display labels
        const issueTypeMap = {
            // Raw HTML select values (what frontend now sends)
            'delivery': 'Delivery Issue',
            'product': 'Product Quality',
            'payment': 'Payment / Refund',
            'technical': 'Technical Issue',
            'account': 'Account Access',
            'other': 'Other',
            // Short capitalized codes (legacy)
            'Delivery': 'Delivery Issue',
            'Product': 'Product Quality',
            'Payment': 'Payment / Refund',
            'Account': 'Account Access',
            'Other': 'Other'
        };
        const resolvedIssueType = issueTypeMap[issueType] || issueTypeMap[category] || issueType || category || 'Other';

        const ticketData = {
            userId: req.user.id,
            ticketId,
            customerName: user.name || 'Customer',
            customerEmail: user.email,
            customerPhone: user.phone || 'N/A',
            orderId: orderId || 'N/A',
            productId: productId || '',
            productName: productName || 'N/A',
            productImage: productImage || '',
            issueType: resolvedIssueType,
            priority: priority || 'medium',
            description: description || message || subject || 'No description provided',
            status: 'Open',
            adminReply: ''
        };

        const ticket = new Ticket(ticketData);
        await ticket.save();

        // Send confirmation email
        await emailService.sendTicketEmail(user.email, 'GenziKart Support Ticket Update', {
            customerName: user.name,
            ticketId: ticketId,
            orderId: ticket.orderId
        }, 'created');

        // Admin Notification
        await notificationController.createNotificationInternal({
            title: "New Support Ticket",
            message: `Ticket ${ticketId} regarding: ${ticketData.issueType}`,
            type: "ticket",
            name: user.name,
            referenceId: ticket._id,
            email: user.email,
            phone: user.phone || '',
            priority: "high"
        });

        res.status(201).json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findOneAndUpdate(
            { ticketId: req.params.id },
            { status },
            { new: true }
        );
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        // If resolved, send email
        if (status === 'Resolved') {
            await emailService.sendTicketEmail(ticket.customerEmail, 'GenziKart Support: Ticket Resolved', {
                customerName: ticket.customerName,
                ticketId: ticket.ticketId,
                orderId: ticket.orderId
            }, 'resolved');
        }

        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.replyToTicket = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const ticket = await Ticket.findOne({ ticketId: req.params.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const replyMessage = req.body.message || req.body.reply;
        const reply = {
            sender: isAdmin ? 'admin' : 'user',
            message: replyMessage,
            date: new Date()
        };

        ticket.replies.push(reply);
        if (isAdmin) {
            ticket.adminReply = replyMessage;
            ticket.status = 'In Progress';

            // Notify customer via email
            await emailService.sendTicketEmail(ticket.customerEmail, 'GenziKart Support Ticket Update', {
                customerName: ticket.customerName,
                ticketId: ticket.ticketId,
                replyMessage: replyMessage
            }, 'reply');

            // Notify customer via in-app notification
            await notificationController.createNotificationInternal({
                title: "Support Ticket Update",
                message: `Admin replied to your ticket #${ticket.ticketId}`,
                type: "ticket",
                userId: ticket.userId, // TARGET THE USER
                referenceId: ticket._id,
                priority: "high"
            });
        } else {
            ticket.status = 'Open';

            // Notify admin via in-app notification
            await notificationController.createNotificationInternal({
                title: "User Replied to Ticket",
                message: `User replied to ticket #${ticket.ticketId}`,
                type: "ticket",
                name: ticket.customerName,
                referenceId: ticket._id,
                email: ticket.customerEmail,
                priority: "medium"
            });
        }

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
