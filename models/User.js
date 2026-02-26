const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    phone: String,

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

    // New profile fields
    address: {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        type: { type: String, enum: ['home', 'work'], default: 'home' }
    },
    whatsapp: String,

    // Email change verification
    newEmailTemp: String,
    newEmailOtpHash: String,
    newEmailOtpExpires: Date,
    newEmailOtpAttempts: { type: Number, default: 0 }

}, { timestamps: true, collection: 'users' });

// Check if model already exists to avoid OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
