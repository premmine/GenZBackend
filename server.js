const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
require("dotenv").config();

// Route Imports
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const discountRoutes = require("./routes/discountRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const contactRoutes = require("./routes/contactRoutes");
const offerVideoRoutes = require("./routes/offerVideoRoutes");

const app = express();

// Trust proxy for accurate rate limiting behind Vercel/Nginx
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(compression()); // Compress all responses

console.log(`🚀 GENZIKART BACKEND starting in ${process.env.NODE_ENV || 'development'} mode...`);


/* ✅ SECURITY MIDDLEWARE */
app.use(helmet()); // Protects against common web vulnerabilities
app.use(cors());   // Allows your frontend to communicate with the backend

// Rate limiting to prevent Brute Force/DDoS on your API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes"
    }
});
app.use("/api", limiter);

/* ✅ BODY PARSING */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ✅ DATABASE CONNECTION */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1); // Stop server if DB connection fails
    });

/* ✅ API ROUTES */
app.get("/api/ping", (req, res) => res.json({ message: "pong", version: "1.0.1" }));

// Standardize routes without doubling /api if router also has it (though they are relative)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/offer-videos", offerVideoRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
    console.log(`🛑 404 NOT FOUND: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found on this server`
    });
});

/* ✅ GLOBAL ERROR HANDLER */
// This catches any errors thrown in your routes so the server doesn't crash
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

/* ✅ SERVER START */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});