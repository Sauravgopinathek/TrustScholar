const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: true
    },
    resource: String,
    resourceId: String,
    ipAddress: String,
    userAgent: String,
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
