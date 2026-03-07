const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Order = require('./models/Order');

async function syncAllOrders() {
    try {
        console.log("🚀 STARTING GLOBAL STATUS SYNCHRONIZATION");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const orders = await Order.find({});
        console.log(`📦 Found ${orders.length} orders to check.`);

        let updatedCount = 0;
        for (const order of orders) {
            let needsSave = false;

            // 1. Sync orderStatus -> status (legacy)
            const targetStatus = (order.orderStatus || 'Placed').toLowerCase();
            if (order.status !== targetStatus) {
                console.log(`🔧 Syncing status for ${order.id}: ${order.status} -> ${targetStatus}`);
                order.status = targetStatus;
                needsSave = true;
            }

            // 2. Normalize Payment Status
            if (order.paymentStatus) {
                const statusMap = {
                    'pending': 'Pending',
                    'paid': 'Paid',
                    'failed': 'Failed',
                    'refunded': 'Refunded'
                };
                const lower = order.paymentStatus.toLowerCase();
                if (statusMap[lower] && order.paymentStatus !== statusMap[lower]) {
                    console.log(`🔧 Normalizing paymentStatus for ${order.id}: ${order.paymentStatus} -> ${statusMap[lower]}`);
                    order.paymentStatus = statusMap[lower];
                    needsSave = true;
                }
            }

            // 3. Normalize Payment Method
            if (order.paymentMethod) {
                const methodMap = {
                    'cod': 'COD',
                    'razorpay': 'razorpay',
                    'upi': 'UPI',
                    'online': 'Online'
                };
                const lower = order.paymentMethod.toLowerCase();
                if (methodMap[lower] && order.paymentMethod !== methodMap[lower]) {
                    console.log(`🔧 Normalizing paymentMethod for ${order.id}: ${order.paymentMethod} -> ${methodMap[lower]}`);
                    order.paymentMethod = methodMap[lower];
                    needsSave = true;
                }
            }

            // 4. Fix missing totalAmount
            if (!order.totalAmount || isNaN(order.totalAmount)) {
                const subtotal = (order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const calcTotal = subtotal + (order.shippingCharge || 0) - (order.discountAmount || 0);
                console.log(`🔧 Fixing totalAmount for ${order.id}: ${order.totalAmount} -> ${calcTotal}`);
                order.totalAmount = calcTotal;
                needsSave = true;
            }

            if (needsSave) {
                await order.save();
                updatedCount++;
            }
        }

        console.log(`✅ FINISHED! Updated ${updatedCount} orders.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ MIGRATION FAILED:", err);
        process.exit(1);
    }
}

syncAllOrders();
