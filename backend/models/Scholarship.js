const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    eligibility: {
        type: String,
        required: true
    },
    requirements: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'closed'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

// Index for faster queries
scholarshipSchema.index({ status: 1, deadline: -1 });
scholarshipSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
