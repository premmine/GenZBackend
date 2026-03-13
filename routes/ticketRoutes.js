const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// POST /api/tickets  — create a new ticket (primary endpoint)
router.post('/', ticketController.createTicket);

// GET /api/tickets   — returns user-scoped tickets or all tickets for admin (role-based)
router.get('/', (req, res) => {
    if (req.user && req.user.role === 'admin') {
        return ticketController.getAllTickets(req, res);
    }
    return ticketController.getMyTickets(req, res);
});

// GET /api/tickets/:id   — get a single ticket by ticketId
router.get('/:id', ticketController.getTicketById);

// PUT /api/tickets/:id/reply   — customer or admin reply
router.put('/:id/reply', ticketController.replyToTicket);
router.patch('/:id/reply', ticketController.replyToTicket);   // PATCH alias

// PUT /api/tickets/:id/status  — update ticket status
router.put('/:id/status', ticketController.updateTicketStatus);
router.patch('/:id/status', ticketController.updateTicketStatus); // PATCH alias

module.exports = router;
