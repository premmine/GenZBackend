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
const notificationRoutes = require("./routes/notificationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const shippingRoutes = require("./routes/shippingRoutes");

const app = express();
const http = require('http');
const server = http.createServer(app);
const initSocket = require('./socket/socketHandler');

// Initialize Socket.IO
initSocket(server);

// Trust proxy for accurate rate limiting behind Vercel/Nginx
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(compression()); // Compress all responses

console.log(`🚀 GENZIKART BACKEND starting in ${process.env.NODE_ENV || 'development'} mode...`);


/* ✅ SECURITY MIDDLEWARE */
app.use(helmet()); // Protects against common web vulnerabilities

// Specialized CORS to allow local development & file access
app.use(cors({
    origin: (origin, callback) => {
        // Log the origin for debugging
        if (origin) console.log('🔍 Incoming Request Origin:', origin);

        const allowedOrigins = [
            'https://gen-z-backend.vercel.app',
            'https://gen-z-backend.vercel.app',
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'null'
        ];

        // Allow if origin is null (file:///), matches allowed production domain, 
        // or is a local development address on ANY port
        const isLocal = !origin ||
            origin === 'null' ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.startsWith('chrome-extension://');

        if (isLocal || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('🛑 CORS Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 200
}));



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

/* ✅ DATABASE CONNECTION (Optimized for Vercel Serverless) */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Turn off buffering so errors fail fast instead of hanging for 10s
            serverSelectionTimeoutMS: 5000 // Fail fast if we can't connect
        };

        console.log("⏳ Attempting to connect to MongoDB...");
        cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
            .then(mongoose => {
                console.log("✅ MongoDB Connected Successfully");
                return mongoose;
            })
            .catch(err => {
                console.error("❌ MongoDB Connection Error:", err.message);
                cached.promise = null; // reset so we can try again
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// Ensure the connection is established before accepting requests
connectDB().catch(err => {
    console.error("Critical DB Error:", err.message);
    if (!process.env.VERCEL) process.exit(1);
});

// Block requests until DB is connected
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: "Database connection failed", error: err.message });
    }
});

/* ✅ API ROUTES */
/* ✅ API ROUTES */
app.get("/api/ping", (req, res) => res.json({
    status: "online",
    version: "1.0.3-diag",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
}));

// Standardize routes
app.use("/api/notifications", notificationRoutes); // Move up for priority
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/tracking", shippingRoutes); // Alias for public tracking
app.use("/api/reviews", reviewRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/offer-videos", offerVideoRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log(`🛑 404 DEBUG: ${req.method} ${fullUrl}`);
    console.log(`   Headers: ${JSON.stringify(req.headers)}`);

    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found. [VERSION: 1.0.3-diag]`,
        suggestedPath: req.originalUrl.includes('notification') ? '/api/notifications/unread-count' : null
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
const { execSync } = require('child_process');

function startServer() {
    // Only create directories and listen on a port if NOT on Vercel
    if (!process.env.VERCEL) {
        const fs = require('fs');
        const path = require('path');
        ['invoices', 'labels'].forEach(dir => {
            const p = path.join(__dirname, dir);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });

        server.listen(PORT, () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    }
}

// Auto-recover from port conflicts (EADDRINUSE)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${PORT} is in use. Auto-killing old process...\n`);
        try {
            // Get the PID using netstat, parse it in JS (avoids shell loop issues)
            const raw = execSync(
                `netstat -ano | findstr :${PORT} | findstr LISTENING`,
                { shell: 'cmd' }
            ).toString();

            const pids = new Set();
            raw.trim().split('\n').forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && !isNaN(pid)) pids.add(pid);
            });

            pids.forEach(pid => {
                try {
                    execSync(`taskkill /PID ${pid} /F`, { shell: 'cmd', stdio: 'ignore' });
                    console.log(`✅ Killed PID ${pid}`);
                } catch (_) { }
            });

            console.log(`🔄 Restarting server on port ${PORT} in 1s...`);
            setTimeout(startServer, 1000);
        } catch (e) {
            console.error(`❌ Auto-kill failed. Manually run:\n   netstat -ano | findstr :${PORT}\n   taskkill /PID <pid> /F`);
            process.exit(1);
        }
    } else {
        console.error('❌ Server error:', err.message);
        process.exit(1);
    }
});

startServer();

// Export the Express app for Vercel Serverless Functions
module.exports = app;
