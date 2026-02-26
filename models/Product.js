const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String, default: "https://via.placeholder.com/150" },
    status: { type: String, default: "In Stock" },
    bestseller: { type: Boolean, default: false },
    sku: { type: String },
    description: { type: String },
    gallery: [{ type: String }],
    highlights: [{ type: String }],
    specifications: [{
        label: { type: String },
        value: { type: String }
    }],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    brand: { type: String, default: "" },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

// Add text index for advanced search
ProductSchema.index({
    name: 'text',
    category: 'text',
    brand: 'text',
    description: 'text',
    tags: 'text'
}, {
    weights: {
        name: 10,
        category: 5,
        brand: 5,
        tags: 3,
        description: 1
    },
    name: "ProductSearchIndex"
});

module.exports = mongoose.model('Product', ProductSchema);