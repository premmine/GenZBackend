const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Order = require('./models/Order');

async function checkOrderDetails() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne({ id: 'ORD-A7LMTC' });
        console.log("📦 Order ORD-A7LMTC Items:");
        console.log(JSON.stringify(order.items, null, 2));
        console.log(`- subtotal: ${order.subtotal}`);
        console.log(`- shippingCharge: ${order.shippingCharge}`);
        console.log(`- discountAmount: ${order.discountAmount}`);
        console.log(`- totalAmount: ${order.totalAmount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkOrderDetails();
