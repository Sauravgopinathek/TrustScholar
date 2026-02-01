/**
 * ============================================================
 * SCHOLARSHIP VERIFICATION SYSTEM - MAIN SERVER
 * ============================================================
 * 
 * Security Features Implemented:
 * 1. Authentication (Single-Factor + MFA)
 * 2. Authorization (Role-Based Access Control)
 * 3. Encryption (AES-256 + RSA Hybrid)
 * 4. Hashing (bcrypt + SHA-512)
 * 5. Digital Signatures
 * 6. QR Code Verification
 * 7. Base64 Encoding/Decoding
 * 
 * Follows: NIST SP 800-63-2 E-Authentication Guidelines
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, connectDB } = require('./config/database');
const { initDatabase } = require('./config/initDatabase');
const { auditLog } = require('./middleware/authorization');

// Import routes
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const scholarshipRoutes = require('./routes/scholarships');
const applicationRoutes = require('./routes/applications_mongodb');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (NIST recommendation for brute force protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditLog);

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // Google OAuth
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Scholarship Verification System API is running',
        timestamp: new Date().toISOString(),
        security: {
            authentication: 'Password + MFA (Email OTP)',
            authorization: 'Role-Based Access Control (RBAC)',
            encryption: 'AES-256 + RSA-2048 Hybrid',
            hashing: 'bcrypt + SHA-512',
            digitalSignatures: 'RSA-SHA512',
            encoding: 'Base64 + QR Code'
        }
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message
    });
});

// ============================================================
// SERVER STARTUP
// ============================================================

const startServer = async () => {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        
        // Test connection
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }

        // Initialize database (create indexes and admin user)
        await initDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║          TRUSTSCHOLAR - BACKEND SERVER                       ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server: http://localhost:${PORT}                            ║
║  📊 API: http://localhost:${PORT}/api                           ║
╠══════════════════════════════════════════════════════════════╣
║  SECURITY FEATURES:                                          ║
║  ✅ Authentication: Password + Email OTP (MFA)               ║
║  ✅ Authorization: Role-Based Access Control (ACL)           ║
║  ✅ Encryption: AES-256 + RSA-2048 (Hybrid)                  ║
║  ✅ Hashing: bcrypt (salt) + SHA-512                         ║
║  ✅ Digital Signatures: RSA-SHA512                           ║
║  ✅ Encoding: Base64 + QR Codes                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
