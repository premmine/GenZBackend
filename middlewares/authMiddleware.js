const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader) {
        token = authHeader.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;   // ✅ VERY IMPORTANT

        next();

    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};