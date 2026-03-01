const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const OfferVideo = require('./models/OfferVideo');
const Product = require('./models/Product');

async function seedOffers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find some products to link to
        const products = await Product.find().limit(2);
        if (products.length < 2) {
            console.log('Please add at least 2 products before seeding offers.');
            process.exit(0);
        }

        // Clear existing offers
        await OfferVideo.deleteMany({});

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 2); // 2 days from now

        const seedData = [
            {
                productId: products[0]._id,
                videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
                title: 'Premium iPhone Collection',
                offerText: 'FLAT 30% OFF - TODAY ONLY',
                discountPercentage: 30,
                expiryDate: expiryDate,
                isActive: true
            },
            {
                productId: products[1]._id,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                title: 'Crystal Clear Protection',
                offerText: 'BUY 1 GET 1 FREE',
                discountPercentage: 50,
                expiryDate: expiryDate,
                isActive: true
            }
        ];

        await OfferVideo.insertMany(seedData);
        console.log('Successfully seeded offer videos!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding offers:', err);
        process.exit(1);
    }
}

seedOffers();
