/**
 * ============================================================
 * GOOGLE OAUTH ROUTES
 * Implements: Google Sign-In for authentication
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { generateRSAKeyPair, encryptAES } = require('../utils/encryption');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 */
async function verifyGoogleToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        console.error('Google token verification failed:', error);
        return null;
    }
}

/**
 * POST /api/auth/google
 * Authenticate user with Google ID token
 */
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential required'
            });
        }

        // Verify Google token
        const payload = await verifyGoogleToken(credential);
        
        if (!payload) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        const { email, name, picture, sub: googleId } = payload;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { googleId }] });
        let isNewUser = false;

        if (!user) {
            const { publicKey, privateKey } = generateRSAKeyPair();
            const { encryptedData: encryptedPrivateKey, iv } = encryptAES(privateKey);

            user = await User.create({
                email,
                password: crypto.randomBytes(24).toString('hex'),
                fullName: name,
                role: 'student',
                isVerified: true,
                googleId,
                publicKey,
                privateKey: JSON.stringify({ data: encryptedPrivateKey, iv })
            });

            isNewUser = true;
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        if (!user.publicKey || !user.privateKey) {
            const { publicKey, privateKey } = generateRSAKeyPair();
            const { encryptedData: encryptedPrivateKey, iv } = encryptAES(privateKey);
            user.publicKey = publicKey;
            user.privateKey = JSON.stringify({ data: encryptedPrivateKey, iv });
            await user.save();
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }

        // Generate JWT token
        const accessToken = jwt.sign(
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
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                accessToken,
                user: {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName || name,
                    role: user.role,
                    profilePicture: picture
                }
            }
        });

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
