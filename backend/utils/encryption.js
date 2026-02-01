/**
 * ============================================================
 * ENCRYPTION UTILITIES
 * Implements: AES-256 Encryption, RSA Key Exchange,
 * Hybrid Encryption, Digital Signatures (SHA-512)
 * ============================================================
 */

const CryptoJS = require('crypto-js');
const crypto = require('crypto');
require('dotenv').config();

const AES_SECRET = process.env.AES_SECRET_KEY || 'default_32_char_secret_key_here!';

// ============================================================
// AES-256 ENCRYPTION/DECRYPTION (Symmetric)
// ============================================================

/**
 * Encrypt data using AES-256
 * @param {string} plainText - Data to encrypt
 * @param {string} secretKey - Optional custom key
 * @returns {object} - { encryptedData, iv }
 */
const encryptAES = (plainText, secretKey = AES_SECRET) => {
    try {
        // Generate random IV for each encryption
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // Encrypt using AES-256-CBC
        const encrypted = CryptoJS.AES.encrypt(plainText, secretKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            encryptedData: encrypted.toString(),
            iv: iv.toString(CryptoJS.enc.Hex)
        };
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
};

/**
 * Decrypt AES-256 encrypted data
 * @param {string} encryptedData - Encrypted string
 * @param {string} iv - Initialization vector
 * @param {string} secretKey - Optional custom key
 * @returns {string} - Decrypted plain text
 */
const decryptAES = (encryptedData, iv, secretKey = AES_SECRET) => {
    try {
        const ivWordArray = CryptoJS.enc.Hex.parse(iv);
        
        const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey, {
            iv: ivWordArray,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        throw new Error('Decryption failed: ' + error.message);
    }
};

// ============================================================
// RSA KEY EXCHANGE (Asymmetric)
// ============================================================

/**
 * Generate RSA key pair
 * @returns {object} - { publicKey, privateKey }
 */
const generateRSAKeyPair = () => {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
        });

        return { publicKey, privateKey };
    } catch (error) {
        throw new Error('RSA key generation failed: ' + error.message);
    }
};

/**
 * Encrypt data with RSA public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key
 * @returns {string} - Encrypted data (base64)
 */
const encryptRSA = (data, publicKey) => {
    try {
        const buffer = Buffer.from(data, 'utf8');
        return crypto.publicEncrypt(publicKey, buffer).toString('base64');
    } catch (error) {
        throw new Error('RSA encryption failed: ' + error.message);
    }
};

/**
 * Decrypt data with RSA private key
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {string} privateKey - RSA private key
 * @returns {string} - Decrypted data
 */
const decryptRSA = (encryptedData, privateKey) => {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        return crypto.privateDecrypt(privateKey, buffer).toString('utf8');
    } catch (error) {
        throw new Error('RSA decryption failed: ' + error.message);
    }
};

// ============================================================
// HYBRID ENCRYPTION (RSA + AES)
// ============================================================

const hybridEncrypt = (data, publicKey) => {
    try {
        const aesKey = CryptoJS.lib.WordArray.random(32).toString();
        const { encryptedData, iv } = encryptAES(data, aesKey);
        const encryptedKey = encryptRSA(aesKey, publicKey);

        return { encryptedData, encryptedKey, iv };
    } catch (error) {
        throw new Error('Hybrid encryption failed: ' + error.message);
    }
};

const hybridDecrypt = (encryptedData, encryptedKey, iv, privateKey) => {
    try {
        const aesKey = decryptRSA(encryptedKey, privateKey);
        return decryptAES(encryptedData, iv, aesKey);
    } catch (error) {
        throw new Error('Hybrid decryption failed: ' + error.message);
    }
};

// ============================================================
// DIGITAL SIGNATURES (RSA + SHA-512)
// ============================================================

const createDigitalSignature = (data, privateKey) => {
    try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
        return crypto.sign('RSA-SHA512', buffer, privateKey).toString('base64');
    } catch (error) {
        throw new Error('Digital signature creation failed: ' + error.message);
    }
};

const verifyDigitalSignature = (data, signature, publicKey) => {
    try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
        const sigBuffer = Buffer.from(signature, 'base64');
        return crypto.verify('RSA-SHA512', buffer, publicKey, sigBuffer);
    } catch (error) {
        console.error('Signature verification error:', error.message);
        return false;
    }
};

// ============================================================
// HASHING (SHA-512)
// ============================================================

const createHashSHA512 = (data) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    return crypto.createHash('sha512').update(buffer).digest('hex');
};

module.exports = {
    // AES
    encryptAES,
    decryptAES,
    // RSA
    generateRSAKeyPair,
    // Hybrid
    hybridEncrypt,
    hybridDecrypt,
    // Digital Signatures
    createDigitalSignature,
    verifyDigitalSignature,
    // Hashing
    createHashSHA512
};
