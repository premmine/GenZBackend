const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.use(authMiddleware);

// Publicly accessible for authenticated users
router.patch('/me', userController.updateMe);
router.post('/address', userController.addAddress);
router.put('/address/:addressId', userController.updateAddress);
router.delete('/address/:addressId', userController.deleteAddress);
router.patch('/address/:addressId/default', userController.setDefaultAddress);

// Admin-only routes
router.use(adminMiddleware);

router.get('/test', (req, res) => res.json({ message: "Users router is working" }));
router.get('/', userController.getUsers);
router.post('/', userController.addUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
