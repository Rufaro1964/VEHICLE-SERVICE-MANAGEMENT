const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma'); // Changed from db

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with Prisma
    const user = await prisma.users.findFirst({
      where: { email: email }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Password check (keep your existing logic)
    let isPasswordValid = false;
    
    // Demo users
    if (email === 'admin@example.com' && password === 'admin123') {
      isPasswordValid = true;
    } else if (email === 'user@example.com' && password === 'user123') {
      isPasswordValid = true;
    } else if (email === 'tech@example.com' && password === 'user123') {
      isPasswordValid = true;
    } 
    // bcrypt or plain password
    else if (user.password && user.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else if (user.password === password) {
      isPasswordValid = true;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Add name field for frontend
    const userResponse = {
      ...userWithoutPassword,
      name: user.username
    };
    
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
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const { password, ...userWithoutPassword } = user;
    const userResponse = {
      ...userWithoutPassword,
      name: user.username
    };
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Keep other functions (register, logout) similar
