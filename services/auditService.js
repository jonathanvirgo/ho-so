const commonService = require('./commonService');

const auditService = {
    /**
     * Log user activities safely to audit_logs table
     */
    logActivity: async function(userId, action, resource, email, details = null, ipAddress = null) {
        try {
            const logData = {
                user_id: userId,
                email: email ? email.substring(0, 256) : null,
                action: this.sanitizeAction(action),
                resource: this.sanitizeResource(resource),
                details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
                ip_address: ipAddress ? ipAddress.substring(0, 45) : null,
                timestamp: new Date()
            };
            // Save to audit_logs table - ENABLED for Vercel monitoring
            await commonService.addRecordTable(logData, 'audit_logs', true);
        } catch (error) {
            // Don't throw error to prevent breaking the main flow
            console.error('Audit logging failed:', error.message);
        }
    },

    /**
     * Sanitize action strings
     */
    sanitizeAction: function(action) {
        if (!action || typeof action !== 'string') {
            return 'UNKNOWN';
        }
        
        // Allow more actions for detailed logging
        const allowedActions = [
            'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT',
            'LOGIN_START', 'LOGIN_STEP', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_ERROR',
            'SIGNUP', 'PASSWORD_CHECK', 'TOKEN_CREATE', 'SESSION_SAVE'
        ];
        
        const upperAction = action.toUpperCase();
        return allowedActions.includes(upperAction) ? upperAction : action.substring(0, 50);
    },

    /**
     * Sanitize resource strings
     */
    sanitizeResource: function(resource) {
        if (!resource || typeof resource !== 'string') {
            return 'UNKNOWN';
        }
        
        // Remove any potentially harmful characters
        return resource.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
    },

    /**
     * Sanitize details object - allow more fields for debugging
     */
    sanitizeDetails: function(details) {
        if (!details || typeof details !== 'object') {
            return {};
        }

        const sanitized = {};
        // Allow more fields for debugging during migration
        const allowedFields = [
            'id', 'name', 'status', 'type', 'count', 'reason', 'step', 'message',
            'userId', 'deviceInfo', 'userAgent', 'method', 'usePrisma', 'dbType',
            'querySuccess', 'dataLength', 'error', 'tokenId', 'sessionId'
        ];

        for (const [key, value] of Object.entries(details)) {
            if (allowedFields.includes(key)) {
                if (typeof value === 'string') {
                    sanitized[key] = value.substring(0, 255);
                } else if (typeof value === 'number') {
                    sanitized[key] = value;
                } else if (typeof value === 'boolean') {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    },

    /**
     * Create audit middleware
     */
    createAuditMiddleware: function(action, resource) {
        return (req, res, next) => {
            // Log the activity after the request completes
            res.on('finish', () => {
                if (req.user && req.user.id) {
                    this.logActivity(
                        req.user.id,
                        action,
                        resource,
                        req.user.email,
                        {
                            method: req.method,
                            status: res.statusCode,
                            userAgent: req.get('User-Agent')
                        },
                        req.ip
                    );
                }
            });
            
            next();
        };
    },

    /**
     * Log authentication events to auth_logs table - ENABLED for Vercel monitoring
     * This logs detailed step-by-step information for debugging login flow
     */
    logAuthEvent: async function(email, action, success, details = null, ipAddress = null) {
        try {
            // Get environment info
            const usePrisma = process.env.USE_PRISMA === 'true';
            const dbType = process.env.DB_TYPE || 'unknown';

            // Merge environment info with details
            const fullDetails = {
                ...this.sanitizeDetails(details || {}),
                usePrisma: usePrisma,
                dbType: dbType,
                nodeEnv: process.env.NODE_ENV || 'unknown'
            };

            const logData = {
                email: email ? email.substring(0, 255) : null,
                action: this.sanitizeAction(action),
                success: success ? 1 : 0,
                details: JSON.stringify(fullDetails),
                ip_address: ipAddress ? ipAddress.substring(0, 45) : null,
                timestamp: new Date()
            };

            // ENABLED: Save to auth_logs table for Vercel monitoring
            await commonService.addRecordTable(logData, 'auth_logs', true);
        } catch (error) {
            console.error('Auth logging failed:', error.message);
        }
    },

    /**
     * Log login step for detailed debugging on Vercel
     * @param {string} email - User email
     * @param {number} step - Step number (1-6)
     * @param {string} stepName - Name of the step
     * @param {boolean} success - Whether step succeeded
     * @param {object} details - Additional details
     * @param {string} ipAddress - Client IP
     */
    logLoginStep: async function(email, step, stepName, success, details = null, ipAddress = null) {
        try {
            const usePrisma = process.env.USE_PRISMA === 'true';
            const dbType = process.env.DB_TYPE || 'unknown';

            const logData = {
                email: email ? email.substring(0, 255) : null,
                action: 'LOGIN_STEP',
                success: success ? 1 : 0,
                details: JSON.stringify({
                    step: step,
                    stepName: stepName,
                    usePrisma: usePrisma,
                    dbType: dbType,
                    nodeEnv: process.env.NODE_ENV || 'unknown',
                    ...(details || {})
                }),
                ip_address: ipAddress ? ipAddress.substring(0, 45) : null,
                timestamp: new Date()
            };

            await commonService.addRecordTable(logData, 'auth_logs', true);
        } catch (error) {
            console.error('Login step logging failed:', error.message);
        }
    }
};

module.exports = auditService; 