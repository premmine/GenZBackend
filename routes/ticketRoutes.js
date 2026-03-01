const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getMyTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/:id/reply', ticketController.replyToTicket);

module.exports = router;
