const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    scholarshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scholarship',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        fullName: { type: String, required: true },
        dateOfBirth: Date,
        address: String,
        phone: String
    },
    academicInfo: {
        institution: String,
        program: String,
        gpa: Number,
        year: String
    },
    essayText: String,
    applicationNumber: String,
    personalStatement: String,
    gpa: Number,
    familyIncome: Number,
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'verified', 'approved', 'rejected'],
        default: 'draft'
    },
    submittedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    verificationCode: String,
    qrCode: String,
    verifiedVerificationCode: String,
    verifiedQrCode: String,
    verifiedCertificateText: String,
    verifiedAt: Date,
    digitalSignature: String,
    encryptedData: String,
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

// Indexes for faster queries
applicationSchema.index({ userId: 1, scholarshipId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ verificationCode: 1 }, { sparse: true });

module.exports = mongoose.model('Application', applicationSchema);
