const Order = require('../models/Order');
const Discount = require('../models/Discount');
const notificationController = require('./notificationController');

exports.getOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            console.error("🛑 Order fetch attempted without valid user email in token");
            return res.status(401).json({ message: "Identity verification failed" });
        }

        // Default filter: only return orders for the logged-in user
        let filter = { email: req.user.email };

        // If admin, they can see all orders
        if (req.user.role === 'admin') {
            filter = {};
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('invoiceId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addOrder = async (req, res) => {
    try {
        const { items, subtotal, shippingCharge, discountAmount, totalAmount, shippingAddress, billingAddress, paymentMethod, transactionId } = req.body;

        const orderData = {
            id: `Ord-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            userId: req.user.id,
            customer: req.user.name || req.body.customer,
            email: req.user.email,
            items,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            subtotal,
            shippingCharge,
            discountAmount,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: (paymentMethod === 'Razorpay' || paymentMethod === 'Online') ? 'Paid' : 'Pending',
            transactionId,
            codAmount: paymentMethod === 'COD' ? totalAmount : 0,
            orderStatus: 'Placed',
            statusHistory: [{
                status: 'Placed',
                updatedBy: 'System',
                updatedAt: new Date()
            }]
        };

        const order = new Order(orderData);
        await order.save();

        // Increment discount usage if a discount was applied
        if (req.body.discountApplied && req.body.discountApplied.code) {
            await Discount.findOneAndUpdate(
                { code: req.body.discountApplied.code },
                { $inc: { usage: 1 } }
            ).catch(err => console.error(`Failed to increment usage for discount ${req.body.discountApplied.code}:`, err));
        }

        // Notification
        await notificationController.createNotificationInternal({
            title: "New Order",
            message: `Order #${order.id} for ₹${order.totalAmount}`,
            type: "order",
            name: order.customer,
            referenceId: order._id,
            email: order.email,
            priority: "high"
        });

        // Auto-Invoice for Online Paid
        if (order.paymentStatus === 'Paid') {
            const { createInvoiceInternal } = require('./invoiceController');
            createInvoiceInternal(order._id).catch(c => console.log('Auto-Invoice failed:', c.message));
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, email: req.user.email };
        const order = await Order.findOne(filter).populate('invoiceId');
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.orderStatus === 'Delivered' || order.status === 'Delivered') {
            return res.status(400).json({ message: "Delivered orders cannot be modified." });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'statusHistory' && key !== 'orderStatus') {
                order[key] = req.body[key];
            }
        });

        // Handle status change
        if (req.body.orderStatus && req.body.orderStatus !== order.orderStatus) {
            const oldStatus = order.orderStatus;
            order.orderStatus = req.body.orderStatus;

            order.statusHistory.push({
                status: order.orderStatus,
                updatedBy: req.user.name || 'Admin',
                updatedAt: new Date()
            });

            // TRIGGER INVOICE LOGIC
            // COD Confirmed -> Gen Invoice
            if (order.orderStatus === 'Confirmed' && order.paymentMethod === 'COD' && !order.invoiceId) {
                const { createInvoiceInternal } = require('./invoiceController');
                await createInvoiceInternal(order._id);
            }
        }

        await order.save();
        res.json(order);
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

        if (order.orderStatus !== 'Placed' && order.orderStatus !== 'Confirmed') {
            return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
        }

        order.orderStatus = 'Cancelled';
        order.statusHistory.push({
            status: 'Cancelled',
            updatedBy: 'User',
            updatedAt: new Date(),
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

        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ message: "Only delivered orders can be returned" });
        }

        order.orderStatus = 'Returned';
        order.statusHistory.push({
            status: 'Returned',
            updatedBy: 'User',
            updatedAt: new Date(),
            message: 'Return request initiated by the user.'
        });
        await order.save();
        res.json({ message: "Return request initiated", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
