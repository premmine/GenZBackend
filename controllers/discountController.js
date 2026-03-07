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

exports.validateDiscount = async (req, res) => {
    const { code, orderAmount } = req.body;
    try {
        const discount = await Discount.findOne({ code: code, status: 'active' });

        if (!discount) {
            return res.status(404).json({ message: "Invalid or inactive discount code" });
        }

        if (orderAmount < discount.minOrder) {
            return res.status(400).json({
                message: `Minimum order amount for this code is ₹${discount.minOrder}`
            });
        }

        res.json({
            code: discount.code,
            type: discount.type,
            value: discount.value
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
