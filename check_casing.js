const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Order = require('./models/Order');

async function checkCasing() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne({ id: 'ORD-EWTR5U' });
        console.log("📦 Order ORD-EWTR5U Details:");
        console.log(`- orderStatus: "${order.orderStatus}"`);
        console.log(`- status: "${order.status}"`);

        // Try a dry run save to see if it triggers validation error
        try {
            await order.validate();
            console.log("✅ Validation Passed");
        } catch (vErr) {
            console.log("❌ Validation Failed:", vErr.message);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkCasing();
