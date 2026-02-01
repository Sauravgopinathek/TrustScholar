/**
 * ============================================================
 * USER MANAGEMENT ROUTES (Admin)
 * MongoDB Version
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Application, Document, AuditLog } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole, checkPermission } = require('../middleware/authorization');

// ============================================================
// GET ALL USERS (Admin only)
// ============================================================

router.get('/',
  verifyToken,
  requireRole('admin'),
  checkPermission('manage_users', 'read'),
  async (req, res) => {
    try {
      const { role, page = 1, limit = 10, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = {};
      if (role) {
        filter.role = role;
      }

      if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [{ email: regex }, { fullName: regex }];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          users: users.map((u) => ({
            id: u._id,
            email: u.email,
            full_name: u.fullName,
            role: u.role,
            phone: u.phone,
            is_verified: u.isVerified,
            is_active: u.isActive !== false,
            created_at: u.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }
);

// ============================================================
// DELETE CURRENT USER ACCOUNT (Self-service)
// ============================================================

router.delete('/me',
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      await Promise.all([
        Application.deleteMany({ userId }),
        Document.deleteMany({ userId })
      ]);

      await User.deleteOne({ _id: userId });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
  }
);

// ============================================================
// CREATE USER (Admin)
// ============================================================

router.post('/',
  verifyToken,
  requireRole('admin'),
  checkPermission('manage_users', 'create'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').trim().notEmpty(),
    body('role').isIn(['student', 'officer', 'admin'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, fullName, phone, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        role,
        isVerified: true,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { id: user._id, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  }
);

// ============================================================
// UPDATE USER (Admin)
// ============================================================

router.put('/:id',
  verifyToken,
  requireRole('admin'),
  checkPermission('manage_users', 'update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, phone, role, is_active } = req.body;

      const updates = {};
      if (fullName !== undefined) updates.fullName = fullName;
      if (phone !== undefined) updates.phone = phone;
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.isActive = Boolean(is_active);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      await User.updateOne({ _id: id }, updates);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }
);

// ============================================================
// GET AUDIT LOGS (Admin)
// ============================================================

router.get('/audit-logs',
  verifyToken,
  requireRole('admin'),
  checkPermission('view_audit_logs', 'read'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, user_id, action, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = {};
      if (user_id) filter.userId = user_id;
      if (action) filter.action = action;
      if (status) filter.status = status;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'email'),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs: logs.map((log) => ({
            id: log._id,
            action: log.action,
            status: log.status,
            resource: log.resource,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            timestamp: log.timestamp,
            user_email: log.userId?.email
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
  }
);

// ============================================================
// DELETE USER (Admin)
// ============================================================

router.delete('/:id',
  verifyToken,
  requireRole('admin'),
  checkPermission('manage_users', 'delete'),
  async (req, res) => {
    try {
      const { id } = req.params;

      await Promise.all([
        Application.deleteMany({ userId: id }),
        Document.deleteMany({ userId: id })
      ]);

      await User.deleteOne({ _id: id });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
);

module.exports = router;
