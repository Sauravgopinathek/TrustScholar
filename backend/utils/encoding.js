const crypto = require('crypto');

// ============================================================
// BASE64 ENCODING/DECODING
// ============================================================

/**
 * Encode string to Base64
 * @param {string} data - Data to encode
 * @returns {string} - Base64 encoded string
 */
const encodeBase64 = (data) => {
    try {
        return Buffer.from(data, 'utf-8').toString('base64');
    } catch (error) {
        throw new Error('Base64 encoding failed: ' + error.message);
    }
};

/**
 * Decode Base64 string
 * @param {string} encodedData - Base64 encoded string
 * @returns {string} - Decoded string
 */
const decodeBase64 = (encodedData) => {
    try {
        return Buffer.from(encodedData, 'base64').toString('utf-8');
    } catch (error) {
        throw new Error('Base64 decoding failed: ' + error.message);
    }
};

// ============================================================
// VERIFICATION CODE GENERATION
// ============================================================

/**
 * Generate verification code string for application
 * Contains: Application ID, timestamp, verification hash
 * @param {object} applicationData - Application details
 * @returns {string} - Verification code
 */
const generateVerificationCodeString = (applicationData) => {
    try {
        // Create verification payload
        const timestamp = Date.now();
        const payload = {
            applicationId: applicationData.id,
            applicationNumber: applicationData.application_number,
            studentId: applicationData.student_id,
            timestamp: timestamp
        };

        // Create verification hash
        const verificationData = JSON.stringify(payload);
        const verificationHash = crypto
            .createHash('sha512')
            .update(verificationData)
            .digest('hex')
            .substring(0, 16);

        // Create verification code
        return `SVS-${applicationData.applicationNumber}-${verificationHash}`;
    } catch (error) {
        throw new Error('Verification code generation failed: ' + error.message);
    }
};

/**
 * Generate verified certificate data for application
 * @param {object} applicationData - Application details
 * @returns {Promise<object>} - { verificationCode, certificateText }
 */
const generateVerifiedCertificateData = async (applicationData) => {
    try {
        const timestamp = Date.now();
        const payload = {
            applicationId: applicationData.id,
            applicationNumber: applicationData.application_number,
            studentId: applicationData.student_id,
            timestamp
        };

        const verificationData = JSON.stringify(payload);
        const verificationHash = crypto
            .createHash('sha512')
            .update(verificationData)
            .digest('hex')
            .substring(0, 16);

        const verificationCode = `SVS-VERIFIED-${applicationData.applicationNumber}-${verificationHash}`;

        // Use environment variable for frontend URL or default
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/verify/${verificationCode}`;

        const certificateText = [
            'Scholarship Verification Certificate',
            `Application: ${applicationData.applicationNumber}`,
            `Student ID: ${applicationData.student_id}`,
            `Verified At: ${new Date(timestamp).toISOString()}`,
            `Verification Code: ${verificationCode}`,
            `Verify URL: ${verifyUrl}`
        ].join('\n');

        return { verificationCode, certificateText };
    } catch (error) {
        throw new Error('Verified certificate generation failed: ' + error.message);
    }
};

/**
 * Decode and validate verification code
 * @param {string} verificationCode - Code from manual entry
 * @returns {object} - Parsed verification data
 */
const parseVerificationCode = (verificationCode) => {
    try {
        // Format: SVS-APP2025-XXXX-HASH
        const parts = verificationCode.split('-');

        if (parts[0] !== 'SVS' || parts.length < 3) {
            throw new Error('Invalid verification code format');
        }

        return {
            prefix: parts[0],
            applicationNumber: parts.slice(1, -1).join('-'),
            hash: parts[parts.length - 1],
            isValid: true
        };
    } catch (error) {
        return {
            isValid: false,
            error: error.message
        };
    }
};

module.exports = {
    // Base64
    encodeBase64,
    decodeBase64,
    // Verification
    generateVerificationCodeString,
    generateVerifiedCertificateData,
    parseVerificationCode
};
