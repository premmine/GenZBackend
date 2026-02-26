const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin(email) {
    if (!email) {
        console.error("❌ Please provide an email address.");
        process.exit(1);
    }

    try {
        console.log(`⏳ Connecting to database...`);
        await mongoose.connect(process.env.MONGO_URI);

        console.log(`🔎 Searching for user: ${email}`);
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(`✅ User found. Promoting to Admin...`);
            user.role = 'admin';
            user.isVerified = true; // Ensure they can log in
            await user.save();
            console.log(`🚀 Success! ${email} is now an Admin.`);
        } else {
            console.log(`📝 User not found. Creating new Admin account...`);
            user = new User({
                email: email.toLowerCase(),
                role: 'admin',
                isVerified: true,
                name: 'System Admin'
            });
            await user.save();
            console.log(`🚀 Success! New Admin account created for ${email}.`);
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
    }
}

// Get email from command line argument
const emailArg = process.argv[2];
createAdmin(emailArg);
