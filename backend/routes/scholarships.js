/**
 * ============================================================
 * SCHOLARSHIP ROUTES - MongoDB Version
 * Handles: Scholarship CRUD operations
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Scholarship } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole, checkPermission } = require('../middleware/authorization');

const mapScholarship = (doc) => ({
    id: doc._id,
    name: doc.title || doc.name,
    title: doc.title || doc.name,
    description: doc.description,
    amount: doc.amount,
    deadline: doc.deadline,
    eligibility_criteria: doc.eligibility,
    required_documents: doc.requirements,
    max_recipients: doc.max_recipients || 1,
    status: doc.status,
    created_by: doc.createdBy,
    created_at: doc.createdAt
});

// ============================================================
// GET ALL SCHOLARSHIPS (Public)
// ============================================================

router.get('/', async (req, res) => {
    try {
        const { active_only = 'true', page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (active_only === 'true') {
            filter.status = 'active';
            filter.$or = [{ deadline: null }, { deadline: { $gte: new Date() } }];
        }

        const [scholarships, total] = await Promise.all([
            Scholarship.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Scholarship.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                scholarships: scholarships.map(mapScholarship),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)) || 1
                }
            }
        });

    } catch (error) {
        console.error('Get scholarships error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scholarships'
        });
    }
});

// ============================================================
// GET SCHOLARSHIP BY ID
// ============================================================

router.get('/:id', async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id);

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found'
            });
        }

        res.json({
            success: true,
            data: mapScholarship(scholarship)
        });

    } catch (error) {
        console.error('Get scholarship error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scholarship'
        });
    }
});

// ============================================================
// CREATE SCHOLARSHIP (Admin only)
// ============================================================

router.post('/',
    verifyToken,
    requireRole('admin'),
    checkPermission('manage_scholarships', 'create'),
    [
        body('name').trim().notEmpty(),
        body('amount').isFloat({ min: 0 }),
        body('description').optional().trim(),
        body('eligibility_criteria').optional().trim(),
        body('required_documents').optional(),
        body('deadline').optional().isISO8601(),
        body('max_recipients').optional().isInt({ min: 1 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                name,
                description,
                amount,
                eligibility_criteria,
                required_documents,
                deadline,
                max_recipients = 1
            } = req.body;

            const scholarship = await Scholarship.create({
                title: name,
                description,
                amount,
                eligibility: eligibility_criteria || 'N/A',
                requirements: Array.isArray(required_documents) ? required_documents.join(', ') : (required_documents || 'N/A'),
                deadline,
                status: 'active',
                createdBy: req.user.id,
                max_recipients
            });

            res.status(201).json({
                success: true,
                message: 'Scholarship created successfully',
                data: { id: scholarship._id }
            });

        } catch (error) {
            console.error('Create scholarship error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create scholarship'
            });
        }
    }
);

// ============================================================
// UPDATE SCHOLARSHIP (Admin only)
// ============================================================

router.put('/:id',
    verifyToken,
    requireRole('admin'),
    checkPermission('manage_scholarships', 'update'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const mapped = {};
            if (updates.name) mapped.title = updates.name;
            if (updates.description) mapped.description = updates.description;
            if (updates.amount !== undefined) mapped.amount = updates.amount;
            if (updates.eligibility_criteria) mapped.eligibility = updates.eligibility_criteria;
            if (updates.required_documents) mapped.requirements = Array.isArray(updates.required_documents)
                ? updates.required_documents.join(', ')
                : updates.required_documents;
            if (updates.deadline) mapped.deadline = updates.deadline;
            if (updates.max_recipients) mapped.max_recipients = updates.max_recipients;
            if (updates.is_active !== undefined) mapped.status = updates.is_active ? 'active' : 'inactive';

            await Scholarship.findByIdAndUpdate(id, mapped);

            res.json({
                success: true,
                message: 'Scholarship updated successfully'
            });

        } catch (error) {
            console.error('Update scholarship error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update scholarship'
            });
        }
    }
);

// ============================================================
// DELETE SCHOLARSHIP (Admin only - soft delete)
// ============================================================

router.delete('/:id',
    verifyToken,
    requireRole('admin'),
    checkPermission('manage_scholarships', 'delete'),
    async (req, res) => {
        try {
            await Scholarship.findByIdAndUpdate(req.params.id, { status: 'inactive' });

            res.json({
                success: true,
                message: 'Scholarship deactivated successfully'
            });

        } catch (error) {
            console.error('Delete scholarship error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete scholarship'
            });
        }
    }
);

module.exports = router;
