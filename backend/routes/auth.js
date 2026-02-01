/**
 * ============================================================
 * AUTHENTICATION ROUTES - MongoDB Version
 * Implements: Registration, Login, MFA (Email OTP), Password Management
 * Follows: NIST SP 800-63-2 E-Authentication Architecture
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateRSAKeyPair, encryptAES } = require('../utils/encryption');
const { verifyToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const WEBSITE_NAME = process.env.WEBSITE_NAME || 'Scholarship Verification System';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

// In-memory OTP storage (for development - use Redis in production)
const otpStore = new Map();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email
 */
const sendOTPEmail = async (email, otp, purpose) => {
    const subjects = {
        login: 'Login Verification Code - Scholarship System',
        registration: 'Email Verification - Scholarship System',
        password_reset: 'Password Reset Code - Scholarship System'
    };

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@scholarship.com',
        to: email,
        subject: subjects[purpose] || 'Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #1a365d;">Scholarship Verification System</h2>
                <p>Your verification code is:</p>
                <h1 style="color: #2c5282; letter-spacing: 5px; font-size: 36px;">${otp}</h1>
                <p>This code will expire in <strong>5 minutes</strong>.</p>
                <p style="color: #718096; font-size: 12px;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
        `
    };

    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`✅ OTP sent to ${email}`);
        } else {
            // Development mode - log OTP
            console.log(`\n📧 [DEV MODE] OTP for ${email}: ${otp}\n`);
        }
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        // For development, log the OTP
        console.log(`\n📧 [FALLBACK] OTP for ${email}: ${otp}\n`);
        return true; // Return true in dev mode
    }
};

const sendWelcomeEmail = async (email, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@scholarship.com',
        to: email,
        subject: `Welcome to ${WEBSITE_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #1a365d;">Welcome to ${WEBSITE_NAME}</h2>
                <p>Hello ${fullName || 'User'},</p>
                <p>Your registration is successful. You can now use all features of the platform.</p>
                <p style="color: #718096; font-size: 12px;">If you did not create this account, please contact support.</p>
            </div>
        `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
    } else {
        console.log(`\n📧 [DEV MODE] Welcome email to ${email}\n`);
    }
};

const sendAdminRegistrationEmail = async (adminEmail, userEmail, role) => {
    if (!adminEmail) return;
    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@scholarship.com',
        to: adminEmail,
        subject: `New user registered - ${WEBSITE_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #1a365d;">New Registration</h2>
                <p>A new user has registered successfully.</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Role:</strong> ${role}</p>
            </div>
        `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
    } else {
        console.log(`\n📧 [DEV MODE] Admin registration notice to ${adminEmail} for ${userEmail}\n`);
    }
};

/**
 * Store OTP with expiration
 */
const storeOTP = (email, otp, purpose) => {
    const hashedOTP = crypto.createHash('sha512').update(otp).digest('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    otpStore.set(email, {
        otp: hashedOTP,
        purpose,
        expiresAt,
        attempts: 0
    });
    
    // Auto-cleanup after expiration
    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);
};

/**
 * Verify OTP
 */
const verifyOTP = (email, otp) => {
    const stored = otpStore.get(email);
    
    if (!stored) {
        return { valid: false, message: 'OTP expired or not found' };
    }
    
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return { valid: false, message: 'OTP expired' };
    }
    
    if (stored.attempts >= 3) {
        otpStore.delete(email);
        return { valid: false, message: 'Too many attempts' };
    }
    
    const hashedInput = crypto.createHash('sha512').update(otp).digest('hex');
    
    if (hashedInput !== stored.otp) {
        stored.attempts++;
        return { valid: false, message: 'Invalid OTP' };
    }
    
    otpStore.delete(email);
    return { valid: true };
};

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /api/auth/register
 * Register new user with email and password
 */
router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('role').optional().isIn(['student', 'officer', 'admin'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password, phone, fullName, role } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate OTP
            const otp = generateOTP();
            storeOTP(email, otp, 'registration');

            // Send OTP
            await sendOTPEmail(email, otp, 'registration');

            // Generate RSA keys for user
            const { publicKey, privateKey } = generateRSAKeyPair();
            const { encryptedData: encryptedPrivateKey, iv } = encryptAES(privateKey);

            // Create user (not verified yet)
            const user = await User.create({
                email,
                password: hashedPassword,
                phone,
                fullName,
                isVerified: false,
                role: role || 'student',
                publicKey,
                privateKey: JSON.stringify({ data: encryptedPrivateKey, iv })
            });

            await Promise.all([
                sendWelcomeEmail(email, fullName),
                sendAdminRegistrationEmail(ADMIN_EMAIL, email, user.role)
            ]);

            res.json({
                success: true,
                message: 'Registration successful. Please check your email for OTP.',
                userId: user._id
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and activate account
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const verification = verifyOTP(email, otp);
        
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        // Update user verification status
        await User.updateOne(
            { email },
            { isVerified: true }
        );

        const user = await User.findOne({ email });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

/**
 * POST /api/auth/login
 * Login with email and password, send OTP
 */
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').exists(),
        body('role').optional().isIn(['student', 'officer', 'admin'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password, role } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is inactive. Please contact admin.'
                });
            }

            if (role && role !== user.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Role mismatch. Please select the correct role.'
                });
            }

            // Check if verified
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email first',
                    requiresVerification: true
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate and send OTP
            const otp = generateOTP();
            storeOTP(email, otp, 'login');
            await sendOTPEmail(email, otp, 'login');

            res.json({
                success: true,
                message: 'OTP sent to your email',
                data: {
                    requiresMFA: true,
                    tempToken: email
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }
);

/**
 * POST /api/auth/resend-otp
 * Resend OTP to email
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const otp = generateOTP();
        const purpose = user.isVerified ? 'login' : 'registration';
        storeOTP(email, otp, purpose);
        await sendOTPEmail(email, otp, purpose);

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                role: user.role === 'verifier' ? 'officer' : user.role,
                isVerified: user.isVerified,
                mfaEnabled: user.mfaEnabled,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info'
        });
    }
});

/**
 * POST /api/auth/verify-email
 * Alias for verify-otp (for frontend compatibility)
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const verification = verifyOTP(email, otp);
        
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        // Update user verification status
        await User.updateOne(
            { email },
            { isVerified: true }
        );

        const user = await User.findOne({ email });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                accessToken: token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                }
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

/**
 * POST /api/auth/verify-mfa
 * Verify MFA OTP for login (for frontend compatibility)
 */
router.post('/verify-mfa', async (req, res) => {
    try {
        const { tempToken, otp } = req.body;

        // For this implementation, we'll use email from tempToken
        // In production, decode and verify tempToken properly
        const email = tempToken; // Simplified for demo

        const verification = verifyOTP(email, otp);
        
        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.message
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken: token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                }
            }
        });

    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // In a production app, you'd invalidate the token here
        // For now, client-side removal is sufficient
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset OTP to email
 */
router.post('/forgot-password',
    body('email').isEmail().normalizeEmail(),
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a reset code has been sent.'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiry (5 minutes)
        otpStore.set(`reset_${email}`, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        // Send reset email
        await sendOTPEmail(email, otp, 'password_reset');

        res.json({
            success: true,
            message: 'If an account with that email exists, a reset code has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with OTP
 */
router.post('/reset-password',
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, otp, newPassword } = req.body;

        // Verify OTP
        const storedData = otpStore.get(`reset_${email}`);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No reset request found. Please request a new code.'
            });
        }

        if (storedData.attempts >= 3) {
            otpStore.delete(`reset_${email}`);
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request a new code.'
            });
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(`reset_${email}`);
            return res.status(400).json({
                success: false,
                message: 'Code has expired. Please request a new code.'
            });
        }

        if (storedData.otp !== otp) {
            storedData.attempts += 1;
            return res.status(400).json({
                success: false,
                message: 'Invalid code. Please try again.'
            });
        }

        // Find user and update password
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        // Clear OTP
        otpStore.delete(`reset_${email}`);

        res.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});

module.exports = router;
