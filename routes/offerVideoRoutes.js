const express = require('express');
const router = express.Router();
const offerVideosController = require('../controllers/offerVideosController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/active', offerVideosController.getActiveOffers);

// Admin routes (simplified for now, ideally needs admin check)
router.use(authMiddleware);
router.get('/', offerVideosController.getOfferVideos);
router.post('/', offerVideosController.addOfferVideo);
router.put('/:id', offerVideosController.updateOfferVideo);
router.delete('/:id', offerVideosController.deleteOfferVideo);

module.exports = router;
