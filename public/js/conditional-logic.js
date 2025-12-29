/**
 * Conditional Logic Engine for Survey Forms
 */
class ConditionalLogic {
    constructor(formContainer) {
        this.formContainer = formContainer;
        this.rules = [];
        this.fieldValues = {};
        this.calculatedFields = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.evaluateAllRules();
    }
    
    bindEvents() {
        // Listen for form field changes
        $(this.formContainer).on('change input', 'input, select, textarea', (e) => {
            const fieldName = e.target.name || e.target.id;
            const fieldValue = this.getFieldValue(e.target);
            
            this.fieldValues[fieldName] = fieldValue;
            this.evaluateAllRules();
            this.updateCalculatedFields();
        });
    }
    
    /**
     * Add conditional rule
     * @param {Object} rule - Rule configuration
     */
    addRule(rule) {
        /*
        Rule structure:
        {
            id: 'rule1',
            trigger: 'field_name',
            condition: {
                operator: 'equals|not_equals|greater_than|less_than|contains|in|not_in',
                value: 'comparison_value'
            },
            actions: [
                {
                    type: 'show|hide|require|unrequire|set_value|calculate',
                    target: 'target_field_name',
                    value: 'action_value' // for set_value and calculate actions
                }
            ]
        }
        */
        this.rules.push(rule);
        this.evaluateRule(rule);
    }
    
    /**
     * Remove conditional rule
     */
    removeRule(ruleId) {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        this.evaluateAllRules();
    }
    
    /**
     * Evaluate all rules
     */
    evaluateAllRules() {
        this.rules.forEach(rule => {
            this.evaluateRule(rule);
        });
    }
    
    /**
     * Evaluate single rule
     */
    evaluateRule(rule) {
        const triggerValue = this.fieldValues[rule.trigger];
        const conditionMet = this.evaluateCondition(triggerValue, rule.condition);
        
        rule.actions.forEach(action => {
            this.executeAction(action, conditionMet);
        });
    }
    
    /**
     * Evaluate condition
     */
    evaluateCondition(value, condition) {
        const { operator, value: compareValue } = condition;
        
        switch (operator) {
            case 'equals':
                return value == compareValue;
            case 'not_equals':
                return value != compareValue;
            case 'greater_than':
                return parseFloat(value) > parseFloat(compareValue);
            case 'less_than':
                return parseFloat(value) < parseFloat(compareValue);
            case 'greater_equal':
                return parseFloat(value) >= parseFloat(compareValue);
            case 'less_equal':
                return parseFloat(value) <= parseFloat(compareValue);
            case 'contains':
                return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
            case 'not_contains':
                return !String(value).toLowerCase().includes(String(compareValue).toLowerCase());
            case 'in':
                const inValues = Array.isArray(compareValue) ? compareValue : [compareValue];
                return inValues.includes(value);
            case 'not_in':
                const notInValues = Array.isArray(compareValue) ? compareValue : [compareValue];
                return !notInValues.includes(value);
            case 'is_empty':
                return !value || value === '';
            case 'is_not_empty':
                return value && value !== '';
            case 'regex':
                try {
                    const regex = new RegExp(compareValue);
                    return regex.test(value);
                } catch (e) {
                    console.warn('Invalid regex pattern:', compareValue);
                    return false;
                }
            default:
                return false;
        }
    }
    
    /**
     * Execute action based on condition result
     */
    executeAction(action, conditionMet) {
        const targetElement = this.findTargetElement(action.target);
        if (!targetElement) return;
        
        switch (action.type) {
            case 'show':
                this.toggleVisibility(targetElement, conditionMet);
                break;
            case 'hide':
                this.toggleVisibility(targetElement, !conditionMet);
                break;
            case 'require':
                this.toggleRequired(targetElement, conditionMet);
                break;
            case 'unrequire':
                this.toggleRequired(targetElement, !conditionMet);
                break;
            case 'set_value':
                if (conditionMet) {
                    this.setValue(targetElement, action.value);
                }
                break;
            case 'clear_value':
                if (conditionMet) {
                    this.setValue(targetElement, '');
                }
                break;
            case 'enable':
                this.toggleEnabled(targetElement, conditionMet);
                break;
            case 'disable':
                this.toggleEnabled(targetElement, !conditionMet);
                break;
        }
    }
    
    /**
     * Find target element
     */
    findTargetElement(target) {
        // Try different selectors
        let element = $(this.formContainer).find(`[name="${target}"]`).first();
        if (element.length === 0) {
            element = $(this.formContainer).find(`#${target}`).first();
        }
        if (element.length === 0) {
            element = $(this.formContainer).find(`[data-field-name="${target}"]`).first();
        }
        if (element.length === 0) {
            element = $(this.formContainer).find(`[data-field-id="${target}"]`).first();
        }
        
        // If it's a form field, get the parent container
        if (element.length > 0 && (element.is('input') || element.is('select') || element.is('textarea'))) {
            const container = element.closest('.form-group, .mb-3, .form-field, .preview-field');
            if (container.length > 0) {
                return container;
            }
        }
        
        return element.length > 0 ? element : null;
    }
    
    /**
     * Toggle visibility
     */
    toggleVisibility(element, show) {
        if (show) {
            element.show().removeClass('d-none hidden');
        } else {
            element.hide().addClass('d-none');
        }
    }
    
    /**
     * Toggle required attribute
     */
    toggleRequired(element, required) {
        const input = element.find('input, select, textarea').first();
        if (input.length > 0) {
            if (required) {
                input.attr('required', 'required');
                // Add visual indicator
                const label = element.find('label').first();
                if (label.length > 0 && !label.find('.required').length) {
                    label.append(' <span class="required text-danger">*</span>');
                }
            } else {
                input.removeAttr('required');
                // Remove visual indicator
                element.find('.required').remove();
            }
        }
    }
    
    /**
     * Set field value
     */
    setValue(element, value) {
        const input = element.find('input, select, textarea').first();
        if (input.length > 0) {
            if (input.is('input[type="checkbox"]') || input.is('input[type="radio"]')) {
                input.prop('checked', input.val() === value);
            } else {
                input.val(value).trigger('change');
            }
        }
    }
    
    /**
     * Toggle enabled state
     */
    toggleEnabled(element, enabled) {
        const input = element.find('input, select, textarea').first();
        if (input.length > 0) {
            if (enabled) {
                input.removeAttr('disabled').removeClass('disabled');
            } else {
                input.attr('disabled', 'disabled').addClass('disabled');
            }
        }
    }
    
    /**
     * Get field value
     */
    getFieldValue(element) {
        const $element = $(element);
        
        if ($element.is('input[type="checkbox"]')) {
            if ($element.attr('name').endsWith('[]')) {
                // Multiple checkboxes with same name
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
     * Add calculated field
     */
    addCalculatedField(fieldName, formula) {
        /*
        Formula examples:
        - "field1 + field2"
        - "field1 * 0.1"
        - "if(field1 > 100, field1 * 0.9, field1)"
        - "sum(field1, field2, field3)"
        - "avg(field1, field2, field3)"
        */
        this.calculatedFields[fieldName] = formula;
        this.updateCalculatedField(fieldName);
    }
    
    /**
     * Update all calculated fields
     */
    updateCalculatedFields() {
        Object.keys(this.calculatedFields).forEach(fieldName => {
            this.updateCalculatedField(fieldName);
        });
    }
    
    /**
     * Update single calculated field
     */
    updateCalculatedField(fieldName) {
        const formula = this.calculatedFields[fieldName];
        if (!formula) return;
        
        try {
            const result = this.evaluateFormula(formula);
            const targetElement = this.findTargetElement(fieldName);
            if (targetElement) {
                this.setValue(targetElement, result);
                this.fieldValues[fieldName] = result;
            }
        } catch (error) {
            console.warn(`Error calculating field ${fieldName}:`, error);
        }
    }
    
    /**
     * Evaluate mathematical formula
     */
    evaluateFormula(formula) {
        // Replace field names with their values
        let expression = formula;
        
        // Replace field references
        Object.keys(this.fieldValues).forEach(fieldName => {
            const value = parseFloat(this.fieldValues[fieldName]) || 0;
            expression = expression.replace(new RegExp(`\\b${fieldName}\\b`, 'g'), value);
        });
        
        // Handle built-in functions
        expression = this.handleBuiltInFunctions(expression);
        
        // Evaluate the expression safely
        return this.safeEval(expression);
    }
    
    /**
     * Handle built-in functions
     */
    handleBuiltInFunctions(expression) {
        // Sum function: sum(a, b, c) -> (a + b + c)
        expression = expression.replace(/sum\(([^)]+)\)/g, (match, args) => {
            return `(${args.replace(/,/g, ' + ')})`;
        });
        
        // Average function: avg(a, b, c) -> (a + b + c) / 3
        expression = expression.replace(/avg\(([^)]+)\)/g, (match, args) => {
            const argCount = args.split(',').length;
            return `((${args.replace(/,/g, ' + ')}) / ${argCount})`;
        });
        
        // Min function: min(a, b, c) -> Math.min(a, b, c)
        expression = expression.replace(/min\(([^)]+)\)/g, 'Math.min($1)');
        
        // Max function: max(a, b, c) -> Math.max(a, b, c)
        expression = expression.replace(/max\(([^)]+)\)/g, 'Math.max($1)');
        
        // If function: if(condition, true_value, false_value) -> (condition ? true_value : false_value)
        expression = expression.replace(/if\(([^,]+),([^,]+),([^)]+)\)/g, '($1 ? $2 : $3)');
        
        return expression;
    }
    
    /**
     * Safe evaluation of mathematical expressions
     */
    safeEval(expression) {
        // Only allow safe mathematical operations
        const safeExpression = expression.replace(/[^0-9+\-*/.() <>!=&|?:]/g, '');
        
        try {
            // Use Function constructor for safer evaluation than eval
            return new Function('return ' + safeExpression)();
        } catch (error) {
            console.warn('Formula evaluation error:', error);
            return 0;
        }
    }
    
    /**
     * Validate form with conditional rules
     */
    validateForm() {
        const errors = [];
        
        // Check required fields that are visible
        $(this.formContainer).find('input[required], select[required], textarea[required]').each((index, element) => {
            const $element = $(element);
            const container = $element.closest('.form-group, .mb-3, .form-field, .preview-field');
            
            // Skip if field is hidden
            if (container.is(':hidden') || container.hasClass('d-none') || container.hasClass('hidden')) {
                return;
            }
            
            const value = this.getFieldValue(element);
            if (!value || (Array.isArray(value) && value.length === 0)) {
                const fieldName = $element.attr('name') || $element.attr('id') || 'Unknown field';
                errors.push(`${fieldName} is required`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Get current form data with calculated fields
     */
    getFormData() {
        const formData = {};
        
        // Get regular field values
        $(this.formContainer).find('input, select, textarea').each((index, element) => {
            const name = element.name || element.id;
            if (name) {
                formData[name] = this.getFieldValue(element);
            }
        });
        
        // Add calculated field values
        Object.keys(this.calculatedFields).forEach(fieldName => {
            if (this.fieldValues[fieldName] !== undefined) {
                formData[fieldName] = this.fieldValues[fieldName];
            }
        });
        
        return formData;
    }
    
    /**
     * Export rules configuration
     */
    exportRules() {
        return {
            rules: this.rules,
            calculatedFields: this.calculatedFields
        };
    }
    
    /**
     * Import rules configuration
     */
    importRules(config) {
        this.rules = config.rules || [];
        this.calculatedFields = config.calculatedFields || {};
        this.evaluateAllRules();
        this.updateCalculatedFields();
    }
}
