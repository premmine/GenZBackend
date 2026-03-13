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

// Controller imports for explicit routing
const orderController = require("./controllers/orderController");
const authMiddleware = require("./middlewares/authMiddleware");
const ticketController = require("./controllers/ticketController");

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
// ✅ STEP 4 — FIX CORS
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
// MongoDB Global Cache for Vercel Serverless
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// ✅ STEP 5 — VERIFY DATABASE CONNECTION
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return mongoose.connection;

        console.log("⏳ Attempting to connect to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false
        });
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        if (process.env.VERCEL) {
            console.error("Critical: Database connection failed in production.");
        } else {
            console.warn("DB Connection failed, exiting local process...");
            process.exit(1);
        }
        throw err;
    }
};

// Initial connection attempt
connectDB().catch(err => console.error("Initial DB connection failed:", err.message));

// Middleware to ensure DB connection for every request (resilient for serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: "Database connection failed", error: err.message });
    }
});

/* ✅ API ROUTES */
// ✅ STEP 2 & 3 — SCAN & FIX ROUTES
app.get("/api/ping", (req, res) => res.json({ status: "online", version: "1.0.6-prod", timestamp: new Date().toISOString() }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 👑 HIGH PRIORITY EXPLICT ROUTES (Matches Frontend Expectations Exactly)
// ✅ STEP 7 — VERIFY SUPPORT TICKET API
app.get("/api/user/orders", authMiddleware, orderController.getOrders);
app.get("/api/user/tickets", authMiddleware, ticketController.getMyTickets);
app.post("/api/support/create-ticket", authMiddleware, ticketController.createTicket);

// Admin Specific Routes (Direct mount for maximum reliability)
app.get("/api/admin/tickets", authMiddleware, ticketController.getAllTickets);
app.get("/api/admin/ticket/:id", authMiddleware, ticketController.getTicketById);
app.put("/api/admin/ticket/:id/reply", authMiddleware, ticketController.replyToTicket);
app.put("/api/admin/ticket/:id/status", authMiddleware, ticketController.updateTicketStatus);

// Standard Domain Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", userRoutes); // Alias for admin panel consistency
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/tracking", shippingRoutes);

// Support Ticket System (Universal fallback mount)
app.use("/api/tickets", ticketRoutes);

app.use("/api/contact", contactRoutes);
app.use("/api/offer-videos", offerVideoRoutes);
app.use("/api/invoices", invoiceRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log(`🛑 404 DEBUG: ${req.method} ${fullUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found. [VERSION: 1.0.6-prod]`,
    });
});

/* ✅ STEP 6 — GLOBAL ERROR HANDLER */
app.use((err, req, res, next) => {
    console.error("🔥 Global Error Handler:", err.stack);
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
    if (!process.env.VERCEL) {
        const fs = require('fs');
        const path = require('path');
        ['invoices', 'labels'].forEach(dir => {
            const p = path.join(__dirname, dir);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    }
}

// Auto-recover from port conflicts (Local Only)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.VERCEL) {
        console.error(`Port ${PORT} in use. Attempting auto-recovery...`);
        try {
            const raw = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { shell: 'cmd' }).toString();
            const pids = new Set();
            raw.trim().split('\n').forEach(line => {
                const pid = line.trim().split(/\s+/).pop();
                if (pid && !isNaN(pid)) pids.add(pid);
            });
            pids.forEach(pid => execSync(`taskkill /PID ${pid} /F`, { shell: 'cmd', stdio: 'ignore' }));
            setTimeout(startServer, 1000);
        } catch (e) {
            process.exit(1);
        }
    }
});

startServer();

// Export for Vercel
module.exports = app;
