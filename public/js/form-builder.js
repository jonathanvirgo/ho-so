/**
 * Advanced Form Builder with Drag & Drop
 */
class FormBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.fields = [];
        this.selectedField = null;
        this.draggedElement = null;
        this.fieldCounter = 0;
        
        this.fieldTypes = {
            text: {
                name: 'Text Input',
                icon: 'fas fa-font',
                template: this.createTextTemplate,
                properties: ['label', 'placeholder', 'required', 'maxLength']
            },
            textarea: {
                name: 'Textarea',
                icon: 'fas fa-align-left',
                template: this.createTextareaTemplate,
                properties: ['label', 'placeholder', 'required', 'rows']
            },
            select: {
                name: 'Dropdown',
                icon: 'fas fa-chevron-down',
                template: this.createSelectTemplate,
                properties: ['label', 'required', 'options']
            },
            radio: {
                name: 'Radio Buttons',
                icon: 'fas fa-dot-circle',
                template: this.createRadioTemplate,
                properties: ['label', 'required', 'options']
            },
            checkbox: {
                name: 'Checkboxes',
                icon: 'fas fa-check-square',
                template: this.createCheckboxTemplate,
                properties: ['label', 'required', 'options']
            },
            number: {
                name: 'Number',
                icon: 'fas fa-hashtag',
                template: this.createNumberTemplate,
                properties: ['label', 'placeholder', 'required', 'min', 'max']
            },
            email: {
                name: 'Email',
                icon: 'fas fa-envelope',
                template: this.createEmailTemplate,
                properties: ['label', 'placeholder', 'required']
            },
            date: {
                name: 'Date',
                icon: 'fas fa-calendar',
                template: this.createDateTemplate,
                properties: ['label', 'required']
            },
            file: {
                name: 'File Upload',
                icon: 'fas fa-upload',
                template: this.createFileTemplate,
                properties: ['label', 'required', 'accept', 'multiple']
            }
        };
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="form-builder-container">
                <div class="form-builder-sidebar">
                    <div class="field-types">
                        <h5><i class="fas fa-tools"></i> Field Types</h5>
                        ${this.renderFieldTypes()}
                    </div>
                    
                    <div class="theme-selector">
                        <h5><i class="fas fa-palette"></i> Themes</h5>
                        ${this.renderThemeSelector()}
                    </div>
                    
                    <div class="field-properties">
                        <h5><i class="fas fa-cog"></i> Properties</h5>
                        <div id="properties-panel">
                            <p class="text-muted">Select a field to edit properties</p>
                        </div>
                    </div>
                </div>
                
                <div class="form-builder-canvas">
                    <div class="form-canvas" id="form-canvas">
                        <div class="form-canvas-empty">
                            <i class="fas fa-mouse-pointer fa-2x mb-3"></i>
                            <p>Drag field types here to build your form</p>
                        </div>
                    </div>
                </div>
                
                <div class="form-builder-preview">
                    <h5><i class="fas fa-eye"></i> Preview</h5>
                    <div class="preview-form" id="preview-form">
                        <p class="text-muted">Form preview will appear here</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderFieldTypes() {
        return Object.entries(this.fieldTypes).map(([type, config]) => `
            <div class="field-type-item" draggable="true" data-field-type="${type}">
                <i class="${config.icon} field-type-icon"></i>
                <span class="field-type-name">${config.name}</span>
            </div>
        `).join('');
    }
    
    renderThemeSelector() {
        const themes = [
            { name: 'Default', color: '#007bff', value: 'default' },
            { name: 'Success', color: '#28a745', value: 'success' },
            { name: 'Warning', color: '#ffc107', value: 'warning' },
            { name: 'Danger', color: '#dc3545', value: 'danger' },
            { name: 'Dark', color: '#343a40', value: 'dark' }
        ];
        
        return themes.map(theme => `
            <div class="theme-option ${theme.value === 'default' ? 'active' : ''}" data-theme="${theme.value}">
                <div class="theme-color" style="background-color: ${theme.color}"></div>
                <span class="theme-name">${theme.name}</span>
            </div>
        `).join('');
    }
    
    bindEvents() {
        // Drag and drop for field types
        this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.container.addEventListener('dragover', this.handleDragOver.bind(this));
        this.container.addEventListener('drop', this.handleDrop.bind(this));
        this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Field selection and controls
        this.container.addEventListener('click', this.handleClick.bind(this));
        
        // Property changes
        this.container.addEventListener('input', this.handlePropertyChange.bind(this));
        this.container.addEventListener('change', this.handlePropertyChange.bind(this));
        
        // Theme selection
        this.container.addEventListener('click', this.handleThemeChange.bind(this));
    }
    
    handleDragStart(e) {
        if (e.target.classList.contains('field-type-item')) {
            this.draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
        } else if (e.target.closest('.form-field')) {
            this.draggedElement = e.target.closest('.form-field');
            e.target.closest('.form-field').classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        const canvas = document.getElementById('form-canvas');
        
        if (canvas.contains(e.target) || e.target === canvas) {
            canvas.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'copy';
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        const canvas = document.getElementById('form-canvas');
        canvas.classList.remove('drag-over');
        
        if (canvas.contains(e.target) || e.target === canvas) {
            if (this.draggedElement.classList.contains('field-type-item')) {
                // Adding new field
                const fieldType = this.draggedElement.dataset.fieldType;
                this.addField(fieldType);
            } else if (this.draggedElement.classList.contains('form-field')) {
                // Reordering existing field
                this.reorderField(this.draggedElement, e.target);
            }
        }
    }
    
    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        
        const canvas = document.getElementById('form-canvas');
        canvas.classList.remove('drag-over');
    }
    
    handleClick(e) {
        // Field selection
        if (e.target.closest('.form-field')) {
            this.selectField(e.target.closest('.form-field'));
        }
        
        // Field controls
        if (e.target.classList.contains('field-control-btn')) {
            e.stopPropagation();
            const action = e.target.dataset.action;
            const field = e.target.closest('.form-field');
            
            if (action === 'delete') {
                this.deleteField(field);
            } else if (action === 'duplicate') {
                this.duplicateField(field);
            } else if (action === 'edit') {
                this.selectField(field);
            }
        }
        
        // Add option button
        if (e.target.classList.contains('add-option-btn')) {
            this.addOption(e.target);
        }
        
        // Remove option button
        if (e.target.classList.contains('remove-option-btn')) {
            this.removeOption(e.target);
        }
    }
    
    handleThemeChange(e) {
        if (e.target.closest('.theme-option')) {
            // Remove active class from all themes
            this.container.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            
            // Add active class to selected theme
            e.target.closest('.theme-option').classList.add('active');
            
            // Apply theme
            const theme = e.target.closest('.theme-option').dataset.theme;
            this.applyTheme(theme);
        }
    }
    
    addField(fieldType) {
        const fieldId = `field_${++this.fieldCounter}`;
        const fieldConfig = this.fieldTypes[fieldType];
        
        const field = {
            id: fieldId,
            type: fieldType,
            label: `${fieldConfig.name} ${this.fieldCounter}`,
            required: false,
            placeholder: '',
            options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? ['Option 1', 'Option 2'] : null
        };
        
        this.fields.push(field);
        this.renderCanvas();
        this.renderPreview();
        
        // Auto-select the new field
        setTimeout(() => {
            const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
            if (fieldElement) {
                this.selectField(fieldElement);
            }
        }, 100);
    }
    
    selectField(fieldElement) {
        // Remove previous selection
        this.container.querySelectorAll('.form-field').forEach(field => {
            field.classList.remove('selected');
        });
        
        // Select current field
        fieldElement.classList.add('selected');
        this.selectedField = fieldElement.dataset.fieldId;
        
        // Update properties panel
        this.renderPropertiesPanel();
    }
    
    deleteField(fieldElement) {
        const fieldId = fieldElement.dataset.fieldId;
        this.fields = this.fields.filter(field => field.id !== fieldId);
        this.selectedField = null;
        
        this.renderCanvas();
        this.renderPreview();
        this.renderPropertiesPanel();
    }
    
    renderCanvas() {
        const canvas = document.getElementById('form-canvas');
        
        if (this.fields.length === 0) {
            canvas.innerHTML = `
                <div class="form-canvas-empty">
                    <i class="fas fa-mouse-pointer fa-2x mb-3"></i>
                    <p>Drag field types here to build your form</p>
                </div>
            `;
            return;
        }
        
        canvas.innerHTML = this.fields.map(field => {
            const fieldConfig = this.fieldTypes[field.type];
            return `
                <div class="form-field" data-field-id="${field.id}" draggable="true">
                    <div class="field-controls">
                        <button class="field-control-btn" data-action="edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="field-control-btn" data-action="duplicate" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="field-control-btn delete" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ${fieldConfig.template.call(this, field)}
                </div>
            `;
        }).join('');
    }
    
    renderPreview() {
        const previewForm = document.getElementById('preview-form');
        
        if (this.fields.length === 0) {
            previewForm.innerHTML = '<p class="text-muted">Form preview will appear here</p>';
            return;
        }
        
        previewForm.innerHTML = this.fields.map(field => {
            const fieldConfig = this.fieldTypes[field.type];
            return `<div class="preview-field">${fieldConfig.template.call(this, field, true)}</div>`;
        }).join('') + `
            <div class="mt-3">
                <button type="submit" class="btn btn-primary">Submit</button>
            </div>
        `;
    }
    
    // Field template methods
    createTextTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <input type="text" class="form-control" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <input type="text" class="form-control" placeholder="${field.placeholder || ''}" disabled>
        `;
    }

    createTextareaTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <textarea class="form-control" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <textarea class="form-control" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}" disabled></textarea>
        `;
    }

    createSelectTemplate(field, isPreview = false) {
        const options = field.options || ['Option 1', 'Option 2'];

        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <select class="form-control" ${field.required ? 'required' : ''}>
                    <option value="">Choose...</option>
                    ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <select class="form-control" disabled>
                <option>Choose...</option>
                ${options.map(option => `<option>${option}</option>`).join('')}
            </select>
        `;
    }

    createRadioTemplate(field, isPreview = false) {
        const options = field.options || ['Option 1', 'Option 2'];

        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                ${options.map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${field.id}" value="${option}" id="${field.id}_${index}" ${field.required ? 'required' : ''}>
                        <label class="form-check-label" for="${field.id}_${index}">${option}</label>
                    </div>
                `).join('')}
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            ${options.map((option, index) => `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="${field.id}" disabled>
                    <label class="form-check-label">${option}</label>
                </div>
            `).join('')}
        `;
    }

    createCheckboxTemplate(field, isPreview = false) {
        const options = field.options || ['Option 1', 'Option 2'];

        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                ${options.map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="${field.id}[]" value="${option}" id="${field.id}_${index}">
                        <label class="form-check-label" for="${field.id}_${index}">${option}</label>
                    </div>
                `).join('')}
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            ${options.map((option, index) => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" disabled>
                    <label class="form-check-label">${option}</label>
                </div>
            `).join('')}
        `;
    }

    createNumberTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <input type="number" class="form-control" placeholder="${field.placeholder || ''}"
                       ${field.min ? `min="${field.min}"` : ''} ${field.max ? `max="${field.max}"` : ''}
                       ${field.required ? 'required' : ''}>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <input type="number" class="form-control" placeholder="${field.placeholder || ''}" disabled>
        `;
    }

    createEmailTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <input type="email" class="form-control" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <input type="email" class="form-control" placeholder="${field.placeholder || ''}" disabled>
        `;
    }

    createDateTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <input type="date" class="form-control" ${field.required ? 'required' : ''}>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <input type="date" class="form-control" disabled>
        `;
    }

    createFileTemplate(field, isPreview = false) {
        if (isPreview) {
            return `
                <label>${field.label} ${field.required ? '<span class="required">*</span>' : ''}</label>
                <div class="file-upload-field" data-field-name="${field.name}">
                    <div class="file-upload-component"></div>
                </div>
                <script>
                    $(document).ready(function() {
                        const container = $('[data-field-name="${field.name}"] .file-upload-component')[0];
                        if (container && typeof FileUpload !== 'undefined') {
                            new FileUpload(container, {
                                maxFileSize: ${field.maxFileSize || 10 * 1024 * 1024},
                                maxFiles: ${field.maxFiles || 5},
                                allowedTypes: ${JSON.stringify(field.allowedTypes || ['image/*', 'application/pdf'])},
                                enableCamera: ${field.enableCamera || false},
                                enableCrop: ${field.enableCrop || false},
                                uploadUrl: '/api/upload',
                                surveyId: '${field.surveyId || ''}'
                            });
                        }
                    });
                </script>
            `;
        }

        return `
            <label class="form-label">${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}</label>
            <div class="file-upload-preview">
                <div class="upload-placeholder">
                    <i class="fas fa-upload"></i>
                    <span>File upload field</span>
                    <small class="text-muted d-block">
                        Max ${field.maxFiles || 5} files, ${this.formatFileSize(field.maxFileSize || 10 * 1024 * 1024)} each
                    </small>
                </div>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderPropertiesPanel() {
        const panel = document.getElementById('properties-panel');

        if (!this.selectedField) {
            panel.innerHTML = '<p class="text-muted">Select a field to edit properties</p>';
            return;
        }

        const field = this.fields.find(f => f.id === this.selectedField);
        if (!field) return;

        const fieldConfig = this.fieldTypes[field.type];
        let html = `<div class="property-form">`;

        // Label
        if (fieldConfig.properties.includes('label')) {
            html += `
                <div class="property-group">
                    <label>Label</label>
                    <input type="text" class="form-control property-input"
                           data-property="label" value="${field.label || ''}">
                </div>
            `;
        }

        // Placeholder
        if (fieldConfig.properties.includes('placeholder')) {
            html += `
                <div class="property-group">
                    <label>Placeholder</label>
                    <input type="text" class="form-control property-input"
                           data-property="placeholder" value="${field.placeholder || ''}">
                </div>
            `;
        }

        // Required
        if (fieldConfig.properties.includes('required')) {
            html += `
                <div class="property-group">
                    <div class="checkbox-group">
                        <input type="checkbox" class="property-input"
                               data-property="required" ${field.required ? 'checked' : ''}>
                        <label>Required field</label>
                    </div>
                </div>
            `;
        }

        // Options for select, radio, checkbox
        if (fieldConfig.properties.includes('options')) {
            html += `
                <div class="property-group">
                    <label>Options</label>
                    <div class="options-list">
                        ${(field.options || []).map((option, index) => `
                            <div class="option-item">
                                <input type="text" class="form-control option-input"
                                       data-index="${index}" value="${option}">
                                <button type="button" class="btn btn-sm btn-danger remove-option-btn"
                                        data-index="${index}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="add-option-btn">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>
            `;
        }

        // Number specific properties
        if (fieldConfig.properties.includes('min')) {
            html += `
                <div class="property-group">
                    <label>Minimum Value</label>
                    <input type="number" class="form-control property-input"
                           data-property="min" value="${field.min || ''}">
                </div>
            `;
        }

        if (fieldConfig.properties.includes('max')) {
            html += `
                <div class="property-group">
                    <label>Maximum Value</label>
                    <input type="number" class="form-control property-input"
                           data-property="max" value="${field.max || ''}">
                </div>
            `;
        }

        // Textarea rows
        if (fieldConfig.properties.includes('rows')) {
            html += `
                <div class="property-group">
                    <label>Rows</label>
                    <input type="number" class="form-control property-input"
                           data-property="rows" value="${field.rows || 3}" min="1" max="10">
                </div>
            `;
        }

        // File specific properties
        if (fieldConfig.properties.includes('accept')) {
            html += `
                <div class="property-group">
                    <label>Accepted File Types</label>
                    <input type="text" class="form-control property-input"
                           data-property="accept" value="${field.accept || ''}"
                           placeholder="e.g., .jpg,.png,.pdf">
                </div>
            `;
        }

        if (fieldConfig.properties.includes('multiple')) {
            html += `
                <div class="property-group">
                    <div class="checkbox-group">
                        <input type="checkbox" class="property-input"
                               data-property="multiple" ${field.multiple ? 'checked' : ''}>
                        <label>Allow multiple files</label>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        panel.innerHTML = html;
    }

    handlePropertyChange(e) {
        if (!e.target.classList.contains('property-input') && !e.target.classList.contains('option-input')) {
            return;
        }

        if (!this.selectedField) return;

        const field = this.fields.find(f => f.id === this.selectedField);
        if (!field) return;

        if (e.target.classList.contains('property-input')) {
            const property = e.target.dataset.property;
            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            field[property] = value;
        } else if (e.target.classList.contains('option-input')) {
            const index = parseInt(e.target.dataset.index);
            if (!field.options) field.options = [];
            field.options[index] = e.target.value;
        }

        this.renderCanvas();
        this.renderPreview();
    }

    addOption(button) {
        if (!this.selectedField) return;

        const field = this.fields.find(f => f.id === this.selectedField);
        if (!field) return;

        if (!field.options) field.options = [];
        field.options.push(`Option ${field.options.length + 1}`);

        this.renderPropertiesPanel();
        this.renderCanvas();
        this.renderPreview();
    }

    removeOption(button) {
        if (!this.selectedField) return;

        const field = this.fields.find(f => f.id === this.selectedField);
        if (!field || !field.options) return;

        const index = parseInt(button.dataset.index);
        field.options.splice(index, 1);

        this.renderPropertiesPanel();
        this.renderCanvas();
        this.renderPreview();
    }

    duplicateField(fieldElement) {
        const fieldId = fieldElement.dataset.fieldId;
        const originalField = this.fields.find(f => f.id === fieldId);
        if (!originalField) return;

        const newFieldId = `field_${++this.fieldCounter}`;
        const newField = {
            ...originalField,
            id: newFieldId,
            label: originalField.label + ' (Copy)'
        };

        // Insert after the original field
        const originalIndex = this.fields.findIndex(f => f.id === fieldId);
        this.fields.splice(originalIndex + 1, 0, newField);

        this.renderCanvas();
        this.renderPreview();
    }

    applyTheme(theme) {
        const canvas = document.getElementById('form-canvas');
        const preview = document.getElementById('preview-form');

        // Remove existing theme classes
        canvas.className = canvas.className.replace(/theme-\w+/g, '');
        preview.className = preview.className.replace(/theme-\w+/g, '');

        // Add new theme class
        if (theme !== 'default') {
            canvas.classList.add(`theme-${theme}`);
            preview.classList.add(`theme-${theme}`);
        }
    }

    // Export form configuration
    exportForm() {
        return {
            fields: this.fields,
            theme: document.querySelector('.theme-option.active')?.dataset.theme || 'default',
            pages: this.pages || [],
            conditionalRules: this.conditionalRules || [],
            validationRules: this.validationRules || {},
            settings: this.settings || {}
        };
    }

    // Import form configuration
    importForm(config) {
        this.fields = config.fields || [];
        this.pages = config.pages || [];
        this.conditionalRules = config.conditionalRules || [];
        this.validationRules = config.validationRules || {};
        this.settings = config.settings || {};

        this.fieldCounter = Math.max(...this.fields.map(f => parseInt(f.id.split('_')[1])), 0);

        this.renderCanvas();
        this.renderPreview();

        if (config.theme) {
            this.applyTheme(config.theme);
            // Update theme selector
            this.container.querySelectorAll('.theme-option').forEach(option => {
                option.classList.toggle('active', option.dataset.theme === config.theme);
            });
        }

        // Setup conditional logic and validation if available
        this.setupAdvancedFeatures();
    }

    // Setup advanced features
    setupAdvancedFeatures() {
        // Initialize conditional logic
        if (this.conditionalRules && this.conditionalRules.length > 0) {
            this.initConditionalLogic();
        }

        // Initialize validation
        if (this.validationRules && Object.keys(this.validationRules).length > 0) {
            this.initValidation();
        }

        // Initialize multi-page if pages are defined
        if (this.pages && this.pages.length > 0) {
            this.initMultiPage();
        }
    }

    // Initialize conditional logic
    initConditionalLogic() {
        const previewForm = document.getElementById('preview-form');
        if (previewForm && typeof ConditionalLogic !== 'undefined') {
            this.conditionalLogicEngine = new ConditionalLogic(previewForm);

            // Add existing rules
            this.conditionalRules.forEach(rule => {
                this.conditionalLogicEngine.addRule(rule);
            });
        }
    }

    // Initialize validation
    initValidation() {
        const previewForm = document.getElementById('preview-form');
        if (previewForm && typeof FormValidation !== 'undefined') {
            this.validationEngine = new FormValidation(previewForm, {
                validateOnChange: true,
                validateOnBlur: true
            });

            // Add existing rules
            this.validationEngine.addRules(this.validationRules);
        }
    }

    // Initialize multi-page
    initMultiPage() {
        const previewForm = document.getElementById('preview-form');
        if (previewForm && typeof MultiPageSurvey !== 'undefined') {
            this.multiPageEngine = new MultiPageSurvey(previewForm, {
                showProgressBar: true,
                showPageNumbers: true,
                allowBackNavigation: true,
                validateOnNext: true
            });

            // Add existing pages
            this.pages.forEach(page => {
                this.multiPageEngine.addPage(page);
            });

            // Connect with other engines
            if (this.conditionalLogicEngine) {
                this.multiPageEngine.setConditionalLogic(this.conditionalLogicEngine);
            }

            if (this.validationEngine) {
                this.multiPageEngine.setValidation(this.validationEngine);
            }
        }
    }
}
