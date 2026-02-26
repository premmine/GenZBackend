const Product = require('../models/Product');

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
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
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
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
};

// Delete product
exports.deleteProduct = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product Deleted" });
};