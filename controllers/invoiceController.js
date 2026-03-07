const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');
const path = require('path');
const fs = require('fs');

/**
 * Internal helper to create an invoice for an order
 * Called from order controller or webhook
 */
exports.createInvoiceInternal = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        // Prevent duplicate invoices
        const existingInvoice = await Invoice.findOne({ orderId });
        if (existingInvoice) return existingInvoice;

        // Generate a unique invoice number
        const year = new Date().getFullYear();
        const count = await Invoice.countDocuments({ createdAt: { $gte: new Date(year, 0, 1) } });
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

        // Map items
        const invoiceItems = order.items.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price || 0,
            total: (item.price || 0) * item.quantity
        }));

        const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
        const shippingCharge = order.shippingCharge || 0;
        const discountAmount = order.discountAmount || order.discount || 0;
        const totalAmount = subtotal + shippingCharge - discountAmount;

        // Data Normalization (Self-Healing during invoice)
        console.log(`🛠️ Normalizing Order ${order.id}: ${order.paymentStatus} -> Pending, totalAmount: ${order.totalAmount} -> ${totalAmount}`);
        if (!order.totalAmount || isNaN(order.totalAmount)) {
            order.totalAmount = totalAmount;
        }

        if (order.paymentStatus && typeof order.paymentStatus === 'string' && order.paymentStatus.toLowerCase() === 'pending') {
            order.paymentStatus = 'Pending';
        }
        if (order.paymentStatus && typeof order.paymentStatus === 'string' && order.paymentStatus.toLowerCase() === 'paid') {
            order.paymentStatus = 'Paid';
        }

        if (order.paymentMethod && typeof order.paymentMethod === 'string' && order.paymentMethod.toLowerCase() === 'cod') {
            order.paymentMethod = 'COD';
        }
        console.log(`🛠️ Normalized State: ${order.paymentStatus}, ${order.totalAmount}`);

        const shipping = order.shippingAddress || {};

        const invoice = new Invoice({
            invoiceNumber,
            orderId: order._id,
            orderDisplayId: order.id,
            customerName: order.customer,
            customerEmail: order.email,
            customerPhone: shipping.phone || order.phone || '',
            shippingAddress: {
                name: shipping.name || order.customer,
                phone: shipping.phone || '',
                line1: shipping.line1 || '',
                line2: shipping.line2 || '',
                city: shipping.city || '',
                state: shipping.state || '',
                pincode: shipping.pincode || '',
                country: shipping.country || 'India'
            },
            items: invoiceItems,
            subtotal,
            shippingCharge,
            discountAmount,
            totalAmount,
            paymentMethod: order.paymentMethod || 'COD',
            paymentStatus: order.paymentStatus || 'Pending',
            transactionId: order.transactionId
        });

        // Generate PDF
        const pdfPath = await generateInvoicePDF(invoice);
        invoice.invoicePdfPath = pdfPath;

        await invoice.save();

        // Update Order with invoiceId
        order.invoiceId = invoice._id;
        await order.save();

        // Send Email
        await sendInvoiceEmail(order.email, invoice, pdfPath);
        invoice.emailSent = true;
        await invoice.save();

        return invoice;
    } catch (error) {
        console.error("❌ createInvoiceInternal error:", error.message);
        throw error;
    }
};

/**
 * Get invoice details
 */
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('orderId');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Security: Admin or Order Owner
        if (req.user.role !== 'admin' && req.user.email !== invoice.customerEmail) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Download Invoice PDF
 */
exports.downloadInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Security: Admin or Order Owner
        if (req.user.role !== 'admin' && req.user.email !== invoice.customerEmail) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const filePath = path.resolve(invoice.invoicePdfPath);
        if (fs.existsSync(filePath)) {
            res.download(filePath, `Invoice_${invoice.invoiceNumber}.pdf`);
        } else {
            // Re-generate if lost
            const newPath = await generateInvoicePDF(invoice);
            invoice.invoicePdfPath = newPath;
            await invoice.save();
            res.download(newPath, `Invoice_${invoice.invoiceNumber}.pdf`);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * View Invoice PDF Inline
 */
exports.viewInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Security: Admin or Order Owner
        if (req.user.role !== 'admin' && req.user.email !== invoice.customerEmail) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        let filePath = path.resolve(invoice.invoicePdfPath);
        if (!fs.existsSync(filePath)) {
            // Re-generate if lost
            filePath = await generateInvoicePDF(invoice);
            invoice.invoicePdfPath = filePath;
            await invoice.save();
        }

        res.contentType('application/pdf');
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Resend Invoice Email (Admin Only)
 */
exports.resendInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        await sendInvoiceEmail(invoice.customerEmail, invoice, invoice.invoicePdfPath);

        invoice.emailSent = true;
        await invoice.save();

        res.json({ message: 'Invoice email resent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
