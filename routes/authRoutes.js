const router = require("express").Router();
const { sendOTP, verifyOTP, checkUser, sendEmailChangeOTP, verifyEmailChangeOTP } = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/check-user", checkUser);
router.post("/send-email-change-otp", auth, sendEmailChangeOTP);
router.post("/verify-email-change-otp", auth, verifyEmailChangeOTP);

module.exports = router;