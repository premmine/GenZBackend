const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    phone: String,
    image: String,

    authProvider: {
        type: String,
        enum: ["email", "google"],
        default: "email"
    },

    googleId: String,

    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    otpHash: String,
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },

    role: { type: String, default: "customer" },
    lastLogin: Date,

    // Dashboard specific fields (formerly in Customer.js)
    orders: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    status: { type: String, default: 'active' },

    // Address Book support
    addresses: [{
        name: { type: String, trim: true, required: true },
        phone: { type: String, required: true },
        alternatePhone: { type: String, trim: true },
        pincode: { type: String, trim: true, required: true },
        state: { type: String, trim: true, required: true },
        city: { type: String, trim: true, required: true },
        line1: { type: String, trim: true, required: true },
        line2: { type: String, trim: true, required: true },
        landmark: { type: String, trim: true },
        addressType: { type: String, enum: ['Home', 'Work', 'Office'], default: 'Home' },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    whatsapp: String,

    // Email change verification
    newEmailTemp: String,
    newEmailOtpHash: String,
    newEmailOtpExpires: Date,
    newEmailOtpAttempts: { type: Number, default: 0 }

}, { timestamps: true, collection: 'users' });

// Check if model already exists to avoid OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
