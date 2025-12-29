/**
 * Multi-Page Survey Engine
 */
class MultiPageSurvey {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showProgressBar: true,
            showPageNumbers: true,
            allowBackNavigation: true,
            validateOnNext: true,
            saveProgress: true,
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            ...options
        };
        
        this.pages = [];
        this.currentPage = 0;
        this.formData = {};
        this.conditionalLogic = null;
        this.validation = null;
        this.autoSaveTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupContainer();
        this.bindEvents();
        
        if (this.options.autoSave) {
            this.startAutoSave();
        }
        
        // Load saved progress if available
        if (this.options.saveProgress) {
            this.loadProgress();
        }
    }
    
    setupContainer() {
        $(this.container).addClass('multi-page-survey');
        
        const html = `
            <div class="survey-header">
                ${this.options.showProgressBar ? this.createProgressBar() : ''}
                ${this.options.showPageNumbers ? '<div class="page-indicator"></div>' : ''}
            </div>
            <div class="survey-content">
                <div class="survey-pages"></div>
            </div>
            <div class="survey-navigation">
                <button type="button" class="btn btn-secondary btn-prev" disabled>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <button type="button" class="btn btn-primary btn-next">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
                <button type="button" class="btn btn-success btn-submit" style="display: none;">
                    <i class="fas fa-check"></i> Submit Survey
                </button>
            </div>
            <div class="survey-footer">
                <div class="auto-save-indicator" style="display: none;">
                    <i class="fas fa-save"></i> <span class="save-status">Saved</span>
                </div>
            </div>
        `;
        
        $(this.container).html(html);
    }
    
    createProgressBar() {
        return `
            <div class="progress-container">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                </div>
                <div class="progress-text">Page 1 of 1</div>
            </div>
        `;
    }
    
    bindEvents() {
        // Navigation buttons
        $(this.container).on('click', '.btn-prev', () => {
            this.previousPage();
        });
        
        $(this.container).on('click', '.btn-next', () => {
            this.nextPage();
        });
        
        $(this.container).on('click', '.btn-submit', () => {
            this.submitSurvey();
        });
        
        // Form field changes
        $(this.container).on('change input', 'input, select, textarea', (e) => {
            this.updateFormData();
            
            if (this.options.autoSave) {
                this.showAutoSaveIndicator('saving');
            }
        });
        
        // Keyboard navigation
        $(document).on('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'ArrowLeft' && this.options.allowBackNavigation) {
                    e.preventDefault();
                    this.previousPage();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextPage();
                }
            }
        });
        
        // Prevent accidental page leave
        $(window).on('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
    
    /**
     * Add page to survey
     */
    addPage(pageConfig) {
        /*
        Page config:
        {
            id: 'page1',
            title: 'Page Title',
            description: 'Page description',
            fields: [field_configs],
            conditions: {
                show: conditional_logic,
                skip: conditional_logic
            },
            validation: validation_rules
        }
        */
        this.pages.push(pageConfig);
        this.renderPage(pageConfig, this.pages.length - 1);
        this.updateProgress();
        this.updateNavigation();
    }
    
    /**
     * Render page HTML
     */
    renderPage(pageConfig, pageIndex) {
        const pageHtml = `
            <div class="survey-page" data-page-id="${pageConfig.id}" data-page-index="${pageIndex}" 
                 style="${pageIndex === 0 ? '' : 'display: none;'}">
                <div class="page-header">
                    ${pageConfig.title ? `<h3 class="page-title">${pageConfig.title}</h3>` : ''}
                    ${pageConfig.description ? `<p class="page-description">${pageConfig.description}</p>` : ''}
                </div>
                <div class="page-content">
                    ${this.renderPageFields(pageConfig.fields || [])}
                </div>
            </div>
        `;
        
        $(this.container).find('.survey-pages').append(pageHtml);
    }
    
    /**
     * Render page fields
     */
    renderPageFields(fields) {
        return fields.map(field => {
            return this.renderField(field);
        }).join('');
    }
    
    /**
     * Render individual field
     */
    renderField(field) {
        const fieldId = field.id || field.name;
        const required = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span class="text-danger">*</span>' : '';
        
        let fieldHtml = '';
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'tel':
            case 'url':
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label for="${fieldId}" class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        <input type="${field.type}" class="form-control" id="${fieldId}" 
                               name="${field.name}" placeholder="${field.placeholder || ''}" 
                               ${required} ${field.readonly ? 'readonly' : ''}>
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'textarea':
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label for="${fieldId}" class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        <textarea class="form-control" id="${fieldId}" name="${field.name}" 
                                  rows="${field.rows || 3}" placeholder="${field.placeholder || ''}" 
                                  ${required} ${field.readonly ? 'readonly' : ''}></textarea>
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'select':
                const options = (field.options || []).map(option => 
                    `<option value="${option.value || option}">${option.label || option}</option>`
                ).join('');
                
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label for="${fieldId}" class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        <select class="form-control" id="${fieldId}" name="${field.name}" ${required}>
                            <option value="">Choose...</option>
                            ${options}
                        </select>
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'radio':
                const radioOptions = (field.options || []).map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${field.name}" 
                               id="${fieldId}_${index}" value="${option.value || option}" ${required}>
                        <label class="form-check-label" for="${fieldId}_${index}">
                            ${option.label || option}
                        </label>
                    </div>
                `).join('');
                
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        ${radioOptions}
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'checkbox':
                const checkboxOptions = (field.options || []).map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="${field.name}[]" 
                               id="${fieldId}_${index}" value="${option.value || option}">
                        <label class="form-check-label" for="${fieldId}_${index}">
                            ${option.label || option}
                        </label>
                    </div>
                `).join('');
                
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        ${checkboxOptions}
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'date':
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label for="${fieldId}" class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        <input type="date" class="form-control" id="${fieldId}" 
                               name="${field.name}" ${required} ${field.readonly ? 'readonly' : ''}>
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'file':
                fieldHtml = `
                    <div class="form-group mb-3">
                        <label for="${fieldId}" class="form-label">
                            ${field.label} ${requiredMark}
                        </label>
                        <input type="file" class="form-control" id="${fieldId}" 
                               name="${field.name}" ${field.accept ? `accept="${field.accept}"` : ''} 
                               ${field.multiple ? 'multiple' : ''} ${required}>
                        ${field.help ? `<small class="form-text text-muted">${field.help}</small>` : ''}
                    </div>
                `;
                break;
                
            case 'html':
                fieldHtml = `
                    <div class="form-group mb-3">
                        ${field.content || ''}
                    </div>
                `;
                break;
                
            default:
                fieldHtml = `
                    <div class="form-group mb-3">
                        <p class="text-muted">Unsupported field type: ${field.type}</p>
                    </div>
                `;
        }
        
        return fieldHtml;
    }
    
    /**
     * Navigate to next page
     */
    nextPage() {
        if (this.options.validateOnNext) {
            if (!this.validateCurrentPage()) {
                return false;
            }
        }
        
        this.updateFormData();
        
        if (this.currentPage < this.pages.length - 1) {
            this.showPage(this.currentPage + 1);
        }
        
        return true;
    }
    
    /**
     * Navigate to previous page
     */
    previousPage() {
        if (!this.options.allowBackNavigation) {
            return false;
        }
        
        if (this.currentPage > 0) {
            this.showPage(this.currentPage - 1);
        }
        
        return true;
    }
    
    /**
     * Show specific page
     */
    showPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) {
            return false;
        }
        
        // Hide current page
        $(this.container).find('.survey-page').hide();
        
        // Show target page
        $(this.container).find(`.survey-page[data-page-index="${pageIndex}"]`).show();
        
        this.currentPage = pageIndex;
        this.updateProgress();
        this.updateNavigation();
        
        // Trigger page change event
        $(this.container).trigger('pageChanged', {
            currentPage: this.currentPage,
            totalPages: this.pages.length,
            pageId: this.pages[this.currentPage].id
        });
        
        return true;
    }
    
    /**
     * Update progress bar and indicators
     */
    updateProgress() {
        if (this.options.showProgressBar) {
            const progress = ((this.currentPage + 1) / this.pages.length) * 100;
            $(this.container).find('.progress-bar').css('width', `${progress}%`);
            $(this.container).find('.progress-text').text(`Page ${this.currentPage + 1} of ${this.pages.length}`);
        }
        
        if (this.options.showPageNumbers) {
            $(this.container).find('.page-indicator').text(`${this.currentPage + 1} / ${this.pages.length}`);
        }
    }
    
    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const $prevBtn = $(this.container).find('.btn-prev');
        const $nextBtn = $(this.container).find('.btn-next');
        const $submitBtn = $(this.container).find('.btn-submit');
        
        // Previous button
        if (this.currentPage === 0 || !this.options.allowBackNavigation) {
            $prevBtn.prop('disabled', true);
        } else {
            $prevBtn.prop('disabled', false);
        }
        
        // Next/Submit button
        if (this.currentPage === this.pages.length - 1) {
            $nextBtn.hide();
            $submitBtn.show();
        } else {
            $nextBtn.show();
            $submitBtn.hide();
        }
    }
    
    /**
     * Validate current page
     */
    validateCurrentPage() {
        if (!this.validation) {
            return true;
        }
        
        const currentPageElement = $(this.container).find(`.survey-page[data-page-index="${this.currentPage}"]`)[0];
        
        // Create temporary validation instance for current page
        const pageValidation = new FormValidation(currentPageElement, {
            showErrorsInline: true,
            showErrorsSummary: true
        });
        
        // Copy rules for current page fields
        const currentPageFields = $(currentPageElement).find('input, select, textarea');
        currentPageFields.each((index, element) => {
            const fieldName = element.name || element.id;
            if (this.validation.rules[fieldName]) {
                pageValidation.addRule(fieldName, this.validation.rules[fieldName]);
            }
        });
        
        return pageValidation.validateForm();
    }
    
    /**
     * Update form data from current page
     */
    updateFormData() {
        const currentPageElement = $(this.container).find(`.survey-page[data-page-index="${this.currentPage}"]`);
        
        currentPageElement.find('input, select, textarea').each((index, element) => {
            const name = element.name || element.id;
            if (name) {
                this.formData[name] = this.getFieldValue(element);
            }
        });
        
        if (this.options.saveProgress) {
            this.saveProgress();
        }
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
                $(this.container).find(`input[name="${name}"]:checked`).each(function() {
                    values.push($(this).val());
                });
                return values;
            } else {
                return $element.is(':checked') ? $element.val() : '';
            }
        } else if ($element.is('input[type="radio"]')) {
            const name = $element.attr('name');
            return $(this.container).find(`input[name="${name}"]:checked`).val() || '';
        } else {
            return $element.val() || '';
        }
    }
    
    /**
     * Submit survey
     */
    submitSurvey() {
        // Validate all pages
        if (this.validation && !this.validateAllPages()) {
            return false;
        }
        
        this.updateFormData();
        
        // Trigger submit event
        $(this.container).trigger('surveySubmit', {
            formData: this.formData,
            pages: this.pages
        });
        
        return true;
    }
    
    /**
     * Validate all pages
     */
    validateAllPages() {
        let isValid = true;
        
        for (let i = 0; i < this.pages.length; i++) {
            const originalPage = this.currentPage;
            this.currentPage = i;
            
            if (!this.validateCurrentPage()) {
                isValid = false;
                // Show first invalid page
                if (isValid === false) {
                    this.showPage(i);
                    break;
                }
            }
            
            this.currentPage = originalPage;
        }
        
        return isValid;
    }
    
    /**
     * Save progress to localStorage
     */
    saveProgress() {
        if (!this.options.saveProgress) return;
        
        const progressData = {
            currentPage: this.currentPage,
            formData: this.formData,
            timestamp: new Date().toISOString()
        };
        
        const key = `survey_progress_${this.getSurveyId()}`;
        localStorage.setItem(key, JSON.stringify(progressData));
        
        this.showAutoSaveIndicator('saved');
    }
    
    /**
     * Load progress from localStorage
     */
    loadProgress() {
        if (!this.options.saveProgress) return;
        
        const key = `survey_progress_${this.getSurveyId()}`;
        const progressData = localStorage.getItem(key);
        
        if (progressData) {
            try {
                const data = JSON.parse(progressData);
                this.formData = data.formData || {};
                
                // Restore form values
                this.restoreFormValues();
                
                // Show saved page
                if (data.currentPage !== undefined) {
                    this.showPage(data.currentPage);
                }
                
                console.log('Progress loaded from', data.timestamp);
            } catch (error) {
                console.warn('Failed to load progress:', error);
            }
        }
    }
    
    /**
     * Restore form values from saved data
     */
    restoreFormValues() {
        Object.keys(this.formData).forEach(fieldName => {
            const value = this.formData[fieldName];
            const element = $(this.container).find(`[name="${fieldName}"]`);
            
            if (element.length > 0) {
                if (element.is('input[type="checkbox"]')) {
                    if (Array.isArray(value)) {
                        value.forEach(val => {
                            $(this.container).find(`input[name="${fieldName}"][value="${val}"]`).prop('checked', true);
                        });
                    } else {
                        element.prop('checked', element.val() === value);
                    }
                } else if (element.is('input[type="radio"]')) {
                    $(this.container).find(`input[name="${fieldName}"][value="${value}"]`).prop('checked', true);
                } else {
                    element.val(value);
                }
            }
        });
    }
    
    /**
     * Clear saved progress
     */
    clearProgress() {
        const key = `survey_progress_${this.getSurveyId()}`;
        localStorage.removeItem(key);
    }
    
    /**
     * Get survey ID for progress saving
     */
    getSurveyId() {
        return $(this.container).data('survey-id') || 'default';
    }
    
    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // Simple check - in a real implementation, you'd compare with last saved state
        return Object.keys(this.formData).length > 0;
    }
    
    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.updateFormData();
        }, this.options.autoSaveInterval);
    }
    
    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    /**
     * Show auto-save indicator
     */
    showAutoSaveIndicator(status) {
        const $indicator = $(this.container).find('.auto-save-indicator');
        const $status = $indicator.find('.save-status');
        
        $indicator.show();
        
        switch (status) {
            case 'saving':
                $status.text('Saving...');
                $indicator.removeClass('text-success').addClass('text-warning');
                break;
            case 'saved':
                $status.text('Saved');
                $indicator.removeClass('text-warning').addClass('text-success');
                setTimeout(() => {
                    $indicator.fadeOut();
                }, 2000);
                break;
            case 'error':
                $status.text('Save failed');
                $indicator.removeClass('text-warning text-success').addClass('text-danger');
                break;
        }
    }
    
    /**
     * Set conditional logic engine
     */
    setConditionalLogic(conditionalLogic) {
        this.conditionalLogic = conditionalLogic;
    }
    
    /**
     * Set validation engine
     */
    setValidation(validation) {
        this.validation = validation;
    }
    
    /**
     * Get current form data
     */
    getFormData() {
        this.updateFormData();
        return this.formData;
    }
    
    /**
     * Get current page info
     */
    getCurrentPageInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.pages.length,
            pageId: this.pages[this.currentPage]?.id,
            isFirstPage: this.currentPage === 0,
            isLastPage: this.currentPage === this.pages.length - 1
        };
    }
    
    /**
     * Destroy survey instance
     */
    destroy() {
        this.stopAutoSave();
        $(window).off('beforeunload');
        $(document).off('keydown');
        $(this.container).empty().removeClass('multi-page-survey');
    }
}
