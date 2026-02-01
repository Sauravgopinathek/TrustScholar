const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        sparse: true
    },
    role: {
        type: String,
        enum: ['student', 'officer', 'admin'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaSecret: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    googleId: String,
    publicKey: String,
    privateKey: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes are created automatically from schema fields with unique: true
// userSchema.index({ email: 1 }); // Removed - email already has unique: true
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
