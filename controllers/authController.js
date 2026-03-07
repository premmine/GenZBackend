const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateOTP } = require("../utils/otpGenerator");
const { sendOTPEmail } = require("../utils/emailService");

/* ================= SEND OTP ================= */

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.json({ error: true });

        console.log("🔥 SEND OTP:", email);

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
        } else {
            // ✅ LOGIN FLOW
            user.otpHash = otpHash;
            user.otpExpires = Date.now() + 5 * 60 * 1000;
            user.otpAttempts = 0;
        }

        await user.save();
        await sendOTPEmail(email, otp);

        res.json({ success: true });

    } catch (err) {
        console.log("SEND OTP ERROR:", err);
        res.json({ error: true });
    }
};

/* ================= VERIFY OTP ================= */

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("🔥 VERIFY OTP:", email);

        const user = await User.findOne({ email });

        if (!user || user.otpExpires < Date.now())
            return res.json({ error: true });

        if (user.otpAttempts >= 3)
            return res.json({ error: true });

        const valid = await bcrypt.compare(otp, user.otpHash);

        if (!valid) {
            user.otpAttempts++;
            await user.save();
            return res.json({ error: true });
        }

        // ✅ UPDATE USER DETAILS (For registration)
        const { name, phone } = req.body;
        if (name) user.name = name;
        if (phone) user.phone = phone;

        user.isVerified = true;
        user.lastLogin = new Date();
        user.otpHash = undefined; // Clear OTP after use
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const addr = user.address || {};
        const isProfileComplete = !!(user.name && user.phone && user.whatsapp && addr.line1 && addr.city && addr.state);

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
        const { email } = req.body;

        console.log("🔥 CHECK USER:", email);

        const user = await User.findOne({ email });

        if (!user || !user.isVerified)
            return res.json({ exists: false });

        res.json({ exists: true });

    } catch (err) {
        console.log("CHECK USER ERROR:", err);
        res.json({ exists: false });
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