/**
 * One-time migration: Drop the old non-sparse productId_1 index.
 * Mongoose will recreate it as sparse (unique + sparse) on next server start.
 *
 * Run with: node backend/scripts/fixProductIndex.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fixIndex() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected.');

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // List current indexes
        const indexes = await collection.indexes();
        const exists = indexes.find(i => i.name === 'productId_1');

        if (exists) {
            await collection.dropIndex('productId_1');
            console.log('✅ Dropped old productId_1 index. Mongoose will recreate it as sparse on next startup.');
        } else {
            console.log('ℹ️  productId_1 index not found — nothing to drop.');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected. Done.');
    }
}

fixIndex();
