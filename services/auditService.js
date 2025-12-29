const commonService = require('./commonService');

const auditService = {
    /**
     * Log user activities safely
     */
    logActivity: async function(userId, action, resource, email, details = null, ipAddress = null) {
        try {
            const logData = {
                user_id: userId,
                email: email ? email.substring(0, 100) : null,
                action: this.sanitizeAction(action),
                resource: this.sanitizeResource(resource),
                details: details ? JSON.stringify(this.sanitizeDetails(details)) : null,
                ip_address: ipAddress
            };
            // Save to audit_logs table (you may need to create this table)
            // await commonService.addRecordTable(logData, 'audit_logs', true);
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
        
        // Only allow specific actions
        const allowedActions = [
            'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT'
        ];
        
        const upperAction = action.toUpperCase();
        return allowedActions.includes(upperAction) ? upperAction : 'OTHER';
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
     * Sanitize details object
     */
    sanitizeDetails: function(details) {
        if (!details || typeof details !== 'object') {
            return {};
        }

        const sanitized = {};
        const allowedFields = ['id', 'name', 'status', 'type', 'count'];

        for (const [key, value] of Object.entries(details)) {
            if (allowedFields.includes(key)) {
                if (typeof value === 'string') {
                    sanitized[key] = value.substring(0, 100);
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
     * Log authentication events
     */
    logAuthEvent: async function(email, action, success, details = null, ipAddress = null) {
        try {
            const logData = {
                email: email ? email.substring(0, 100) : null,
                action: this.sanitizeAction(action),
                success: success ? 1 : 0,
                details: details ? JSON.stringify(this.sanitizeDetails(details)) : null,
                ip_address: ipAddress
            };

            // await commonService.addRecordTable(logData, 'auth_logs', true);
        } catch (error) {
            console.error('Auth logging failed:', error.message);
        }
    }
};

module.exports = auditService; 