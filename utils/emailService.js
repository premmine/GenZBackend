const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ Email Server Error:", error.message);
    } else {
        console.log("✅ Email Server is ready to take our messages");
    }
});

exports.sendOTPEmail = async (email, otp) => {

    console.log("📧 Attempting to send OTP email...");
    console.log("📧 Sender:", process.env.EMAIL_USER);
    console.log("📧 Receiver:", email);

    try {
        const info = await transporter.sendMail({
            from: `"Genzikart" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            html: `<h2>Your OTP: ${otp}</h2>
                   <p>Valid for 5 minutes</p>`
        });
        console.log("✅ Email sent successfully! ID:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ NODEMAILER SEND ERROR:", error.message);
        throw error;
    }
};

exports.sendBackInStockEmail = async (email, product) => {
    console.log(`--- 📧 EMAIL DISPATCH DEBUG [To: ${email}] ---`);
    console.log(`Product: ${product.name} (_id: ${product._id})`);

    try {
        // Construct product link
        const productLink = `https://genzikart.in/product.html?id=${product._id}`;
        console.log(`Link generated: ${productLink}`);

        const mailOptions = {
            from: `"Genzikart" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🔥 HURRY! ${product.name} is Back in Stock - Limited Supply!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #B91C1C; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold;">
                        ⚠️ HURRY! This item is in high demand and might sell out again in minutes!
                    </div>
                    
                    <h2 style="color: #4F46E5;">Good News! It's Back!</h2>
                    <p>Hello,</p>
                    <p>You asked us to notify you when <strong>${product.name}</strong> is available again. Well, the wait is over!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${productLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Buy It Now Before It Sells Out</a>
                    </div>
                    
                    <p style="color: #64748B; font-size: 14px;">Don't wait! Stock is extremely limited and we cannot guarantee how long it will last.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94A3B8;">You are receiving this because you subscribed to back-in-stock notifications at Genzikart.in.</p>
                </div>
            `
        };

        console.log(`Attempting transport via Nodemailer...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email accepted by server: ${info.messageId}`);
        console.log(`--- 📧 DEBUG END ---`);
        return info;
    } catch (error) {
        console.error(`❌ NODEMAILER ERROR:`, error.message);
        console.log(`--- 📧 DEBUG END ---`);
        throw error;
    }
};

exports.sendInvoiceEmail = async (email, invoiceData, pdfPath) => {
    console.log(`📧 Sending Invoice PDF to ${email}...`);
    try {
        await transporter.sendMail({
            from: `"GenziKart" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Invoice for Order ${invoiceData.orderDisplayId} - GenziKart`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4F46E5;">Thank you for your order!</h2>
                    <p>Dear ${invoiceData.customerName},</p>
                    <p>Please find attached the invoice for your order <strong>${invoiceData.orderDisplayId || invoiceData.orderId}</strong>.</p>
                    <p><strong>Order Summary:</strong></p>
                    <ul>
                        <li>Invoice Number: ${invoiceData.invoiceNumber}</li>
                        <li>Total Amount: ₹${invoiceData.totalAmount.toFixed(2)}</li>
                        <li>Payment Method: ${invoiceData.paymentMethod}</li>
                    </ul>
                    <p>We'll notify you when your order is shipped.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94A3B8;">Best Regards,<br>Team GenziKart</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice_${invoiceData.invoiceNumber}.pdf`,
                    path: pdfPath
                }
            ]
        });
        console.log("✅ Invoice email sent successfully!");
    } catch (error) {
        console.error("❌ Failed to send invoice email:", error.message);
    }
};

exports.sendOrderStatusEmail = async (email, order, newStatus) => {
    console.log(`📧 Sending status update (${newStatus}) to ${email}...`);
    try {
        const statusMessages = {
            'placed': 'Your order has been placed successfully!',
            'confirmed': 'Your order has been confirmed and is being processed.',
            'packed': 'Your order has been packed and is ready for shipping.',
            'shipped': `Your order has been shipped! Tracking ID: ${order.trackingId || 'N/A'}`,
            'out-of-delivery': 'Your order is out for delivery today!',
            'delivered': 'Your order has been delivered successfully. Enjoy your purchase!',
            'cancelled': 'Your order has been cancelled.',
            'returned': 'Your return request has been processed.'
        };

        const statusKey = newStatus.toLowerCase();

        await transporter.sendMail({
            from: `"GenziKart" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Order Update: ${newStatus.toUpperCase()} - ${order.id}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4F46E5;">Order Update</h2>
                    <p>Hello ${order.customer},</p>
                    <p>The status of your order <strong>${order.id}</strong> has been updated to <strong>${newStatus.toUpperCase()}</strong>.</p>
                    <div style="background: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        ${statusMessages[statusKey] || 'Your order status has changed.'}
                    </div>
                    <p>You can track your order using this ID: <strong>${order.trackingId}</strong></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94A3B8;">Best Regards,<br>Team GenziKart</p>
                </div>
            `
        });
        console.log("✅ Status update email sent!");
    } catch (error) {
        console.error("❌ Failed to send status update email:", error.message);
    }
};
