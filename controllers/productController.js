const Product = require('../models/Product');
const StockSubscription = require('../models/StockSubscription');
const emailService = require('../utils/emailService');
const mongoose = require('mongoose');

// Get all products (with optional search)
exports.getProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            // Trim and limit search length
            const keyword = search.trim().substring(0, 50);

            // Escape special characters for regex
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            query = {
                $or: [
                    { name: { $regex: escapedKeyword, $options: 'i' } },
                    { category: { $regex: escapedKeyword, $options: 'i' } },
                    { brand: { $regex: escapedKeyword, $options: 'i' } },
                    { description: { $regex: escapedKeyword, $options: 'i' } },
                    { sku: { $regex: escapedKeyword, $options: 'i' } }
                ]
            };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        // Return enriched response
        res.json({
            success: true,
            count: products.length,
            products: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add new product
exports.addProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get single product by ID
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product Not Found" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const oldStock = parseInt(product.stock);
        const newStock = req.body.stock !== undefined ? parseInt(req.body.stock) : oldStock;

        console.log(`--- 🚀 ULTIMATE NOTIFICATION DEBUG START [${product.name}] ---`);
        console.log(`Step 1: Raw old stock: ${product.stock}, Parsed: ${oldStock}`);
        console.log(`Step 2: Raw new stock from body: ${req.body.stock}, Parsed: ${newStock}`);

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Trigger Back-in-Stock Notifications
        // Robust check: handles 0, null, undefined, or accidentally negative stock
        const isBackInStock = (isNaN(oldStock) || oldStock <= 0) && newStock > 0;
        console.log(`Step 3: Trigger criteria (Old <= 0 AND New > 0)? Result: ${isBackInStock}`);

        if (isBackInStock) {
            console.log(`Step 4: Casting Product ID for search: ${product._id}`);
            // Explicitly cast to ObjectId to avoid any comparison bugs
            const searchId = new mongoose.Types.ObjectId(product._id);

            const notifications = await StockSubscription.find({ productId: searchId });
            console.log(`Step 5: Mongoose query found ${notifications.length} subscribers.`);

            if (notifications.length > 0) {
                console.log(`Step 6: Dispatching emails to: ${notifications.map(n => n.email).join(', ')}`);

                // Send emails and wait for all results safely
                const emailResults = await Promise.allSettled(
                    notifications.map(notif =>
                        emailService.sendBackInStockEmail(notif.email, updated)
                            .then(() => ({ email: notif.email, success: true }))
                            .catch(err => {
                                console.error(`Step 7 [ERROR] Details for ${notif.email}:`, err.message);
                                return { email: notif.email, success: false, error: err.message };
                            })
                    )
                );

                const successes = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
                console.log(`Step 8: Performance report: ${successes}/${notifications.length} delivered.`);

                // Clear notifications regardless of email success
                await StockSubscription.deleteMany({ productId: searchId });
                console.log(`Step 9: Database cleaned. Logic complete.`);
            }
        } else {
            console.log(`⏭️ TRIGGER criteria NOT met (Requires transition from <=0 to >0).`);
        }
        console.log(`--- 🚀 ULTIMATE DEBUG END ---`);

        res.json(updated);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.subscribeToNotification = async (req, res) => {
    try {
        const { productId, email } = req.body;
        if (!productId || !email) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if already subscribed
        const existing = await StockSubscription.findOne({ productId, email });
        if (existing) {
            return res.status(200).json({ success: true, message: "You are already subscribed to this product." });
        }

        const notification = new StockSubscription({ productId, email });
        await notification.save();

        res.status(201).json({ success: true, message: "Notification set! We'll email you when it's back." });
    } catch (err) {
        console.error('Error subscribing to notification:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, message: "Product Deleted" });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};