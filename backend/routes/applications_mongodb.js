/**
 * ============================================================
 * APPLICATION ROUTES - MongoDB
 * Handles: Application submission and management
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorization');
const { Application, Scholarship, Document, User } = require('../models');
const { encryptAES, decryptAES, generateRSAKeyPair, hybridEncrypt, hybridDecrypt } = require('../utils/encryption');
const { generateVerifiedCertificateData } = require('../utils/encoding');

const generateApplicationNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP${year}-${random}`;
};

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
// GET ALL APPLICATIONS (Officer/Admin)
// ============================================================
router.get('/',
  verifyToken,
  requireRole('officer', 'admin'),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = { status: { $ne: 'draft' } };
      if (status) {
        filter.status = status;
      }

      const [apps, total] = await Promise.all([
        Application.find(filter)
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('scholarshipId')
          .populate('userId'),
        Application.countDocuments(filter)
      ]);

      const data = apps.map((app) => ({
        id: app._id,
        application_number: app.applicationNumber,
        status: app.status,
        submitted_at: app.submittedAt,
        scholarship_name: app.scholarshipId?.title,
        scholarship_amount: app.scholarshipId?.amount,
        student_name: app.userId?.fullName,
        student_email: app.userId?.email
      }));

      res.json({
        success: true,
        data: {
          applications: data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch applications' });
    }
  }
);

// ============================================================
// GET MY APPLICATIONS (Student)
// ============================================================
router.get('/my-applications',
  verifyToken,
  requireRole('student'),
  async (req, res) => {
    try {
      const apps = await Application.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .populate('scholarshipId');

      const data = apps.map((app) => ({
        id: app._id,
        application_number: app.applicationNumber,
        status: app.status,
        created_at: app.createdAt,
        submitted_at: app.submittedAt,
        scholarship_name: app.scholarshipId?.title,
        scholarship_amount: app.scholarshipId?.amount
      }));

      res.json({ success: true, data });
    } catch (error) {
      console.error('Get my applications error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch applications' });
    }
  }
);

// ============================================================
// GET APPLICATION BY ID
// ============================================================
router.get('/:id',
  verifyToken,
  async (req, res) => {
    try {
      const app = await Application.findById(req.params.id)
        .populate('scholarshipId')
        .populate('userId');

      if (!app) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      if (req.user.role === 'student' && String(app.userId?._id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      let decryptedData;
      const canViewDecrypted = req.user.role === 'admin'
        || req.user.role === 'officer'
        || String(app.userId?._id) === String(req.user.id);

      if (canViewDecrypted && app.encryptedData && app.userId) {
        try {
          const enc = JSON.parse(app.encryptedData);
          const appUser = await ensureUserKeys(app.userId);
          const keyData = JSON.parse(appUser.privateKey);
          const privateKey = decryptAES(keyData.data, keyData.iv);
          decryptedData = JSON.parse(hybridDecrypt(enc.data, enc.encryptedKey, enc.iv, privateKey));
        } catch (e) {
          console.error('Decryption error:', e);
        }
      }

      const documents = await Document.find({ applicationId: app._id })
        .select('documentType fileName createdAt');

      res.json({
        success: true,
        data: {
          id: app._id,
          scholarship_id: app.scholarshipId?._id,
          application_number: app.applicationNumber,
          status: app.status,
          created_at: app.createdAt,
          submitted_at: app.submittedAt,
          scholarship_name: app.scholarshipId?.title,
          scholarship_description: app.scholarshipId?.description,
          scholarship_amount: app.scholarshipId?.amount,
          student_name: app.userId?.fullName,
          student_email: app.userId?.email,
          decrypted_data: decryptedData,
          review_comments: app.reviewNotes,
          verified_verification_code: app.verifiedVerificationCode,
          documents: documents.map((d) => ({
            id: d._id,
            document_type: d.documentType,
            original_filename: d.fileName,
            uploaded_at: d.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch application' });
    }
  }
);

// ============================================================
// CREATE APPLICATION (Student)
// ============================================================
router.post('/',
  verifyToken,
  requireRole('student'),
  [
    body('scholarship_id').notEmpty(),
    body('personal_statement').optional().trim(),
    body('gpa').optional().isFloat({ min: 0, max: 10 }),
    body('family_income').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { scholarship_id, personal_statement, gpa, family_income, sensitive_data } = req.body;

      const scholarship = await Scholarship.findById(scholarship_id);
      if (!scholarship || scholarship.status !== 'active') {
        return res.status(404).json({ success: false, message: 'Scholarship not found or inactive' });
      }

      const existing = await Application.findOne({ userId: req.user.id, scholarshipId: scholarship_id });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already applied for this scholarship' });
      }

      const applicationNumber = generateApplicationNumber();

      let encryptedData = null;
      const user = await ensureUserKeys(await User.findById(req.user.id));
      if (sensitive_data) {
        const { encryptedData: encrypted, encryptedKey, iv } = hybridEncrypt(JSON.stringify(sensitive_data), user.publicKey);
        encryptedData = JSON.stringify({ data: encrypted, encryptedKey, iv });
      }

      const app = await Application.create({
        applicationNumber,
        userId: req.user.id,
        scholarshipId: scholarship_id,
        personalInfo: {
          fullName: user?.fullName || user?.email || 'Student',
          address: sensitive_data?.address,
          phone: user?.phone
        },
        academicInfo: {
          gpa
        },
        personalStatement: personal_statement,
        gpa,
        familyIncome: family_income,
        encryptedData,
        status: 'draft'
      });

      res.status(201).json({
        success: true,
        message: 'Application created as draft',
        data: { id: app._id, applicationNumber }
      });
    } catch (error) {
      console.error('Create application error:', error);
      res.status(500).json({ success: false, message: 'Failed to create application' });
    }
  }
);

// ============================================================
// UPDATE APPLICATION (Student - draft only)
// ============================================================
router.put('/:id',
  verifyToken,
  requireRole('student'),
  async (req, res) => {
    try {
      const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      if (application.status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft applications can be edited' });
      }

      const { personal_statement, gpa, family_income, sensitive_data } = req.body;

      let encryptedData = application.encryptedData;
      if (sensitive_data) {
        const user = await ensureUserKeys(await User.findById(req.user.id));
        const { encryptedData: encrypted, encryptedKey, iv } = hybridEncrypt(JSON.stringify(sensitive_data), user.publicKey);
        encryptedData = JSON.stringify({ data: encrypted, encryptedKey, iv });
      }

      application.personalStatement = personal_statement ?? application.personalStatement;
      application.gpa = gpa ?? application.gpa;
      application.familyIncome = family_income ?? application.familyIncome;
      application.encryptedData = encryptedData;
      await application.save();

      res.json({
        success: true,
        message: 'Application updated',
        data: { id: application._id, applicationNumber: application.applicationNumber }
      });
    } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({ success: false, message: 'Failed to update application' });
    }
  }
);

// ============================================================
// SUBMIT APPLICATION (Student)
// ============================================================
router.post('/:id/submit',
  verifyToken,
  requireRole('student'),
  async (req, res) => {
    try {
      const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      application.status = 'submitted';
      application.submittedAt = new Date();
      application.reviewNotes = undefined;
      await application.save();

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: { applicationNumber: application.applicationNumber }
      });
    } catch (error) {
      console.error('Submit application error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit application' });
    }
  }
);

// ============================================================
// UPDATE APPLICATION STATUS (Officer/Admin)
// ============================================================
router.put('/:id/status',
  verifyToken,
  requireRole('officer', 'admin'),
  async (req, res) => {
    try {
      const { status, comments } = req.body;
      const allowed = ['under_review', 'verified', 'approved', 'rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const application = await Application.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      if (status === 'verified' || (status === 'approved' && !application.verifiedVerificationCode)) {
        const { verificationCode, certificateText } = await generateVerifiedCertificateData({
          id: application._id,
          applicationNumber: application.applicationNumber,
          student_id: application.userId
        });

        application.verifiedVerificationCode = verificationCode;
        application.verifiedCertificateText = certificateText;
        application.verifiedAt = new Date();
      }

      application.status = status;
      application.reviewedBy = req.user.id;
      application.reviewedAt = new Date();
      if (comments) application.reviewNotes = comments;
      await application.save();

      res.json({
        success: true,
        message: 'Status updated'
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status' });
    }
  }
);

// ============================================================
// VERIFY APPLICATION BY CODE
// ============================================================
router.get('/verify/:code', async (req, res) => {
  try {
    const application = await Application.findOne({
      $or: [
        { verificationCode: req.params.code },
        { verifiedVerificationCode: req.params.code }
      ]
    })
      .populate('scholarshipId')
      .populate('userId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Invalid verification code' });
    }

    res.json({
      success: true,
      data: {
        applicationNumber: application.applicationNumber,
        status: application.status,
        scholarshipName: application.scholarshipId?.title,
        studentName: application.userId?.fullName,
        submittedAt: application.submittedAt,
        verificationCode: application.verificationCode,
        certificateAvailable: application.status === 'verified' && application.verifiedVerificationCode === req.params.code,
        certificateDownloadUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/applications/verify/${req.params.code}/document`
      }
    });
  } catch (error) {
    console.error('Verify application error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ============================================================
// DOWNLOAD VERIFIED CERTIFICATE DOCUMENT
// ============================================================
router.get('/verify/:code/document', async (req, res) => {
  try {
    const application = await Application.findOne({ verifiedVerificationCode: req.params.code })
      .populate('scholarshipId')
      .populate('userId');

    if (!application || application.status !== 'verified') {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const content = [
      'Scholarship Verification Certificate',
      `Application: ${application.applicationNumber}`,
      `Student: ${application.userId?.fullName || application.userId?.email}`,
      `Scholarship: ${application.scholarshipId?.title}`,
      `Status: ${application.status}`,
      `Verified At: ${application.verifiedAt?.toISOString() || new Date().toISOString()}`
    ].join('\n');

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="verified-certificate-${application.applicationNumber}.txt"`
    });

    res.send(content);
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ success: false, message: 'Failed to download certificate' });
  }
});

module.exports = router;
