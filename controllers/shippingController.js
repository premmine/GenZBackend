const Order = require('../models/Order');
const { sendOrderStatusEmail } = require('../utils/emailService');
const { generateShippingLabelPDF } = require('../utils/shippingLabelGenerator');
const fs = require('fs');

/**
 * Admin: Update Shipping/Order Status
 */
exports.updateShippingStatus = async (req, res) => {
    try {
        const { status, message, courierName, trackingId, estimatedDeliveryDate, adminNote } = req.body;
        const order = await Order.findOne({ id: req.params.orderId });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Update fields
        if (courierName) order.courierName = courierName;
        if (trackingId) order.trackingId = trackingId;
        if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate;
        if (adminNote !== undefined) order.adminNote = adminNote;

        // Handle status change
        if (status && status !== order.orderStatus) {
            order.orderStatus = status;
            order.statusHistory.push({
                status: status,
                message: message || `Status updated to ${status}`,
                updatedAt: new Date(),
                updatedBy: req.user?.name || req.user?.email || 'Admin'
            });

            // Trigger Invoice for COD Confirmed
            if (status === 'Confirmed' && order.paymentMethod === 'COD' && !order.invoiceId) {
                try {
                    const { createInvoiceInternal } = require('./invoiceController');
                    await createInvoiceInternal(order._id);
                } catch (invoiceErr) {
                    console.error("⚠️ Invoice generation failed during status update:", invoiceErr.message);
                }
            }

            // Notify Customer
            try {
                await sendOrderStatusEmail(order.email, order, status);
            } catch (emailErr) {
                console.error("⚠️ Order status email failed:", emailErr.message);
            }
        }

        await order.save();
        res.json({ success: true, message: 'Status updated successfully', order });
    } catch (error) {
        console.error("❌ updateShippingStatus 500 ERROR:", error.message, error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin: Download Shipping Label PDF
 */
exports.getShippingLabel = async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const filePath = await generateShippingLabelPDF(order);
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Public: Get Tracking Information by Tracking ID
 */
exports.getTrackingInfo = async (req, res) => {
    try {
        const order = await Order.findOne({ trackingId: req.params.trackingId });
        if (!order) return res.status(404).json({ message: 'Tracking ID not found' });

        res.json({
            trackingId: order.trackingId,
            courierName: order.courierName || 'Genzi Logistics',
            orderStatus: order.orderStatus,
            statusHistory: order.statusHistory,
            estimatedDeliveryDate: order.estimatedDeliveryDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
