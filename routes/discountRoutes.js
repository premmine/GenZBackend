const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.get('/', discountController.getDiscounts);
router.post('/', discountController.addDiscount);
router.put('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);
router.post('/validate', discountController.validateDiscount);

module.exports = router;
