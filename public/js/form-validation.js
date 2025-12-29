/**
 * Advanced Form Validation Engine
 */
class FormValidation {
    constructor(formContainer, options = {}) {
        this.formContainer = formContainer;
        this.options = {
            showErrorsInline: true,
            showErrorsSummary: true,
            validateOnChange: true,
            validateOnBlur: true,
            ...options
        };
        
        this.rules = {};
        this.customValidators = {};
        this.errors = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupDefaultValidators();
    }
    
    bindEvents() {
        if (this.options.validateOnChange) {
            $(this.formContainer).on('change input', 'input, select, textarea', (e) => {
                this.validateField(e.target);
            });
        }
        
        if (this.options.validateOnBlur) {
            $(this.formContainer).on('blur', 'input, select, textarea', (e) => {
                this.validateField(e.target);
            });
        }
        
        // Form submission validation
        $(this.formContainer).on('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                return false;
            }
        });
    }
    
    /**
     * Setup default validators
     */
    setupDefaultValidators() {
        this.addValidator('required', (value, params) => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== null && value !== undefined && value !== '';
        }, 'This field is required');
        
        this.addValidator('email', (value) => {
            if (!value) return true; // Allow empty unless required
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }, 'Please enter a valid email address');
        
        this.addValidator('min_length', (value, params) => {
            if (!value) return true;
            return String(value).length >= parseInt(params);
        }, 'Must be at least {0} characters long');
        
        this.addValidator('max_length', (value, params) => {
            if (!value) return true;
            return String(value).length <= parseInt(params);
        }, 'Must be no more than {0} characters long');
        
        this.addValidator('min_value', (value, params) => {
            if (!value) return true;
            return parseFloat(value) >= parseFloat(params);
        }, 'Must be at least {0}');
        
        this.addValidator('max_value', (value, params) => {
            if (!value) return true;
            return parseFloat(value) <= parseFloat(params);
        }, 'Must be no more than {0}');
        
        this.addValidator('pattern', (value, params) => {
            if (!value) return true;
            const regex = new RegExp(params);
            return regex.test(value);
        }, 'Invalid format');
        
        this.addValidator('numeric', (value) => {
            if (!value) return true;
            return !isNaN(value) && !isNaN(parseFloat(value));
        }, 'Must be a valid number');
        
        this.addValidator('integer', (value) => {
            if (!value) return true;
            return Number.isInteger(parseFloat(value));
        }, 'Must be a whole number');
        
        this.addValidator('url', (value) => {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, 'Please enter a valid URL');
        
        this.addValidator('phone', (value) => {
            if (!value) return true;
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
        }, 'Please enter a valid phone number');
        
        this.addValidator('date', (value) => {
            if (!value) return true;
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        }, 'Please enter a valid date');
        
        this.addValidator('date_after', (value, params) => {
            if (!value) return true;
            const inputDate = new Date(value);
            const compareDate = new Date(params);
            return inputDate > compareDate;
        }, 'Date must be after {0}');
        
        this.addValidator('date_before', (value, params) => {
            if (!value) return true;
            const inputDate = new Date(value);
            const compareDate = new Date(params);
            return inputDate < compareDate;
        }, 'Date must be before {0}');
        
        this.addValidator('confirmed', (value, params, fieldName) => {
            const confirmField = $(this.formContainer).find(`[name="${params}"]`).val();
            return value === confirmField;
        }, 'Confirmation does not match');
        
        this.addValidator('unique', (value, params) => {
            // This would typically check against a database
            // For now, just return true
            return true;
        }, 'This value already exists');
        
        this.addValidator('file_size', (value, params) => {
            const input = $(this.formContainer).find(`[name="${value}"]`)[0];
            if (!input || !input.files || input.files.length === 0) return true;
            
            const maxSize = parseInt(params) * 1024 * 1024; // Convert MB to bytes
            for (let file of input.files) {
                if (file.size > maxSize) {
                    return false;
                }
            }
            return true;
        }, 'File size must be less than {0}MB');
        
        this.addValidator('file_type', (value, params) => {
            const input = $(this.formContainer).find(`[name="${value}"]`)[0];
            if (!input || !input.files || input.files.length === 0) return true;
            
            const allowedTypes = params.split(',').map(type => type.trim().toLowerCase());
            for (let file of input.files) {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const mimeType = file.type.toLowerCase();
                
                const isValidExtension = allowedTypes.some(type => 
                    type.startsWith('.') ? type === `.${fileExtension}` : false
                );
                const isValidMimeType = allowedTypes.some(type => 
                    !type.startsWith('.') ? mimeType.includes(type) : false
                );
                
                if (!isValidExtension && !isValidMimeType) {
                    return false;
                }
            }
            return true;
        }, 'Invalid file type. Allowed types: {0}');
    }
    
    /**
     * Add custom validator
     */
    addValidator(name, validator, message) {
        this.customValidators[name] = {
            validator: validator,
            message: message
        };
    }
    
    /**
     * Add validation rule for field
     */
    addRule(fieldName, rules) {
        /*
        Rules format:
        {
            'field_name': [
                'required',
                'email',
                'min_length:5',
                'max_length:100',
                {
                    validator: 'custom_validator_name',
                    params: 'parameter_value',
                    message: 'Custom error message'
                }
            ]
        }
        */
        this.rules[fieldName] = Array.isArray(rules) ? rules : [rules];
    }
    
    /**
     * Add multiple rules
     */
    addRules(rulesObject) {
        Object.keys(rulesObject).forEach(fieldName => {
            this.addRule(fieldName, rulesObject[fieldName]);
        });
    }
    
    /**
     * Validate single field
     */
    validateField(element) {
        const fieldName = element.name || element.id;
        if (!fieldName || !this.rules[fieldName]) {
            return true;
        }
        
        const value = this.getFieldValue(element);
        const fieldRules = this.rules[fieldName];
        const fieldErrors = [];
        
        for (let rule of fieldRules) {
            let validatorName, params, customMessage;
            
            if (typeof rule === 'string') {
                const parts = rule.split(':');
                validatorName = parts[0];
                params = parts[1];
            } else if (typeof rule === 'object') {
                validatorName = rule.validator;
                params = rule.params;
                customMessage = rule.message;
            }
            
            const validator = this.customValidators[validatorName];
            if (!validator) {
                console.warn(`Validator '${validatorName}' not found`);
                continue;
            }
            
            const isValid = validator.validator(value, params, fieldName);
            if (!isValid) {
                const message = customMessage || validator.message.replace('{0}', params);
                fieldErrors.push(message);
            }
        }
        
        // Update errors
        if (fieldErrors.length > 0) {
            this.errors[fieldName] = fieldErrors;
        } else {
            delete this.errors[fieldName];
        }
        
        // Show/hide errors
        this.displayFieldErrors(element, fieldErrors);
        
        return fieldErrors.length === 0;
    }
    
    /**
     * Validate entire form
     */
    validateForm() {
        this.errors = {};
        let isValid = true;
        
        // Validate all fields with rules
        Object.keys(this.rules).forEach(fieldName => {
            const element = this.findFieldElement(fieldName);
            if (element) {
                const fieldValid = this.validateField(element);
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        // Show errors summary
        if (this.options.showErrorsSummary) {
            this.displayErrorsSummary();
        }
        
        return isValid;
    }
    
    /**
     * Find field element by name
     */
    findFieldElement(fieldName) {
        let element = $(this.formContainer).find(`[name="${fieldName}"]`).first();
        if (element.length === 0) {
            element = $(this.formContainer).find(`#${fieldName}`).first();
        }
        return element.length > 0 ? element[0] : null;
    }
    
    /**
     * Get field value
     */
    getFieldValue(element) {
        const $element = $(element);
        
        if ($element.is('input[type="checkbox"]')) {
            if ($element.attr('name').endsWith('[]')) {
                const name = $element.attr('name');
                const values = [];
                $(`input[name="${name}"]:checked`).each(function() {
                    values.push($(this).val());
                });
                return values;
            } else {
                return $element.is(':checked') ? $element.val() : '';
            }
        } else if ($element.is('input[type="radio"]')) {
            const name = $element.attr('name');
            return $(`input[name="${name}"]:checked`).val() || '';
        } else {
            return $element.val() || '';
        }
    }
    
    /**
     * Display field errors
     */
    displayFieldErrors(element, errors) {
        if (!this.options.showErrorsInline) return;
        
        const $element = $(element);
        const container = $element.closest('.form-group, .mb-3, .form-field, .preview-field');
        
        // Remove existing error messages
        container.find('.validation-error').remove();
        container.removeClass('has-error is-invalid');
        $element.removeClass('is-invalid');
        
        if (errors.length > 0) {
            // Add error class
            container.addClass('has-error is-invalid');
            $element.addClass('is-invalid');
            
            // Add error messages
            const errorHtml = errors.map(error => 
                `<div class="validation-error text-danger small mt-1">${error}</div>`
            ).join('');
            
            container.append(errorHtml);
        }
    }
    
    /**
     * Display errors summary
     */
    displayErrorsSummary() {
        // Remove existing summary
        $(this.formContainer).find('.validation-summary').remove();
        
        const errorCount = Object.keys(this.errors).length;
        if (errorCount === 0) return;
        
        const errorList = [];
        Object.keys(this.errors).forEach(fieldName => {
            this.errors[fieldName].forEach(error => {
                errorList.push(`<li>${fieldName}: ${error}</li>`);
            });
        });
        
        const summaryHtml = `
            <div class="validation-summary alert alert-danger" role="alert">
                <h6><i class="fas fa-exclamation-triangle"></i> Please correct the following errors:</h6>
                <ul class="mb-0">${errorList.join('')}</ul>
            </div>
        `;
        
        $(this.formContainer).prepend(summaryHtml);
        
        // Scroll to summary
        $(this.formContainer).find('.validation-summary')[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = {};
        $(this.formContainer).find('.validation-error').remove();
        $(this.formContainer).find('.validation-summary').remove();
        $(this.formContainer).find('.has-error, .is-invalid').removeClass('has-error is-invalid');
    }
    
    /**
     * Get validation errors
     */
    getErrors() {
        return this.errors;
    }
    
    /**
     * Check if form is valid
     */
    isValid() {
        return Object.keys(this.errors).length === 0;
    }
    
    /**
     * Export validation rules
     */
    exportRules() {
        return {
            rules: this.rules,
            customValidators: Object.keys(this.customValidators).reduce((acc, key) => {
                acc[key] = {
                    message: this.customValidators[key].message
                    // Note: We can't serialize the validator function
                };
                return acc;
            }, {})
        };
    }
    
    /**
     * Import validation rules
     */
    importRules(config) {
        this.rules = config.rules || {};
        // Custom validators need to be re-registered as functions can't be serialized
    }
}
