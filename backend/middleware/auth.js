const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Main authentication middleware
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_jwt_secret_fallback'
        );
        
        // Optional: Check if user still exists in database
        try {
            const [users] = await db.query(
                'SELECT id, name, email, role, status FROM users WHERE id = ?',
                [decoded.id]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User no longer exists' 
                });
            }
            
            const user = users[0];
            
            // Check if user is active
            if (user.status === 'inactive' || user.status === 'suspended') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Account is inactive or suspended' 
                });
            }
            
            // Add full user info to request
            req.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            };
            
        } catch (dbError) {
            console.error('Database error in auth middleware:', dbError);
            // Continue with decoded token if DB check fails
            req.user = decoded;
        }
        
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired' 
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
};

// Specific role middlewares (for convenience)
const admin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin only.' 
        });
    }
    next();
};

const technician = (req, res, next) => {
    if (!req.user || !['admin', 'technician'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin or technician only.' 
        });
    }
    next();
};

const user = (req, res, next) => {
    if (!req.user || !['admin', 'technician', 'user'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Authenticated users only.' 
        });
    }
    next();
};
module.exports = {
    auth,           // Main authentication middleware
    authorize,      // Flexible role checker
    admin,          // Admin only
    technician,     // Admin or technician
    user            // Any authenticated user
};