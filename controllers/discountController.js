const Discount = require('../models/Discount');

exports.getDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find().sort({ createdAt: -1 });
        res.json(discounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addDiscount = async (req, res) => {
    const discount = new Discount(req.body);
    try {
        const newDiscount = await discount.save();
        res.status(201).json(newDiscount);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateDiscount = async (req, res) => {
    try {
        const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteDiscount = async (req, res) => {
    try {
        await Discount.findByIdAndDelete(req.params.id);
        res.json({ message: "Discount Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
