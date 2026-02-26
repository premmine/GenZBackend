const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            console.error("🛑 Order fetch attempted without valid user email in token");
            return res.status(401).json({ message: "Identity verification failed" });
        }

        // Only return orders for the logged-in user
        let filter = { email: req.user.email };

        // If admin, they can optionally see all via a query param, but default to their own
        if (req.user.role === 'admin' && req.query.all === 'true') {
            filter = {};
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addOrder = async (req, res) => {
    try {
        const orderData = {
            ...req.body,
            email: req.user.email,
            customer: req.user.name || req.body.customer,
            // Add initial timeline entry
            timeline: [{
                status: 'placed',
                message: 'Order has been placed successfully.'
            }],
            // Generate estimated delivery (e.g., 5 days from now)
            trackingInfo: {
                ...req.body.trackingInfo,
                estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        };

        const order = new Order(orderData);
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, email: req.user.email });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Order Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, email: req.user.email });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
        }

        order.status = 'cancelled';
        order.timeline.push({
            status: 'cancelled',
            message: 'Order has been cancelled by the user.'
        });
        await order.save();
        res.json({ message: "Order cancelled successfully", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.returnOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, email: req.user.email });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: "Only delivered orders can be returned" });
        }

        order.status = 'returned';
        order.timeline.push({
            status: 'returned',
            message: 'Return request initiated by the user.'
        });
        await order.save();
        res.json({ message: "Return request initiated", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
