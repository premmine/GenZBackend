const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const { createInvoiceInternal } = require('./controllers/invoiceController');
const Order = require('./models/Order');

const Invoice = require('./models/Invoice');

async function verifyFinalFix() {
    try {
        console.log("🚀 FINAL VERIFICATION for Order: ORD-KOBFML");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // CLEANUP: Remove any existing invoice for this order to force createInvoiceInternal to run
        await Invoice.deleteMany({ orderDisplayId: 'ORD-KOBFML' });
        console.log("🧹 Cleaned up existing invoices for ORD-KOBFML");

        const order = await Order.findOne({ id: 'ORD-KOBFML' });
        if (!order) {
            console.error("❌ Order ORD-KOBFML not found. Please ensure it exists in the DB.");
            process.exit(1);
        }

        console.log("📦 Initial State Check:");
        console.log(`- totalAmount: ${order.totalAmount}`);
        console.log(`- paymentStatus: ${order.paymentStatus}`);

        console.log("🔄 Running createInvoiceInternal (contains new normalization logic)...");
        // This function will fetch the order again inside, fix it, and save it.
        const invoice = await createInvoiceInternal(order._id);

        console.log("✅ Invoice Created Successfully!");
        console.log("📄 Invoice Number:", invoice.invoiceNumber);

        // Verify the order was also fixed in the DB
        const updatedOrder = await Order.findById(order._id);
        console.log("📦 Post-fix State Check:");
        console.log(`- totalAmount: ${updatedOrder.totalAmount}`);
        console.log(`- paymentStatus: ${updatedOrder.paymentStatus}`);

        if (updatedOrder.paymentStatus === 'Pending' && updatedOrder.totalAmount !== undefined) {
            console.log("🎉 SUCCESS: Order was automatically healed and saved!");
        } else {
            console.error("❌ FAILED: Order state not as expected.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ VERIFICATION FAILED:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

verifyFinalFix();
