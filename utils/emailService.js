const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendOTPEmail = async (email, otp) => {

    console.log("📧 Attempting to send OTP email...");
    console.log("📧 Sender:", process.env.EMAIL_USER);
    console.log("📧 Receiver:", email);

    await transporter.sendMail({
        from: `"Genzikart" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        html: `<h2>Your OTP: ${otp}</h2>
               <p>Valid for 5 minutes</p>`
    });

    console.log("✅ Email sent successfully!");
};
