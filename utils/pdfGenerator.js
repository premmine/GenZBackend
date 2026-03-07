const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');



// Company details
const COMPANY = {
    name: 'GenziKart',
    tagline: 'Your Style, Delivered.',
    address: 'Shadipur, New Delhi – 110008,India',
    phone: '+91 95081 03997',
    email: 'support@genzikart.in',
    website: 'www.genzikart.in',
    gst: 'GSTIN: 29AABCG1234A1Z5',
    pan: 'PAN: AABCG1234A'
};

// Color palette
const COLORS = {
    primary: '#6C3CE1',
    primaryDark: '#4B2BA8',
    dark: '#1E293B',
    medium: '#64748B',
    light: '#94A3B8',
    border: '#E2E8F0',
    rowEven: '#F8FAFC',
    rowOdd: '#FFFFFF',
    success: '#059669',
    accent: '#F1EDFF'
};

/**
 * Generate a professional PDF invoice
 * @param {Object} invoice - Invoice document from MongoDB
 * @returns {Promise<string>} - File path of the generated PDF
 */
exports.generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        const dirPath = process.env.VERCEL
            ? path.join('/tmp', 'invoices')
            : path.join(__dirname, '..', 'invoices');

        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const fileName = `${invoice.invoiceNumber}.pdf`;
        const filePath = path.join(dirPath, fileName);

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 50, right: 50 },
            info: {
                Title: `Invoice ${invoice.invoiceNumber}`,
                Author: 'GenziKart',
                Subject: `Invoice for Order ${invoice.orderDisplayId}`
            }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const pageWidth = doc.page.width;
        const leftMargin = 50;
        const rightEdge = pageWidth - 50;
        const contentW = rightEdge - leftMargin;

        // ── HEADER ──────────────────────────────────────────────────────────
        // Purple header band
        doc.rect(0, 0, pageWidth, 110).fill(COLORS.primary);

        // Company name
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text(COMPANY.name, leftMargin, 28, { align: 'left' });

        doc.fontSize(10).font('Helvetica').fillColor('#DDD6FE')
            .text(COMPANY.tagline, leftMargin, 60);

        // INVOICE label on the right
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text('INVOICE', 0, 28, { align: 'right', width: pageWidth - 50 });

        // Invoice meta on right
        doc.fontSize(9).font('Helvetica').fillColor('#DDD6FE');
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 0, 62, { align: 'right', width: pageWidth - 50 });
        doc.text(`Order   #: ${invoice.orderDisplayId || '—'}`, 0, 75, { align: 'right', width: pageWidth - 50 });
        doc.text(`Date      : ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 0, 88, { align: 'right', width: pageWidth - 50 });

        // ── COMPANY INFO STRIP ────────────────────────────────────
        doc.rect(0, 110, pageWidth, 55).fill(COLORS.accent);

        doc.fontSize(8).font('Helvetica').fillColor(COLORS.medium)
            .text(COMPANY.address, leftMargin, 120, { width: contentW * 0.55 });
        doc.text(`${COMPANY.phone}  |  ${COMPANY.email}  |  ${COMPANY.website}`, leftMargin, 132, { width: contentW * 0.55 });

        // Payment badge
        const payMethod = (invoice.paymentMethod || 'COD').toUpperCase();
        const payStatus = (invoice.paymentStatus || 'Pending').toLowerCase();
        const payBadgeColor = payStatus === 'paid' ? COLORS.success : '#D97706';
        doc.roundedRect(rightEdge - 110, 118, 110, 30, 6).fill(payBadgeColor);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text(payMethod, rightEdge - 105, 122, { width: 100, align: 'center' });
        doc.fontSize(8).font('Helvetica').fillColor('#FFFFFF')
            .text(payStatus.toUpperCase(), rightEdge - 105, 134, { width: 100, align: 'center' });

        let y = 175;

        // ── ADDRESSES ────────────────────────────────────
        const addrBoxW = (contentW - 20) / 2;
        const shipping = invoice.shippingAddress || {};

        // Billing box (Using same info if not distinct)
        doc.roundedRect(leftMargin, y, addrBoxW, 100, 6)
            .strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary)
            .text('BILL TO', leftMargin + 12, y + 10);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark)
            .text(shipping.name || invoice.customerName, leftMargin + 12, y + 24);
        doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.medium)
            .text(`${shipping.line1 || ''}\n${shipping.line2 ? shipping.line2 + '\n' : ''}${shipping.city}, ${shipping.state} - ${shipping.pincode}`, leftMargin + 12, y + 39, { width: addrBoxW - 24 });
        doc.text(`PH: ${shipping.phone || invoice.customerPhone}`, leftMargin + 12, y + 78);
        doc.text(invoice.customerEmail, leftMargin + 12, y + 88);

        // Shipping box
        const sx = leftMargin + addrBoxW + 20;
        doc.roundedRect(sx, y, addrBoxW, 100, 6)
            .strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary)
            .text('SHIP TO', sx + 12, y + 10);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark)
            .text(shipping.name || invoice.customerName, sx + 12, y + 24);
        doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.medium)
            .text(`${shipping.line1 || ''}\n${shipping.line2 ? shipping.line2 + '\n' : ''}${shipping.city}, ${shipping.state} - ${shipping.pincode}`, sx + 12, y + 39, { width: addrBoxW - 24 });
        doc.text(`PH: ${shipping.phone || invoice.customerPhone}`, sx + 12, y + 78);

        y += 115;

        // ── ITEMS TABLE ─────────────────────────────────────────────────────
        // Table header
        const cols = {
            num: { x: leftMargin, w: 30 },
            name: { x: leftMargin + 30, w: 210 },
            qty: { x: leftMargin + 240, w: 60 },
            price: { x: leftMargin + 300, w: 80 },
            total: { x: leftMargin + 380, w: contentW - 380 }
        };

        doc.rect(leftMargin, y, contentW, 22).fill(COLORS.primary);
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('#', cols.num.x + 5, y + 7);
        doc.text('ITEM', cols.name.x + 5, y + 7);
        doc.text('QTY', cols.qty.x + 5, y + 7);
        doc.text('UNIT PRICE', cols.price.x + 5, y + 7);
        doc.text('TOTAL', cols.total.x + 5, y + 7);
        y += 22;

        // Table rows
        invoice.items.forEach((item, idx) => {
            const rowH = 24;
            const isEven = idx % 2 === 0;
            doc.rect(leftMargin, y, contentW, rowH).fill(isEven ? COLORS.rowEven : COLORS.rowOdd);

            doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark);
            doc.text(String(idx + 1), cols.num.x + 5, y + 8, { width: cols.num.w });
            doc.text(item.productName || 'Product', cols.name.x + 5, y + 8, { width: cols.name.w - 10, ellipsis: true });
            doc.text(String(item.quantity || 0), cols.qty.x + 5, y + 8, { width: cols.qty.w });
            doc.text(`₹${(item.price || 0).toFixed(2)}`, cols.price.x + 5, y + 8, { width: cols.price.w });
            doc.font('Helvetica-Bold')
                .text(`₹${(item.total || 0).toFixed(2)}`, cols.total.x + 5, y + 8, { width: cols.total.w - 5 });
            y += rowH;
        });

        // Table bottom border
        doc.rect(leftMargin, y, contentW, 1).fill(COLORS.border);
        y += 15;

        // ── TOTALS SECTION ───────────────────────────────────────────────────
        const totalsX = leftMargin + contentW * 0.55;
        const totalsW = contentW * 0.45;

        const addRow = (label, value, bold = false, color = COLORS.dark) => {
            doc.fontSize(9)
                .font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor(COLORS.medium)
                .text(label, totalsX, y, { width: totalsW * 0.60 });
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor(color)
                .text(value, totalsX + totalsW * 0.60, y, { width: totalsW * 0.40, align: 'right' });
            y += 16;
        };

        addRow('Subtotal:', `₹${(invoice.subtotal || 0).toFixed(2)}`);
        if (invoice.discountAmount > 0)
            addRow('Discount:', `-₹${(invoice.discountAmount || 0).toFixed(2)}`, false, COLORS.success);
        if (invoice.shippingCharge > 0)
            addRow('Shipping Fee:', `₹${(invoice.shippingCharge || 0).toFixed(2)}`);

        // Grand total box
        y += 6;
        doc.rect(totalsX, y, totalsW, 30).fill(COLORS.primary);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text('NET AMOUNT', totalsX + 10, y + 9, { width: totalsW * 0.55 });
        doc.text(`₹${(invoice.totalAmount || 0).toFixed(2)}`, totalsX + totalsW * 0.55, y + 9, { width: totalsW * 0.45 - 10, align: 'right' });
        y += 42;

        // Transaction ID
        if (invoice.transactionId) {
            doc.fontSize(8).font('Helvetica').fillColor(COLORS.medium)
                .text(`Transaction ID: ${invoice.transactionId}`, leftMargin, y);
            y += 14;
        }

        // ── NOTES ────────────────────────────────────────────────────────────
        y += 10;
        doc.rect(leftMargin, y, contentW, 1).fill(COLORS.border);
        y += 10;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.dark).text('Notes:', leftMargin, y);
        y += 12;
        doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.medium)
            .text('Thank you for shopping with GenziKart! If you have any questions about this invoice, please contact support@genzikart.in within 30 days.', leftMargin, y, { width: contentW });

        // ── FOOTER ───────────────────────────────────────────────────────────
        const footerY = doc.page.height - 60;
        doc.rect(0, footerY, pageWidth, 60).fill(COLORS.dark);

        doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.light)
            .text('TERMS & CONDITIONS', leftMargin, footerY + 10, { width: contentW });
        doc.fontSize(7).font('Helvetica').fillColor('#64748B')
            .text('1. All sales are subject to GenziKart\'s return & refund policy.  2. Disputes must be raised within 7 days of delivery.  3. This is a computer-generated invoice and does not require a signature.', leftMargin, footerY + 22, { width: contentW });

        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.light)
            .text(`${COMPANY.name}  |  ${COMPANY.website}  |  ${COMPANY.gst}`, leftMargin, footerY + 40, { width: contentW, align: 'center' });

        // Finalize
        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
};
