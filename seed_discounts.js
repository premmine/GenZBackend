const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Discount = require('./models/Discount');

async function seedDiscounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing discounts (optional, but good for testing)
        // await Discount.deleteMany({});

        const discounts = [
            {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                minOrder: 100,
                status: 'active'
            },
            {
                code: 'NEW100',
                type: 'fixed',
                value: 100,
                minOrder: 500,
                status: 'active'
            }
        ];

        for (const data of discounts) {
            await Discount.findOneAndUpdate(
                { code: data.code },
                data,
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded discount: ${data.code}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding discounts:', err);
        process.exit(1);
    }
}

seedDiscounts();
