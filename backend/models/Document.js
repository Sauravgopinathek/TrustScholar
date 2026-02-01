const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        required: true,
        enum: ['transcript', 'id_proof', 'income_certificate', 'recommendation_letter', 'recommendation', 'other']
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: Number,
    filePath: {
        type: String,
        required: true
    },
    encryptedData: String,
    digitalSignature: String,
    documentHash: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
documentSchema.index({ applicationId: 1 });
documentSchema.index({ userId: 1 });

module.exports = mongoose.model('Document', documentSchema);
