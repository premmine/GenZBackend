const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send Support Ticket Email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {object} data - Template variables
 * @param {string} type - 'created', 'reply', 'resolved'
 */
exports.sendTicketEmail = async (to, subject, data, type) => {
    let htmlContent = '';

    const baseStyle = `
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #eee;
        border-radius: 10px;
    `;

    const headerStyle = `
        background-color: #4F46E5;
        color: white;
        padding: 20px;
        border-radius: 8px 8px 0 0;
        text-align: center;
        margin: -20px -20px 20px -20px;
    `;

    const footerStyle = `
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
        text-align: center;
    `;

    if (type === 'created') {
        htmlContent = `
            <div style="${baseStyle}">
                <p>Dear ${data.customerName},</p>
                <p>Thank you for contacting GenziKart Support.</p>
                <p>Your support request has been received.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${data.ticketId}</p>
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${data.orderId || 'N/A'}</p>
                </div>

                <p>Our team is currently reviewing your request.</p>
                <p>We appreciate your patience and thank you for choosing GenziKart.</p>
                
                <div style="${footerStyle}">
                    <p>Best regards,<br><strong>GenziKart Support Team</strong></p>
                </div>
            </div>
        `;
    } else if (type === 'reply') {
        htmlContent = `
            <div style="${baseStyle}">
                <p>Dear ${data.customerName},</p>
                <p>Our support team has updated your ticket <strong>#${data.ticketId}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 20px 0;">
                    <p style="margin:0; font-style: italic;">"${data.replyMessage}"</p>
                </div>

                <p>Ticket ID: ${data.ticketId}</p>
                <p>Order ID: ${data.orderId || 'N/A'}</p>
                <p>We appreciate your patience and thank you for choosing GenziKart.</p>
                
                <div style="${footerStyle}">
                    <p>Best regards,<br><strong>GenziKart Support Team</strong></p>
                </div>
            </div>
        `;
    } else if (type === 'resolved') {
        htmlContent = `
            <div style="${baseStyle}">
                <p>Dear ${data.customerName},</p>
                <p>Your support ticket <strong>#${data.ticketId}</strong> regarding Order ID <strong>${data.orderId || 'N/A'}</strong> has been marked as <strong>Resolved</strong>.</p>
                
                <p>We hope we were able to assist you effectively. If you have any further questions, feel free to reply to this ticket or open a new one.</p>

                <p>We appreciate your patience and thank you for choosing GenziKart.</p>

                <div style="${footerStyle}">
                    <p>Best regards,<br><strong>GenziKart Support Team</strong></p>
                </div>
            </div>
        `;
    }

    const mailOptions = {
        from: `"GenziKart Support" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Support email sent to ${to} (${type})`);
    } catch (error) {
        console.error(`❌ Email error:`, error);
    }
};
