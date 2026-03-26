const Setting = require('../models/Setting');

// Get global store settings (public)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // Create default settings document if none exists
            settings = await Setting.create({
                whatsappNumber: "+919508103997",
                storeEmail: "helpgenzikart@gmail.com"
            });
        }

        // Auto-heal empty fields from previous deployments
        let needsSave = false;
        if (!settings.whatsappNumber) { 
            settings.whatsappNumber = "+919508103997"; 
            needsSave = true; 
        }
        if (!settings.storeEmail || settings.storeEmail === "helpgenzikart@gmail.con") { 
            settings.storeEmail = "helpgenzikart@gmail.com"; 
            needsSave = true; 
        }

        if (needsSave) {
            await settings.save();
        }

        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update global store settings (admin only)
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting(req.body);
            await settings.save();
        } else {
            // Update existing fields
            const { storeName, storeEmail, currency, taxRate, whatsappNumber, instagramUrl, twitterUrl, facebookUrl } = req.body;
            if (storeName !== undefined) settings.storeName = storeName;
            if (storeEmail !== undefined) settings.storeEmail = storeEmail;
            if (currency !== undefined) settings.currency = currency;
            if (taxRate !== undefined) settings.taxRate = taxRate;
            if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;
            if (instagramUrl !== undefined) settings.instagramUrl = instagramUrl;
            if (twitterUrl !== undefined) settings.twitterUrl = twitterUrl;
            if (facebookUrl !== undefined) settings.facebookUrl = facebookUrl;
            await settings.save();
        }
        res.json({ success: true, settings, message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
