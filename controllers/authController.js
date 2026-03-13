const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateOTP } = require("../utils/otpGenerator");
const { sendOTPEmail } = require("../utils/emailService");

/* ================= SEND OTP ================= */

exports.sendOTP = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : null;

        if (!email) return res.json({ success: false, message: "Email is required" });

        console.log("🔥 SEND OTP REQUEST:", email);

        let user = await User.findOne({ email });

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        if (!user) {
            // ✅ REGISTRATION FLOW: Create new pending user
            user = new User({
                email,
                otpHash,
                otpExpires: Date.now() + 5 * 60 * 1000,
                isVerified: false
            });
            await user.save();
        } else {
            // ✅ LOGIN FLOW: Use updateOne to bypass strict validation on old docs
            const updateResult = await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        otpHash: otpHash,
                        otpExpires: Date.now() + 5 * 60 * 1000,
                        otpAttempts: 0
                    }
                }
            );
            console.log(`✅ User OTP updated: ${updateResult.modifiedCount} document(s)`);
        }

        try {
            await sendOTPEmail(email, otp);
            res.json({ success: true, message: "OTP sent successfully" });
        } catch (emailErr) {
            console.error("❌ Email Dispatch Failed:", emailErr.message);
            res.status(500).json({ success: false, message: "Email service failed. Please check server logs." });
        }

    } catch (err) {
        console.error("❌ SEND OTP CONTROLLER ERROR:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/* ================= VERIFY OTP ================= */

exports.verifyOTP = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : null;
        const { otp } = req.body;

        console.log("🔥 VERIFY OTP:", email);

        const user = await User.findOne({ email });

        if (!user)
            return res.json({ success: false, message: "User not found" });

        if (user.otpExpires < Date.now())
            return res.json({ success: false, message: "OTP has expired" });

        if (user.otpAttempts >= 3)
            return res.json({ success: false, message: "Too many failed attempts. Please request a new code." });

        const valid = await bcrypt.compare(otp, user.otpHash);

        if (!valid) {
            await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
            return res.json({ success: false, message: "Invalid OTP code" });
        }

        // ✅ UPDATE USER DETAILS (For registration)
        const { name, phone } = req.body;
        const updateData = {
            isVerified: true,
            lastLogin: new Date()
        };

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        await User.updateOne(
            { _id: user._id },
            {
                $set: updateData,
                $unset: { otpHash: "" } // Clear OTP after use
            }
        );

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Fetch the updated user to get the latest state (especially isVerified and any updated fields)
        const updatedUser = await User.findById(user._id);
        const addr = (updatedUser.addresses && updatedUser.addresses.length > 0)
            ? (updatedUser.addresses.find(a => a.isDefault) || updatedUser.addresses[0])
            : {};
        
        // Profile is complete if name, phone, whatsapp, and a valid address exist
        const isProfileComplete = !!(
            updatedUser.name && 
            updatedUser.phone && 
            updatedUser.whatsapp && 
            addr.line1 && 
            addr.city && 
            addr.state && 
            addr.pincode
        );

        res.json({
            token,
            isProfileComplete,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        console.log("VERIFY OTP ERROR:", err);
        res.json({ error: true });
    }
};

/* ================= CHECK USER ================= */

exports.checkUser = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : null;

        console.log("🔥 CHECK USER:", email);

        const user = await User.findOne({ email });

        if (!user || !user.isVerified)
            return res.json({ success: false, exists: false, message: "User not found or unverified" });

        res.json({ success: true, exists: true });

    } catch (err) {
        console.log("CHECK USER ERROR:", err);
        res.status(500).json({ success: false, exists: false, message: "Internal server error" });
    }
};
/* ================= EMAIL CHANGE OTP ================= */

exports.sendEmailChangeOTP = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!newEmail) return res.json({ success: false, message: "Email required" });

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        await User.findByIdAndUpdate(userId, {
            newEmailTemp: newEmail,
            newEmailOtpHash: otpHash,
            newEmailOtpExpires: Date.now() + 5 * 60 * 1000,
            newEmailOtpAttempts: 0
        });

        await sendOTPEmail(newEmail, otp);
        res.json({ success: true });

    } catch (err) {
        console.log("SEND EMAIL CHANGE OTP ERROR:", err);
        res.json({ success: false, message: "Server error" });
    }
};

exports.verifyEmailChangeOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user || user.newEmailOtpExpires < Date.now()) {
            return res.json({ success: false, message: "OTP expired" });
        }

        if (user.newEmailOtpAttempts >= 3) {
            return res.json({ success: false, message: "Too many attempts. Request new OTP.", locked: true });
        }

        const valid = await bcrypt.compare(otp, user.newEmailOtpHash);

        if (!valid) {
            user.newEmailOtpAttempts++;
            await user.save();
            return res.json({
                success: false,
                message: "Incorrect OTP",
                attemptsLeft: 3 - user.newEmailOtpAttempts
            });
        }

        // Success: Update email
        user.email = user.newEmailTemp;
        user.newEmailTemp = undefined;
        user.newEmailOtpHash = undefined;
        user.newEmailOtpExpires = undefined;
        user.newEmailOtpAttempts = 0;
        await user.save();

        res.json({ success: true, newEmail: user.email });

    } catch (err) {
        console.log("VERIFY EMAIL CHANGE OTP ERROR:", err);
        res.json({ success: false, message: "Server error" });
    }
};