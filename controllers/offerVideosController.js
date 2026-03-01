const OfferVideo = require('../models/OfferVideo');

// Get all offer videos (Admin)
exports.getOfferVideos = async (req, res) => {
    try {
        const offers = await OfferVideo.find().populate('productId', 'name price image');
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get active offer videos (Frontend)
exports.getActiveOffers = async (req, res) => {
    try {
        const offers = await OfferVideo.find({ isActive: true })
            .populate('productId', 'name price image rating')
            .limit(2);
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add offer video
exports.addOfferVideo = async (req, res) => {
    try {
        const offer = new OfferVideo(req.body);
        await offer.save();
        res.status(201).json(offer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update offer video
exports.updateOfferVideo = async (req, res) => {
    try {
        const offer = await OfferVideo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) return res.status(404).json({ message: "Offer not found" });
        res.json(offer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete offer video
exports.deleteOfferVideo = async (req, res) => {
    try {
        const offer = await OfferVideo.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ message: "Offer not found" });
        res.json({ message: "Offer video deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
