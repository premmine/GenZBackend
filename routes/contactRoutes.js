const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/', contactController.submitContact);
router.get('/', contactController.getMessages); // Should be admin protected usually
router.get('/:id', contactController.getMessageById);

module.exports = router;
