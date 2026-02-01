/**
 * ============================================================
 * ENCODING UTILITIES
 * Implements: Base64 Encoding/Decoding, QR Code Generation
 * ============================================================
 */

const QRCode = require('qrcode');
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
// QR CODE GENERATION
// ============================================================

/**
 * Generate QR code as data URL (for embedding in HTML)
 * @param {string} data - Data to encode in QR
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Data URL string
 */
const generateQRCodeDataURL = async (data, options = {}) => {
    try {
        const defaultOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            ...options
        };

        return await QRCode.toDataURL(data, defaultOptions);
    } catch (error) {
        throw new Error('QR code generation failed: ' + error.message);
    }
};

/**
 * Generate QR code as Buffer (for saving to file)
 * @param {string} data - Data to encode in QR
 * @param {object} options - QR code options
 * @returns {Promise<Buffer>} - Image buffer
 */
const generateQRCodeBuffer = async (data, options = {}) => {
    try {
        const defaultOptions = {
            errorCorrectionLevel: 'M',
            type: 'png',
            width: 256,
            margin: 2,
            ...options
        };

        return await QRCode.toBuffer(data, defaultOptions);
    } catch (error) {
        throw new Error('QR code generation failed: ' + error.message);
    }
};

/**
 * Generate verification QR code for application
 * Contains: Application ID, timestamp, verification hash
 * @param {object} applicationData - Application details
 * @returns {Promise<object>} - { qrCode, verificationCode }
 */
const generateVerificationQR = async (applicationData) => {
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
        const verificationCode = `SVS-${applicationData.application_number}-${verificationHash}`;

        // Create QR code data (Base64-encoded payload)
        const qrPayload = {
            type: 'scholarship_verification',
            code: verificationCode,
            verify_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationCode}`
        };
        const qrData = encodeBase64(JSON.stringify(qrPayload));

        // Generate QR code
        const qrCode = await generateQRCodeDataURL(qrData, {
            width: 300,
            color: {
                dark: '#1a365d',
                light: '#ffffff'
            }
        });

        return {
            qrCode,
            verificationCode
        };
    } catch (error) {
        throw new Error('Verification QR generation failed: ' + error.message);
    }
};

/**
 * Generate verified certificate QR code for application
 * @param {object} applicationData - Application details
 * @returns {Promise<object>} - { qrCode, verificationCode }
 */
const generateVerifiedQR = async (applicationData) => {
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

        const verificationCode = `SVS-VERIFIED-${applicationData.application_number}-${verificationHash}`;
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationCode}`;

        const qrPayload = {
            type: 'scholarship_verification_verified',
            code: verificationCode,
            verify_url: verifyUrl,
            application_number: applicationData.application_number,
            student_id: applicationData.student_id,
            verified_at: new Date(timestamp).toISOString()
        };

        const certificateText = [
            'Scholarship Verification Certificate',
            `Application: ${applicationData.application_number}`,
            `Student ID: ${applicationData.student_id}`,
            `Verified At: ${new Date(timestamp).toISOString()}`,
            `Verification Code: ${verificationCode}`,
            `Verify URL: ${verifyUrl}`
        ].join('\n');

        const qrCode = await generateQRCodeDataURL(encodeBase64(JSON.stringify(qrPayload)), {
            width: 300,
            color: {
                dark: '#1a365d',
                light: '#ffffff'
            }
        });

        return { qrCode, verificationCode, certificateText };
    } catch (error) {
        throw new Error('Verified QR generation failed: ' + error.message);
    }
};

/**
 * Decode and validate verification code
 * @param {string} verificationCode - Code from QR or manual entry
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
    // QR Code
    generateQRCodeDataURL,
    generateQRCodeBuffer,
    generateVerificationQR,
    generateVerifiedQR,
    parseVerificationCode
};
