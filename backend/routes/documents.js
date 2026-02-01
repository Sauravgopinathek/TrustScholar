/**
 * ============================================================
 * DOCUMENT ROUTES
 * Handles: File upload with encryption
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Document, Application, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorization');
const { encryptAES, decryptAES, generateRSAKeyPair, hybridEncrypt, hybridDecrypt, createDigitalSignature, verifyDigitalSignature, createHashSHA512 } = require('../utils/encryption');
const { encodeBase64, decodeBase64 } = require('../utils/encoding');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, PNG allowed.'));
        }
    }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');

const ensureUserKeys = async (user) => {
    if (user?.publicKey && user?.privateKey) {
        return user;
    }

    const { publicKey, privateKey } = generateRSAKeyPair();
    const { encryptedData: encryptedPrivateKey, iv } = encryptAES(privateKey);
    user.publicKey = publicKey;
    user.privateKey = JSON.stringify({ data: encryptedPrivateKey, iv });
    await user.save();
    return user;
};

// ============================================================
// UPLOAD DOCUMENT
// ============================================================

router.post('/upload',
    verifyToken,
    requireRole('student'),
    upload.single('document'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const { application_id, document_type } = req.body;

            // Verify application ownership
            const application = await Application.findOne({
                _id: application_id,
                userId: req.user.id
            });

            if (!application) {
                return res.status(403).json({
                    success: false,
                    message: 'Application not found or access denied'
                });
            }

            if (application.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot upload documents to submitted application'
                });
            }

            // Encrypt file content
            const fileBase64 = encodeBase64(req.file.buffer.toString('binary'));
            const user = await ensureUserKeys(await User.findById(req.user.id));
            const { encryptedData, encryptedKey, iv } = hybridEncrypt(fileBase64, user.publicKey);

            const fileHash = createHashSHA512(req.file.buffer);
            const keyData = JSON.parse(user.privateKey);
            const privateKey = decryptAES(keyData.data, keyData.iv);
            const digitalSignature = createDigitalSignature(fileHash, privateKey);

            // Generate unique filename
            const storedFilename = `${uuidv4()}${path.extname(req.file.originalname)}`;
            const filePath = path.join(uploadsDir, storedFilename);

            // Ensure directory exists
            await fs.mkdir(uploadsDir, { recursive: true });

            // Save encrypted file
            await fs.writeFile(filePath, JSON.stringify({ data: encryptedData, encryptedKey, iv }));

            // Save document record
            const doc = await Document.create({
                applicationId: application_id,
                userId: req.user.id,
                documentType: document_type,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                filePath,
                encryptedData: JSON.stringify({ data: encryptedData, encryptedKey, iv }),
                documentHash: fileHash,
                digitalSignature
            });

            res.status(201).json({
                success: true,
                message: 'Document uploaded securely',
                data: {
                    id: doc._id,
                    filename: req.file.originalname,
                    type: document_type,
                    hash: fileHash,
                    signature: digitalSignature
                }
            });

        } catch (error) {
            console.error('Upload document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload document'
            });
        }
    }
);

// ============================================================
// DELETE DOCUMENT (Student - own only)
// ============================================================

router.delete('/:id',
    verifyToken,
    requireRole('student'),
    async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);
            if (!doc || String(doc.userId) !== String(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await Document.deleteOne({ _id: req.params.id });

            res.json({
                success: true,
                message: 'Document deleted'
            });
        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete document'
            });
        }
    }
);

// ============================================================
// GET DOCUMENT (Download with decryption)
// ============================================================

router.get('/:id',
    verifyToken,
    async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);
            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Only officer/admin can decrypt
            if (!['admin', 'officer'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Read encrypted file
            const encryptedContent = JSON.parse(await fs.readFile(doc.filePath, 'utf-8'));
            const owner = await ensureUserKeys(await User.findById(doc.userId));
            const keyData = JSON.parse(owner.privateKey);
            const privateKey = decryptAES(keyData.data, keyData.iv);

            // Decrypt file
            const decryptedBase64 = hybridDecrypt(encryptedContent.data, encryptedContent.encryptedKey, encryptedContent.iv, privateKey);
            const fileBuffer = Buffer.from(decodeBase64(decryptedBase64), 'binary');

            const currentHash = createHashSHA512(fileBuffer);
            const integrityValid = currentHash === doc.documentHash
                && verifyDigitalSignature(currentHash, doc.digitalSignature, owner.publicKey);

            if (!integrityValid) {
                return res.status(500).json({
                    success: false,
                    message: 'Document integrity check failed - file may have been tampered'
                });
            }

            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${doc.fileName}"`,
                'X-Integrity-Verified': integrityValid ? 'true' : 'false'
            });

            res.send(fileBuffer);

        } catch (error) {
            console.error('Get document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve document'
            });
        }
    }
);

// ============================================================
// VERIFY DOCUMENT INTEGRITY
// ============================================================

router.get('/:id/verify',
    verifyToken,
    requireRole('officer', 'admin'),
    async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Read and decrypt file
            const encryptedContent = JSON.parse(await fs.readFile(doc.filePath, 'utf-8'));
            const owner = await ensureUserKeys(await User.findById(doc.userId));
            const keyData = JSON.parse(owner.privateKey);
            const privateKey = decryptAES(keyData.data, keyData.iv);
            const decryptedBase64 = hybridDecrypt(encryptedContent.data, encryptedContent.encryptedKey, encryptedContent.iv, privateKey);
            const fileBuffer = Buffer.from(decodeBase64(decryptedBase64), 'binary');

            const currentHash = createHashSHA512(fileBuffer);
            const signatureValid = currentHash === doc.documentHash
                && verifyDigitalSignature(currentHash, doc.digitalSignature, owner.publicKey);

            let storedEncryptedData;
            try {
                storedEncryptedData = JSON.parse(doc.encryptedData || '{}');
            } catch (e) {
                storedEncryptedData = {};
            }

            res.json({
                success: true,
                data: {
                    documentId: doc._id,
                    filename: doc.fileName,
                    uploadedAt: doc.createdAt,
                    verification: {
                        signatureValid,
                        documentHash: doc.documentHash,
                        currentHash,
                        signature: doc.digitalSignature,
                        isEncrypted: true,
                        isTampered: !signatureValid
                    },
                    decryption: {
                        algorithm: 'Hybrid RSA-2048 + AES-256',
                        iv: storedEncryptedData.iv,
                        decryptedBytes: fileBuffer.length
                    }
                }
            });

        } catch (error) {
            console.error('Verify document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify document'
            });
        }
    }
);

// ============================================================
// DELETE DOCUMENT
// ============================================================

module.exports = router;
