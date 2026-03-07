const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Order = require('./models/Order');

async function repairOrders() {
    try {
        console.log("🚀 STARTING INTELLIGENT ORDER REPAIR");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const orders = await Order.find({});
        let updatedCount = 0;

        for (const order of orders) {
            console.log(`\n🔍 Checking Order ${order.id}...`);

            // 1. Determine actual status from history
            // Find the latest legitimate status from statusHistory
            const latestHistory = order.statusHistory?.length > 0
                ? order.statusHistory[order.statusHistory.length - 1].status
                : null;

            const currentEnum = order.orderStatus;

            console.log(`   - DB orderStatus: ${currentEnum}`);
            console.log(`   - Latest History: ${latestHistory}`);

            // If history shows a more advanced status than just 'Placed', trust history
            if (latestHistory && latestHistory !== currentEnum) {
                console.log(`   ⚠️ Mismatch detected! Restoring status to: ${latestHistory}`);
                order.orderStatus = latestHistory;
            }

            // Sync legacy field (the hook will also do this, but let's be explicit here)
            order.status = order.orderStatus.toLowerCase();

            // Save will trigger the new pre-save hook for normalization/syncing
            await order.save();
            updatedCount++;
        }

        console.log(`\n✅ REPAIR FINISHED! Processed ${updatedCount} orders.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ REPAIR FAILED:", err);
        process.exit(1);
    }
}

repairOrders();
