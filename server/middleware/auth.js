const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    // Look for the token in the headers (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Not logged in. Please sign in." });
    }

    try {
        // Verify the token using your secret key from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        // This attaches the user's unique ID to the request object (req.user)
        req.user = decoded; 
        next(); // Move to the next function (the actual API logic)
    } catch (error) {
        res.status(401).json({ error: "Session expired. Please login again." });
    }
};

module.exports = { protect };