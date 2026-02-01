/**
 * MongoDB Database Initialization Script
 * Creates indexes for collections
 */

const { User, Scholarship, Application, Document, AuditLog } = require('../models');

const initDatabase = async () => {
    try {
        console.log('🔄 Initializing MongoDB indexes...');

        // Create indexes for all collections
        await Promise.all([
            User.createIndexes(),
            Scholarship.createIndexes(),
            Application.createIndexes(),
            Document.createIndexes(),
            AuditLog.createIndexes()
        ]);

        console.log('✅ MongoDB indexes created successfully');
        console.log('✅ Database initialization complete');
        return true;

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};

module.exports = { initDatabase };
