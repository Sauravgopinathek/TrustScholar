/**
 * ============================================================
 * AUTHORIZATION MIDDLEWARE (ACCESS CONTROL)
 * Implements: Role-Based Access Control (RBAC)
 * Access Control List (ACL) with Subjects and Objects
 * ============================================================
 * 
 * ACCESS CONTROL MATRIX:
 * ┌─────────────┬────────────────────┬────────────────────┬────────────────────┐
 * │   Subject   │   Applications     │   Scholarships     │   Users            │
 * │   (Role)    │   (Object)         │   (Object)         │   (Object)         │
 * ├─────────────┼────────────────────┼────────────────────┼────────────────────┤
 * │   Student   │ CRUD (own only)    │ Read               │ Read/Update (own)  │
 * │   Officer   │ Read/Update        │ Read               │ Read (limited)     │
 * │   Admin     │ Full CRUD          │ Full CRUD          │ Full CRUD          │
 * └─────────────┴────────────────────┴────────────────────┴────────────────────┘
 */

const { AuditLog } = require('../models');

// ============================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================

/**
 * Check if user has required role
 * @param  {...string} allowedRoles - Roles that can access the resource
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized access attempt
            logAccessAttempt(req, 'Unauthorized Access Attempt', 'failure');
            
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient privileges.',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// ============================================================
// SIMPLE IN-MEMORY PERMISSIONS (ACL)
// ============================================================

const ROLE_PERMISSIONS = {
    student: {
        manage_users: { create: false, read: false, update: false, delete: false },
        view_audit_logs: { read: false },
        manage_applications: { create: true, read: true, update: true, delete: false },
        manage_scholarships: { create: false, read: true, update: false, delete: false },
        verify_documents: { read: false }
    },
    officer: {
        manage_users: { create: false, read: false, update: false, delete: false },
        view_audit_logs: { read: false },
        manage_applications: { create: false, read: true, update: true, delete: false },
        manage_scholarships: { create: false, read: true, update: false, delete: false },
        verify_documents: { read: true }
    },
    admin: {
        manage_users: { create: true, read: true, update: true, delete: true },
        view_audit_logs: { read: true },
        manage_applications: { create: true, read: true, update: true, delete: true },
        manage_scholarships: { create: true, read: true, update: true, delete: true },
        verify_documents: { read: true }
    }
};

// ============================================================
// ACCESS CONTROL LIST (ACL) IMPLEMENTATION
// ============================================================

/**
 * Check permission using ACL
 * @param {string} resource - Resource/object name
 * @param {string} action - Action (create, read, update, delete)
 */
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const rolePermissions = ROLE_PERMISSIONS[req.user.role] || {};
            const resourcePermissions = rolePermissions[resource] || {};
            const isAllowed = Boolean(resourcePermissions[action]);

            // Format readable action description
            const actionNames = { create: 'Create', read: 'View', update: 'Update', delete: 'Delete' };
            const resourceNames = {
                manage_users: 'Users',
                view_audit_logs: 'Audit Logs',
                manage_applications: 'Applications',
                manage_scholarships: 'Scholarships',
                verify_documents: 'Documents'
            };
            const readableAction = `${actionNames[action] || action} ${resourceNames[resource] || resource}`;

            if (!isAllowed) {
                // Log denied access
                await logAccessAttempt(req, `Access Denied: ${readableAction}`, 'failure');
                
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Cannot ${action} ${resource}.`
                });
            }

            // Log successful access
            await logAccessAttempt(req, readableAction, 'success');
            
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

// ============================================================
// RESOURCE OWNERSHIP CHECK
// ============================================================

/**
 * Check if user owns the resource (for students accessing their own data)
 * @param {string} resourceType - Type of resource
 * @param {string} paramName - URL parameter name containing resource ID
 */
const checkOwnership = (resourceType, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            // Admin and officers can access all
            if (['admin', 'officer'].includes(req.user.role)) {
                return next();
            }

            const resourceId = req.params[paramName];
            let isOwner = false;

            switch (resourceType) {
                case 'application':
                    const [apps] = await pool.query(
                        'SELECT student_id FROM applications WHERE id = ?',
                        [resourceId]
                    );
                    isOwner = apps.length > 0 && apps[0].student_id === req.user.id;
                    break;

                case 'document':
                    const [docs] = await pool.query(`
                        SELECT a.student_id 
                        FROM documents d
                        JOIN applications a ON d.application_id = a.id
                        WHERE d.id = ?
                    `, [resourceId]);
                    isOwner = docs.length > 0 && docs[0].student_id === req.user.id;
                    break;

                case 'user':
                    isOwner = parseInt(resourceId) === req.user.id;
                    break;

                default:
                    isOwner = false;
            }

            if (!isOwner) {
                const resourceNames = { application: 'Application', document: 'Document', user: 'User' };
                await logAccessAttempt(req, `Access Denied: ${resourceNames[resourceType] || resourceType} Ownership`, 'failure');
                
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

// ============================================================
// AUDIT LOGGING
// ============================================================

/**
 * Convert HTTP method and URL to human-readable action description
 */
const getReadableAction = (method, url) => {
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Define action mappings for common routes
    const actionMappings = {
        // Auth routes
        'POST /api/auth/register': 'User Registration',
        'POST /api/auth/login': 'User Login',
        'POST /api/auth/logout': 'User Logout',
        'POST /api/auth/verify-otp': 'OTP Verification',
        'POST /api/auth/verify-email': 'Email Verification',
        'POST /api/auth/verify-mfa': 'MFA Verification',
        'POST /api/auth/resend-otp': 'Resend OTP',
        'POST /api/auth/forgot-password': 'Password Reset Request',
        'POST /api/auth/reset-password': 'Password Reset',
        'GET /api/auth/me': 'View Profile',
        
        // Scholarship routes
        'GET /api/scholarships': 'View Scholarships',
        'POST /api/scholarships': 'Create Scholarship',
        
        // Application routes
        'GET /api/applications': 'View Applications',
        'POST /api/applications': 'Submit Application',
        'GET /api/applications/my': 'View My Applications',
        
        // Document routes
        'GET /api/documents': 'View Documents',
        'POST /api/documents': 'Upload Document',
        
        // User management routes
        'GET /api/users': 'View Users',
        'POST /api/users': 'Create User',
        'GET /api/users/audit-logs': 'View Audit Logs',
    };

    // Check exact match first
    const exactKey = `${method} ${cleanUrl}`;
    if (actionMappings[exactKey]) {
        return actionMappings[exactKey];
    }

    // Check for dynamic routes with IDs
    const dynamicPatterns = [
        { pattern: /^GET \/api\/scholarships\/[^/]+$/, action: 'View Scholarship Details' },
        { pattern: /^PUT \/api\/scholarships\/[^/]+$/, action: 'Update Scholarship' },
        { pattern: /^DELETE \/api\/scholarships\/[^/]+$/, action: 'Delete Scholarship' },
        
        { pattern: /^GET \/api\/applications\/[^/]+$/, action: 'View Application Details' },
        { pattern: /^PUT \/api\/applications\/[^/]+$/, action: 'Update Application' },
        { pattern: /^DELETE \/api\/applications\/[^/]+$/, action: 'Delete Application' },
        { pattern: /^PUT \/api\/applications\/[^/]+\/status$/, action: 'Update Application Status' },
        { pattern: /^GET \/api\/applications\/[^/]+\/certificate$/, action: 'Download Certificate' },
        { pattern: /^GET \/api\/applications\/verify\/[^/]+$/, action: 'Verify Application' },
        
        { pattern: /^GET \/api\/documents\/[^/]+$/, action: 'Download Document' },
        { pattern: /^GET \/api\/documents\/[^/]+\/verify$/, action: 'Verify Document' },
        { pattern: /^DELETE \/api\/documents\/[^/]+$/, action: 'Delete Document' },
        
        { pattern: /^GET \/api\/users\/[^/]+$/, action: 'View User Details' },
        { pattern: /^PUT \/api\/users\/[^/]+$/, action: 'Update User' },
        { pattern: /^DELETE \/api\/users\/[^/]+$/, action: 'Delete User' },
        { pattern: /^PUT \/api\/users\/[^/]+\/toggle-active$/, action: 'Toggle User Status' },
        { pattern: /^DELETE \/api\/users\/me$/, action: 'Delete Own Account' },
    ];

    for (const { pattern, action } of dynamicPatterns) {
        if (pattern.test(exactKey)) {
            return action;
        }
    }

    // Fallback: Generate readable description from method and URL
    const methodNames = {
        'GET': 'View',
        'POST': 'Create',
        'PUT': 'Update',
        'PATCH': 'Modify',
        'DELETE': 'Delete'
    };

    // Extract resource name from URL
    const urlParts = cleanUrl.replace('/api/', '').split('/').filter(Boolean);
    const resource = urlParts[0] || 'Resource';
    const formattedResource = resource.charAt(0).toUpperCase() + resource.slice(1);
    
    return `${methodNames[method] || method} ${formattedResource}`;
};

/**
 * Log access attempt for audit trail
 */
const logAccessAttempt = async (req, action, status) => {
    try {
        await AuditLog.create({
            userId: req.user?.id || null,
            action,
            resource: req.baseUrl,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

/**
 * Middleware to log all requests
 */
const auditLog = async (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
        // Generate readable action description
        const readableAction = getReadableAction(req.method, req.originalUrl);
        
        // Log after response
        logAccessAttempt(
            req,
            readableAction,
            res.statusCode < 400 ? 'success' : 'failure'
        ).catch(console.error);
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// ============================================================
// ACCESS CONTROL POLICY DEFINITIONS
// ============================================================

/**
 * Policy definitions for documentation and reference
 * These policies are enforced programmatically above
 */
const ACCESS_POLICIES = {
    student: {
        description: 'Regular scholarship applicant',
        permissions: {
            applications: {
                create: true,    // Can create applications
                read: 'own',     // Can only read own applications
                update: 'own',   // Can only update own applications (if draft)
                delete: 'own'    // Can only delete own draft applications
            },
            scholarships: {
                create: false,
                read: true,      // Can view available scholarships
                update: false,
                delete: false
            },
            documents: {
                create: 'own',   // Can upload documents to own applications
                read: 'own',     // Can view own documents
                update: false,
                delete: 'own'    // Can delete own documents (if draft)
            },
            users: {
                create: false,
                read: 'own',     // Can view own profile
                update: 'own',   // Can update own profile
                delete: false
            }
        }
    },
    officer: {
        description: 'Scholarship application officer',
        permissions: {
            applications: {
                create: false,
                read: true,      // Can view all submitted applications
                update: true,    // Can update status, add comments
                delete: false
            },
            scholarships: {
                create: false,
                read: true,
                update: false,
                delete: false
            },
            documents: {
                create: false,
                read: true,      // Can view all documents for verification
                update: false,
                delete: false
            },
            users: {
                create: false,
                read: 'limited', // Can view student basic info
                update: false,
                delete: false
            }
        }
    },
    admin: {
        description: 'System administrator',
        permissions: {
            applications: {
                create: true,
                read: true,
                update: true,
                delete: true
            },
            scholarships: {
                create: true,    // Can create scholarships
                read: true,
                update: true,
                delete: true
            },
            documents: {
                create: true,
                read: true,
                update: true,
                delete: true
            },
            users: {
                create: true,    // Can create users
                read: true,      // Can view all users
                update: true,    // Can update any user
                delete: true     // Can deactivate users
            }
        }
    }
};

module.exports = {
    requireRole,
    checkPermission,
    checkOwnership,
    auditLog,
    ACCESS_POLICIES
};
