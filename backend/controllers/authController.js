// controllers/authController.js - UPDATED VERSION
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');  // CHANGED FROM: const db = require('../config/db')

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        // Your table has 'username' column, not 'name'
        const { username, email, password, phone, role = 'user' } = req.body;
        
        // CHANGED: Check if user exists
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // CHANGED: Create user
        const newUser = await prisma.users.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                phone: phone || null,
                role: role,  // Use lowercase if that's what your database has
                language: 'en'  // Add default language
            }
        });
        
        // Generate token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email, 
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret_fallback',
            { expiresIn: '7d' }
        );
        
        // CHANGED: Get created user (already have it)
        const userResponse = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            created_at: newUser.created_at,  // Note: might be createdAt or created_at
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
        
        // CHANGED: Find user by email
        const user = await prisma.users.findFirst({
            where: { email: email }
        });
        
        if (!user) {
            console.log('No user found with email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
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
        
        // CHANGED: Get user with Prisma
        const user = await prisma.users.findUnique({
            where: { id: req.user.id }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Remove password
        const { password, ...userWithoutPassword } = user;
        
        // Add 'name' field for frontend compatibility
        const userResponse = {
            ...userWithoutPassword,
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
console.log('=== authController.js LOADED with Prisma ===');
console.log('Using Prisma:', typeof prisma !== 'undefined');
// ====== END DEBUG LINES ======