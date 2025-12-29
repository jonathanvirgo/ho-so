const securityService = {
    /**
     * Unified validation function supporting both old and new usage patterns
     * @param {Object} inputData - Data to validate
     * @param {Object|Array} schema - Validation schema (Object for new style, Array for old style)
     * @param {Object} options - Additional options { returnType: 'object'|'array', sanitize: true|false }
     * @returns {Object|Array} Validation result
     */
    validateInput: function (inputData, schema, options = {}) {
        const defaults = {
            returnType: 'auto', // 'auto', 'object', 'array'
            sanitize: true
        };
        const opts = { ...defaults, ...options };
        
        const errors = [];
        const sanitizedData = {};
        
        // Detect schema type and normalize it
        const isArraySchema = Array.isArray(schema);
        const normalizedRules = isArraySchema ? this._convertArraySchemaToObject(schema) : schema;
        
        // Auto-detect return type if not specified
        if (opts.returnType === 'auto') {
            opts.returnType = isArraySchema ? 'array' : 'object';
        }

        for (const [field, rules] of Object.entries(normalizedRules)) {
            const value = inputData[field];

            // Check required
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field,
                    message: rules.message || field + ' la bat buoc'
                });
                continue;
            }

            // Skip further validation if not required and no value
            if (!rules.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Type validation
            if (rules.type) {
                const typeValidation = this._validateType(value, rules.type, field);
                if (typeValidation.error) {
                    errors.push(typeValidation.error);
                    continue;
                }
            }

            // Length validation for strings
            if (typeof value === 'string' || Array.isArray(value)) {
                const lengthValidation = this._validateLength(value, rules, field);
                if (lengthValidation.error) {
                    errors.push(lengthValidation.error);
                    continue;
                }
            }

            // Custom validator (for backward compatibility)
            if (rules.customValidator && typeof rules.customValidator === 'function') {
                const customError = rules.customValidator(value);
                if (customError) {
                    errors.push({ field, message: customError });
                    continue;
                }
            }

            // Sanitize input if enabled
            if (opts.sanitize) {
                sanitizedData[field] = this.sanitizeInput(value, rules.type);
            } else {
                sanitizedData[field] = value;
            }
        }

        // Return result based on specified format
        if (opts.returnType === 'array') {
            return errors; // Old format for backward compatibility
        } else {
            return {
                errors,
                data: sanitizedData,
                isValid: errors.length === 0
            }; // New format
        }
    },

    /**
     * Convert array-based schema to object-based schema for internal processing
     * @private
     */
    _convertArraySchemaToObject: function(arraySchema) {
        const objectSchema = {};
        arraySchema.forEach(rule => {
            objectSchema[rule.field] = {
                required: rule.required || false,
                type: rule.type,
                message: rule.message,
                customValidator: rule.customValidator
            };
        });
        return objectSchema;
    },

    /**
     * Validate data type
     * @private
     */
    _validateType: function(value, type, field) {
        switch (type) {
            case 'string':
                if (typeof value !== 'string') {
                    return { error: { field, message: field + ' phai la chuoi' } };
                }
                break;
            case 'number':
                if (typeof value !== 'number' && isNaN(Number(value))) {
                    return { error: { field, message: field + ' phai la so' } };
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return { error: { field, message: field + ' phai la boolean' } };
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    return { error: { field, message: field + ' phai la mang' } };
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return { error: { field, message: field + ' khong dung dinh dang email' } };
                }
                break;
            default:
                return { error: { field, message: field + ' co loai du lieu khong hop le' } };
        }
        return { error: null };
    },

    /**
     * Validate length constraints
     * @private
     */
    _validateLength: function(value, rules, field) {
        const length = typeof value === 'string' ? value.length : (Array.isArray(value) ? value.length : 0);
        
        if (rules.minLength && length < rules.minLength) {
            return {
                error: {
                    field,
                    message: field + ' phai co it nhat ' + rules.minLength + ' ky tu'
                }
            };
        }

        if (rules.maxLength && length > rules.maxLength) {
            return {
                error: {
                    field,
                    message: field + ' khong duoc vuot qua ' + rules.maxLength + ' ky tu'
                }
            };
        }

        return { error: null };
    },

    sanitizeInput: function (value, type) {
        if (value === null || value === undefined) {
            return value;
        }

        switch (type) {
            case 'string':
                return String(value)
                    .trim()
                    .replace(/[<>]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+=/gi, '');
            case 'number':
                return Number(value);
            case 'email':
                return String(value).toLowerCase().trim();
            default:
                return value;
        }
    },

    checkAuthorization: function (user, resource, action) {
        action = action || 'read';
        const errors = [];

        if (!user || !user.id) {
            errors.push('Nguoi dung khong hop le');
            return { authorized: false, errors };
        }

        if (user.isAdmin) {
            return { authorized: true, errors: [] };
        }

        const rolePermissions = this.getRolePermissions();
        
        if (!user.role_id || !Array.isArray(user.role_id)) {
            errors.push('Nguoi dung khong co quyen han');
            return { authorized: false, errors };
        }

        const hasPermission = user.role_id.some(function(roleId) {
            const permissions = rolePermissions[roleId];
            if (!permissions) return false;

            if (action === 'read') {
                return permissions.read.includes(resource) || permissions.all.includes(resource);
            } else if (action === 'write') {
                return permissions.write.includes(resource) || permissions.all.includes(resource);
            } else if (action === 'delete') {
                return permissions.delete.includes(resource) || permissions.all.includes(resource);
            }

            return false;
        });

        if (!hasPermission) {
            errors.push('Ban khong co quyen truy cap tinh nang nay');
            return { authorized: false, errors };
        }

        return { authorized: true, errors: [] };
    },

    getRolePermissions: function () {
        return {
            1: { 
                all: ['*'],
                read: [],
                write: [],
                delete: []
            },
            2: { 
                read: [],
                write: [],
                delete: [],
                all: []
            },
            3: {
                read: ['viem-gan', 'patient', 'projects', 'survey-configs'],
                write: ['viem-gan', 'patient', 'projects', 'survey-configs'],
                delete: ['viem-gan', 'projects', 'survey-configs'],
                all: []
            },
            4: {
                read: ['uon-van', 'patient', 'projects', 'survey-configs'],
                write: ['uon-van', 'patient', 'projects', 'survey-configs'],
                delete: ['uon-van', 'projects', 'survey-configs'],
                all: []
            },
            5: {
                read: ['hoi-chan', 'patient', 'projects', 'survey-configs'],
                write: ['hoi-chan', 'patient', 'projects', 'survey-configs'],
                delete: ['hoi-chan', 'projects', 'survey-configs'],
                all: []
            },
            6: {
                read: ['viem-gan-mt1', 'patient', 'projects', 'survey-configs'],
                write: ['viem-gan-mt1', 'patient', 'projects', 'survey-configs'],
                delete: ['viem-gan-mt1', 'projects', 'survey-configs'],
                all: []
            },
            7: {
                read: ['research', 'patient', 'projects', 'survey-configs','khau-phan-an'],
                write: ['research', 'patient', 'projects', 'survey-configs','khau-phan-an'],
                delete: ['research', 'projects', 'survey-configs','khau-phan-an'],
                all: []
            },
            8: {
                read: ['standard', 'patient', 'projects', 'survey-configs'],
                write: ['standard', 'patient', 'projects', 'survey-configs'],
                delete: ['standard', 'projects', 'survey-configs'],
                all: []
            }
        };
    },

    requirePermission: function (resource, action) {
        action = action || 'read';
        const self = this;
        return function(req, res, next) {
            const authResult = self.checkAuthorization(req.user, resource, action);
            if (!authResult.authorized) {
                const errorMessage = authResult.errors.join(', ');
                
                if (req.method === 'POST' && req.xhr) {
                    return res.status(403).json({
                        success: false,
                        message: errorMessage
                    });
                } else if (req.method === 'POST') {
                    return res.status(403).json({
                        "data": [],
                        "error": errorMessage,
                        "draw": req.body.draw || 1,
                        "recordsFiltered": 0,
                        "recordsTotal": 0
                    });
                } else {
                    return res.status(403).render('error', {
                        user: req.user,
                        message: errorMessage,
                        status: 403
                    });
                }
            }

            next();
        };
    },

    validateDbIdentifier: function (identifier, allowedIdentifiers) {
        allowedIdentifiers = allowedIdentifiers || [];
        
        if (!identifier || typeof identifier !== 'string') {
            throw new Error('Invalid database identifier');
        }

        if (allowedIdentifiers.length > 0 && !allowedIdentifiers.includes(identifier)) {
            throw new Error('Database identifier not allowed');
        }

        const validPattern = /^[a-zA-Z0-9_\.]+$/;
        if (!validPattern.test(identifier)) {
            throw new Error('Database identifier contains invalid characters');
        }

        const dangerousPatterns = [
            /union\s+select/i,
            /drop\s+table/i,
            /delete\s+from/i,
            /insert\s+into/i,
            /update\s+set/i,
            /--/,
            /\/\*/,
            /\*\//,
            /;/
        ];

        for (var i = 0; i < dangerousPatterns.length; i++) {
            if (dangerousPatterns[i].test(identifier)) {
                throw new Error('Database identifier contains dangerous patterns');
            }
        }

        return identifier;
    },

    createErrorResponse: function (message, details, statusCode) {
        return {
            success: false,
            message: message,
            data: null,
            error: details || null,
            statusCode: statusCode || 400
        };
    },

    createSuccessResponse: function (data, message) {
        return {
            success: true,
            message: message || 'Thanh cong',
            data: data,
            error: null
        };
    },

    /**
     * Apply role-based filtering to database conditions
     * @param {Object} user - User object with role information
     * @param {Object} baseConditions - Base conditions for the query
     * @returns {Object} Modified conditions with role-based filtering
     */
    applyRoleBasedFiltering: function(user, baseConditions = {}) {
        const conditions = { ...baseConditions };
        // Tất cả users (bao gồm admin) đều phải filter theo campaign_id của họ
        if (user && user.campaign_id) {
            conditions.campaign_id = user.campaign_id;
        }

        return conditions;
    },

    /**
     * Check if user can access specific record
     * @param {Object} user - User object
     * @param {Object} record - Database record to check
     * @returns {Boolean} True if user can access the record
     */
    canAccessRecord: function(user, record) {
        // Admin can access all records
        if (user && user.isAdmin) {
            return true;
        }

        // User can access records they created
        if (user && user.id && record && record.created_by === user.id) {
            return true;
        }

        return false;
    }
};

module.exports = securityService;