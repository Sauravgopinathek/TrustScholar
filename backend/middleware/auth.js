/**
 * ============================================================
 * AUTHENTICATION MIDDLEWARE - MongoDB Version
 * Implements: JWT Verification, Session Validation
 * Follows: NIST SP 800-63-2 E-Authentication Guidelines
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

/**
 * Verify JWT Token Middleware
 * Extracts and validates the JWT from Authorization header
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email not verified. Please verify your email.'
            });
        }

        // Attach user to request
        const normalizedRole = user.role === 'verifier' ? 'officer' : user.role;

        req.user = {
            userId: user._id,
            id: user._id,
            email: user.email,
            role: normalizedRole,
            isVerified: user.isVerified
        };
        req.token = token;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Check if MFA is verified for current session
 * (MongoDB version uses OTP at login, so this is a no-op for now)
 */
const verifyMFA = async (req, res, next) => {
    return next();
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select('-password');

        if (user) {
            const normalizedRole = user.role === 'verifier' ? 'officer' : user.role;
            req.user = {
                id: user._id,
                email: user.email,
                role: normalizedRole
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    verifyToken,
    verifyMFA,
    optionalAuth
};
