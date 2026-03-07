const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Discount = require('./models/Discount');

async function updateSave10() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Discount.findOneAndUpdate(
            { code: 'SAVE10' },
            { minOrder: 100 },
            { new: true, upsert: true }
        );

        console.log('Updated Discount:', result);
        process.exit(0);
    } catch (err) {
        console.error('Error updating discount:', err);
        process.exit(1);
    }
}

updateSave10();
