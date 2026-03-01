const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
    try {
        const ticketId = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const ticket = new Ticket({
            ...req.body,
            userId: req.user.id,
            ticketId
        });
        await ticket.save();
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

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.id, userId: req.user.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.replyToTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.id, userId: req.user.id });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // In a real system, we might have a thread of messages. 
        // For simplicity, we'll append to the message or have a specific field.
        // The user requirement says "Reply to admin response".
        ticket.message += `\n\n[USER REPLY]: ${req.body.reply}`;
        ticket.status = 'Open'; // Re-open if closed? Or just keep as is.
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
