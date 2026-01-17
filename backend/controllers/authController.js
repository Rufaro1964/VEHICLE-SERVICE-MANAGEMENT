const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        // Your table has 'username' column, not 'name'
        const { username, email, password, phone, role = 'user' } = req.body;
        
        // Check if user exists
        const existing = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user - using username column
        const result = await db.query(
            'INSERT INTO users (username, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, phone || null, role]
        );
        
        // Generate token
        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email, 
                role: role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret_fallback',
            { expiresIn: '7d' }
        );
        
        // Get created user
        const [newUser] = await db.query(
            'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );
        
        // For frontend compatibility, also include 'name' field (same as username)
        const userResponse = {
            ...newUser,
            name: newUser.username  // Add name field for frontend
        };
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: userResponse
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.email);
        const { email, password } = req.body;
        
        // Find user by email
        const users = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const user = users[0];
        console.log('Found user:', user.email, 'Username:', user.username, 'Role:', user.role);
        
        // SPECIAL HANDLING FOR DEMO USERS
        let isPasswordValid = false;
        
        // Demo users with plain passwords
        if (email === 'admin@example.com' && password === 'admin123') {
            isPasswordValid = true;
        } else if (email === 'user@example.com' && password === 'user123') {
            isPasswordValid = true;
        } else if (email === 'tech@example.com' && password === 'user123') {
            isPasswordValid = true;
        } 
        // For bcrypt hashed passwords
        else if (user.password && user.password.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }
        // Plain password match
        else if (user.password === password) {
            isPasswordValid = true;
        }
        
        if (!isPasswordValid) {
            console.log('Password invalid for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        console.log('Password valid, generating token for:', email);
        
        // Generate token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret_fallback',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        // Add 'name' field for frontend compatibility (same as username)
        const userResponse = {
            ...userWithoutPassword,
            name: user.username  // Frontend expects 'name' field
        };
        
        console.log('Login successful for:', email);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const users = await db.query(
            'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        // Add 'name' field for frontend compatibility
        const userResponse = {
            ...user,
            name: user.username  // Frontend expects 'name' field
        };
        
        res.json({
            success: true,
            user: userResponse
        });
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
};

// ====== PUT THESE DEBUG LINES AT THE VERY END ======
console.log('=== authController.js LOADED ===');
console.log('module.exports.register is a function?', typeof exports.register === 'function');
console.log('module.exports.login is a function?', typeof exports.login === 'function');
console.log('module.exports.getMe is a function?', typeof exports.getMe === 'function');
console.log('module.exports.logout is a function?', typeof exports.logout === 'function');
console.log('Type of exports.register:', typeof exports.register);
console.log('Type of exports.login:', typeof exports.login);
console.log('Type of exports.getMe:', typeof exports.getMe);
console.log('Type of exports.logout:', typeof exports.logout);
// ====== END DEBUG LINES ======