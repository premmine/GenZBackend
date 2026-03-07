const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');

async function debugDeep() {
    try {
        console.log("🚀 DEEP DEBUG for Order: ORD-KOBFML");
        await mongoose.connect(process.env.MONGO_URI);

        const Order = require('./models/Order');
        const Invoice = require('./models/Invoice');

        // 1. Clean up
        await Invoice.deleteMany({ orderDisplayId: 'ORD-KOBFML' });
        console.log("🧹 Invoices cleaned.");

        // 2. Fetch order
        const order = await Order.findOne({ id: 'ORD-KOBFML' });
        console.log("📦 Initial State:", {
            totalAmount: order.totalAmount,
            paymentStatus: order.paymentStatus,
            hasOrder: !!order
        });

        // 3. Import controller and verify its content manually
        const controllerPath = path.resolve('./controllers/invoiceController.js');
        const content = fs.readFileSync(controllerPath, 'utf8');
        if (content.includes('Normalizing Order')) {
            console.log("✅ verified: invoiceController.js on disk has the fix.");
        } else {
            console.log("❌ ERROR: invoiceController.js on disk DOES NOT have the fix!");
        }

        // 4. Run it
        const { createInvoiceInternal } = require('./controllers/invoiceController');
        console.log("🔄 Running createInvoiceInternal...");
        const invoice = await createInvoiceInternal(order._id);
        console.log("✅ Invoice created: ", invoice.invoiceNumber);

        // 5. Re-fetch and verify save
        const updatedOrder = await Order.findById(order._id);
        console.log("📦 Final State:", {
            totalAmount: updatedOrder.totalAmount,
            paymentStatus: updatedOrder.paymentStatus
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugDeep();
