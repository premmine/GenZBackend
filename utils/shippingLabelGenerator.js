const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a Shipping Label PDF
 */
exports.generateShippingLabelPDF = (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 30, size: [288, 432] }); // 4x6 inch label
            const fileName = `Label_${order.id}.pdf`;
            const dirPath = path.join(__dirname, '../labels');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const filePath = path.join(dirPath, fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // --- BORDER ---
            doc.rect(10, 10, 268, 412).stroke();

            // --- HEADER ---
            doc.fontSize(18).font('Helvetica-Bold').text('GenziKart', 20, 30);
            doc.fontSize(8).font('Helvetica').text('Expedited Shipping', 20, 50);
            doc.moveTo(20, 65).lineTo(268, 65).stroke();

            // --- FROM ---
            doc.fontSize(7).fillColor('#666666').text('FROM:', 20, 75);
            doc.fillColor('#000000').fontSize(8)
                .text('GenziKart Fulfillment Center', 20, 85)
                .text('Logistics Hub, Sector 62', 20, 95)
                .text('Bangalore, KA - 560001', 20, 105);

            doc.moveTo(10, 120).lineTo(278, 120).stroke();

            // --- TO ---
            doc.fontSize(10).fillColor('#666666').text('SHIP TO:', 20, 135);
            const addr = order.shippingAddress;
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
                .text(addr.name || order.customer, 20, 155);
            doc.fontSize(12).font('Helvetica')
                .text(addr.line1 || '', 20, 175)
                .text(addr.line2 || '', 20, 195)
                .text(`${addr.city}, ${addr.state}`, 20, 215)
                .text(`PIN: ${addr.pincode}`, 20, 235);
            doc.text(`PH: ${addr.phone}`, 20, 255);

            doc.moveTo(10, 280).lineTo(278, 280).stroke();

            // --- ORDER INFO ---
            doc.fontSize(10).font('Helvetica-Bold').text(`ORDER: ${order.id}`, 20, 300);
            doc.fontSize(10).text(`Method: ${order.paymentMethod}`, 20, 315);

            if (order.paymentMethod === 'COD') {
                doc.rect(140, 290, 130, 60).fillAndStroke('#000000', '#000000');
                doc.fillColor('#FFFFFF').fontSize(10).text('COLLECT CASH', 150, 305);
                doc.fontSize(20).text(`₹${order.codAmount}`, 150, 320);
            }

            // --- FOOTER ---
            doc.fillColor('#000000').fontSize(8).text('Tracking ID:', 20, 370);
            doc.fontSize(12).font('Helvetica-Bold').text(order.trackingId || 'PENDING', 20, 385);

            doc.end();
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
