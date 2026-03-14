const mongoose = require('mongoose');
require('dotenv').config();
const userController = require('./controllers/userController');
const discountController = require('./controllers/discountController');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const mockRes = {
            json: (data) => console.log('Response JSON:', JSON.stringify(data).substring(0, 100) + '...'),
            status: (code) => {
                console.log('Response Status:', code);
                return mockRes;
            }
        };

        console.log('Testing getUsers...');
        await userController.getUsers({}, mockRes);

        console.log('Testing getDiscounts...');
        await discountController.getDiscounts({}, mockRes);

    } catch (err) {
        console.error('Test script error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
