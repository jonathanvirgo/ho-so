/**
 * Survey System JavaScript
 * Handles project management, survey configuration, and public survey forms
 */

// Global variables
let currentProject = null;
let currentSurveyConfig = null;
let surveyFields = [];
let fieldCounter = 0;

// Initialize when document is ready
$(document).ready(function() {
    initializeSurveySystem();
});

/**
 * Initialize the survey system
 */
function initializeSurveySystem() {
    // Initialize DataTables if present
    if (typeof initializeDataTable === 'function') {
        initializeDataTable();
    }
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize field configuration if on config page
    if ($('#field-config-container').length > 0) {
        initializeFieldConfiguration();
    }
    
    // Initialize public survey form if present
    if ($('#public-survey-form').length > 0) {
        initializePublicSurveyForm();
    }
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
    // Project form submission
    $('#project-form').on('submit', function(e) {
        e.preventDefault();
        submitProjectForm();
    });
    
    // Survey config form submission
    $('#survey-config-form').on('submit', function(e) {
        console.log('submitting survey config form');
        e.preventDefault();
        submitSurveyConfigForm();
    });
    
    // Field config form submission
    $('#field-config-form').on('submit', function(e) {
        e.preventDefault();
        saveFieldConfiguration();
    });
}

/**
 * Submit project form
 */
function submitProjectForm() {
    const form = $('#project-form');
    const submitBtn = form.find('button[type="submit"]');
    const originalText = submitBtn.html();
    
    // Show loading
    submitBtn.html('<span class="loading-spinner"></span> Đang xử lý...').prop('disabled', true);
    
    const formData = {
        name: $('#project-name').val(),
        description: $('#project-description').val(),
        status: $('#project-status').val(),
        start_date: $('#project-start-date').val(),
        end_date: $('#project-end-date').val()
    };
    
    // Add ID if editing
    const projectId = $('#project-id').val();
    if (projectId) {
        formData.id = projectId;
    }
    
    const url = projectId ? '/projects/update' : '/projects/create';
    
    $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: response.message,
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    if (!projectId) {
                        // Redirect to project list after creating
                        window.location.href = '/projects';
                    } else {
                        // Reload page after editing
                        window.location.reload();
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: response.message
                });
            }
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Có lỗi xảy ra khi xử lý yêu cầu'
            });
        },
        complete: function() {
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
}

/**
 * Submit survey config form
 */
function submitSurveyConfigForm() {
    const form = $('#survey-config-form');
    const submitBtn = form.find('button[type="submit"]');
    const originalText = submitBtn.html();
    
    // Show loading
    submitBtn.html('<span class="loading-spinner"></span> Đang xử lý...').prop('disabled', true);
    
    const formData = {
        project_id: $('#project-id').val(),
        name: $('#survey-name').val(),
        description: $('#survey-description').val(),
        survey_url_slug: $('#survey-url-slug').val(),
        active: $('#survey-is-active').val(),
        allow_multiple_responses: $('#allow-multiple-responses').is(':checked') ? 1 : 0,
        require_email: $('#require-email').is(':checked') ? 1 : 0,
        success_message: $('#success-message').val()
    };
    
    // Add ID if editing
    const surveyConfigId = $('#survey-config-id').val();
    console.log('formData', formData, surveyConfigId);
    if (surveyConfigId) {
        formData.id = surveyConfigId;
    }
    
    const url = surveyConfigId ? '/survey-configs/update' : '/survey-configs/create';
    $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: response.message,
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    if (!surveyConfigId) {
                        // Redirect to config fields after creating
                        window.location.href = `/survey-configs/${response.data.id}/fields`;
                    } else {
                        // Reload page after editing
                        window.location.reload();
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: response.message
                });
            }
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Có lỗi xảy ra khi xử lý yêu cầu'
            });
        },
        complete: function() {
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
}

/**
 * Initialize field configuration
 */
function initializeFieldConfiguration() {
    // Load existing fields
    loadExistingFields();
    
    // Add field button
    $('#add-field-btn').on('click', function() {
        addNewField();
    });
    
    // Make fields sortable
    $('#fields-container').sortable({
        handle: '.field-drag-handle',
        placeholder: 'field-placeholder',
        update: function() {
            updateFieldOrder();
        }
    });
}

/**
 * Load existing fields
 */
function loadExistingFields() {
    const existingFields = window.surveyFields || [];
    surveyFields = existingFields;
    
    existingFields.forEach(function(field, index) {
        addFieldToContainer(field, index);
    });
    
    fieldCounter = existingFields.length;
}

/**
 * Add new field
 */
function addNewField() {
    const newField = {
        field_name: `field_${fieldCounter + 1}`,
        field_label: 'Trường mới',
        field_type: 'text',
        is_required: false,
        placeholder: '',
        help_text: '',
        field_options: [],
        validation_rules: {},
        field_settings: {}
    };
    
    surveyFields.push(newField);
    addFieldToContainer(newField, fieldCounter);
    fieldCounter++;
}

/**
 * Add field to container
 */
function addFieldToContainer(field, index) {
    const fieldHtml = generateFieldHtml(field, index);
    $('#fields-container').append(fieldHtml);
    
    // Initialize field handlers
    initializeFieldHandlers(index);
}

/**
 * Generate field HTML
 */
function generateFieldHtml(field, index) {
    return `
        <div class="field-item" data-index="${index}" data-id="${field.id || ''}">
            <div class="field-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Tên trường</label>
                        <input type="text" class="form-control field-name" value="${field.field_name}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Nhãn hiển thị</label>
                        <input type="text" class="form-control field-label" value="${field.field_label}" required>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Loại trường</label>
                <select class="form-control field-type">
                    <option value="text" ${field.field_type === 'text' ? 'selected' : ''}>Text</option>
                    <option value="textarea" ${field.field_type === 'textarea' ? 'selected' : ''}>Textarea</option>
                    <option value="select" ${field.field_type === 'select' ? 'selected' : ''}>Select</option>
                    <option value="multiselect" ${field.field_type === 'multiselect' ? 'selected' : ''}>Multi Select</option>
                    <option value="radio" ${field.field_type === 'radio' ? 'selected' : ''}>Radio</option>
                    <option value="checkbox" ${field.field_type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                    <option value="datetime" ${field.field_type === 'datetime' ? 'selected' : ''}>Date Time</option>
                    <option value="date" ${field.field_type === 'date' ? 'selected' : ''}>Date</option>
                    <option value="email" ${field.field_type === 'email' ? 'selected' : ''}>Email</option>
                    <option value="number" ${field.field_type === 'number' ? 'selected' : ''}>Number</option>
                </select>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Placeholder</label>
                        <input type="text" class="form-control field-placeholder" value="${field.placeholder || ''}">
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>
                            <input type="checkbox" class="field-required" ${field.is_required ? 'checked' : ''}>
                            Bắt buộc
                        </label>
                    </div>
                </div>
                <!-- Field Group đã được loại bỏ để đơn giản hóa hệ thống -->
            </div>
            
            <div class="form-group">
                <label>Text hướng dẫn</label>
                <textarea class="form-control field-help-text" rows="2">${field.help_text || ''}</textarea>
            </div>

            <!-- Conditional Logic đã được loại bỏ để đơn giản hóa hệ thống -->
            
            <div class="field-options-container" style="display: ${['select', 'multiselect', 'radio', 'checkbox'].includes(field.field_type) ? 'block' : 'none'}">
                <label>Tùy chọn</label>
                <div class="options-list">
                    ${generateOptionsHtml(field.field_options || [])}
                </div>
                <button type="button" class="btn btn-sm btn-success add-option-btn">
                    <i class="fas fa-plus"></i> Thêm tùy chọn
                </button>
            </div>
            
            <div class="mt-3">
                <button type="button" class="btn btn-sm btn-danger remove-field-btn">
                    <i class="fas fa-trash"></i> Xóa trường
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate options HTML
 */
function generateOptionsHtml(options) {
    if (!Array.isArray(options)) return '';
    
    return options.map(option => `
        <div class="option-item">
            <input type="text" class="form-control option-value" placeholder="Giá trị" value="${option.value || ''}">
            <input type="text" class="form-control option-label" placeholder="Nhãn hiển thị" value="${option.label || ''}">
            <button type="button" class="btn btn-sm btn-danger option-remove-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Initialize field handlers
 */
function initializeFieldHandlers(index) {
    const fieldItem = $(`.field-item[data-index="${index}"]`);

    // Auto-generate field name from label
    fieldItem.find('.field-label').on('input', function() {
        const label = $(this).val();
        const fieldName = generateFieldNameFromLabel(label);
        fieldItem.find('.field-name').val(fieldName);
    });

    // Field type change
    fieldItem.find('.field-type').on('change', function() {
        const fieldType = $(this).val();
        const optionsContainer = fieldItem.find('.field-options-container');

        if (['select', 'multiselect', 'radio', 'checkbox'].includes(fieldType)) {
            optionsContainer.show();
        } else {
            optionsContainer.hide();
        }
    });
    
    // Add option
    fieldItem.find('.add-option-btn').on('click', function() {
        const optionsList = fieldItem.find('.options-list');
        const newOptionHtml = `
            <div class="option-item">
                <input type="text" class="form-control option-value" placeholder="Giá trị">
                <input type="text" class="form-control option-label" placeholder="Nhãn hiển thị">
                <button type="button" class="btn btn-sm btn-danger option-remove-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        optionsList.append(newOptionHtml);
        
        // Bind remove handler
        optionsList.find('.option-remove-btn').last().on('click', function() {
            $(this).closest('.option-item').remove();
        });
    });
    
    // Remove option
    fieldItem.find('.option-remove-btn').on('click', function() {
        $(this).closest('.option-item').remove();
    });
    
    // Remove field
    fieldItem.find('.remove-field-btn').on('click', function() {
        Swal.fire({
            title: 'Xác nhận xóa?',
            text: 'Bạn có chắc chắn muốn xóa trường này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/survey-fields/' + fieldItem.attr('data-id'),
                    method: 'DELETE',
                    data: {},
                    success: function(response) {
                        if (response.success) {
                            fieldItem.remove();
                            updateFieldOrder();
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi!',
                                text: response.message
                            });
                        }
                    },      
                    error: function() {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: 'Có lỗi xảy ra khi xóa trường'
                        });
                    }
                });

            }
        });
    });
}

/**
 * Update field order
 */
function updateFieldOrder() {
    $('#fields-container .field-item').each(function(index) {
        $(this).attr('data-index', index);
    });
}

/**
 * Save field configuration
 */
function saveFieldConfiguration() {
    const fields = [];
    
    $('#fields-container .field-item').each(function() {
        const fieldItem = $(this);
        
        // Get field options
        const options = [];
        fieldItem.find('.option-item').each(function() {
            const optionValue = $(this).find('.option-value').val();
            const optionLabel = $(this).find('.option-label').val();
            
            if (optionValue && optionLabel) {
                options.push({
                    value: optionValue,
                    label: optionLabel
                });
            }
        });
        
        // Get conditional logic
        const conditionalLogic = {};
        const conditionalField = fieldItem.find('.conditional-field').val();
        if (conditionalField) {
            conditionalLogic.field = conditionalField;
            conditionalLogic.operator = fieldItem.find('.conditional-operator').val();
            conditionalLogic.value = fieldItem.find('.conditional-value').val();
        }

        const field = {
            field_name: fieldItem.find('.field-name').val(),
            field_label: fieldItem.find('.field-label').val(),
            field_type: fieldItem.find('.field-type').val(),
            is_required: fieldItem.find('.field-required').is(':checked'),
            placeholder: fieldItem.find('.field-placeholder').val(),
            help_text: fieldItem.find('.field-help-text').val(),
            field_group: null, // Đã loại bỏ field group
            field_options: options,
            validation_rules: {},
            field_settings: {},
            conditional_logic: Object.keys(conditionalLogic).length > 0 ? conditionalLogic : null
        };
        
        fields.push(field);
    });
    console.log('fields', fields);
    const submitBtn = $('#save-fields-btn');
    const originalText = submitBtn.html();
    
    // Show loading
    submitBtn.html('<span class="loading-spinner"></span> Đang lưu...').prop('disabled', true);
    
    $.ajax({
        url: '/survey-configs/save-fields',
        method: 'POST',
        data: {
            survey_config_id: $('#survey-config-id').val(),
            fields: fields
        },
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: response.message,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: response.message
                });
            }
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Có lỗi xảy ra khi lưu cấu hình'
            });
        },
        complete: function() {
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
}

/**
 * Initialize public survey form
 */
function initializePublicSurveyForm() {
    // Initialize Virtual Select for multiselect fields
    $('.virtual-select').each(function() {
        VirtualSelect.init({
            ele: this,
            placeholder: $(this).data('placeholder') || 'Chọn...',
            search: true,
            multiple: $(this).hasClass('multiple')
        });
    });

    // Initialize Flatpickr for date/datetime fields
    $('.flatpickr-date').each(function() {
        flatpickr(this, {
            dateFormat: "d/m/Y",
            locale: "vn"
        });
    });

    $('.flatpickr-datetime').each(function() {
        flatpickr(this, {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            locale: "vn"
        });
    });

    // Handle radio and checkbox styling
    $('.radio-option, .checkbox-option').on('click', function() {
        const input = $(this).find('input');

        if (input.attr('type') === 'radio') {
            // Unselect other radio options in the same group
            $(`input[name="${input.attr('name')}"]`).closest('.radio-option').removeClass('selected');
            $(this).addClass('selected');
        } else if (input.attr('type') === 'checkbox') {
            $(this).toggleClass('selected');
        }
    });

    // Handle conditional logic
    initializeConditionalLogic();

    // Handle form submission
    $('#public-survey-form').on('submit', function(e) {
        e.preventDefault();
        submitPublicSurvey();
    });
}

/**
 * Submit public survey
 */
function submitPublicSurvey() {
    const form = $('#public-survey-form');
    const submitBtn = form.find('button[type="submit"]');
    const originalText = submitBtn.html();

    // Prevent double submission
    if (submitBtn.prop('disabled')) {
        return false;
    }

    // Show loading
    submitBtn.html('<span class="loading-spinner"></span> Đang gửi...').prop('disabled', true);

    // Collect form data
    const formData = {};

    form.find('input, textarea, select').each(function() {
        const field = $(this);
        const name = field.attr('name');

        if (!name) return;

        if (field.attr('type') === 'checkbox') {
            if (!formData[name]) formData[name] = [];
            if (field.is(':checked')) {
                formData[name].push(field.val());
            }
        } else if (field.attr('type') === 'radio') {
            if (field.is(':checked')) {
                formData[name] = field.val();
            }
        } else if (field.hasClass('virtual-select')) {
            // Handle Virtual Select
            const vsInstance = field[0].virtualSelect;
            if (vsInstance) {
                formData[name] = vsInstance.getSelectedValues();
            }
        } else {
            formData[name] = field.val();
        }
    });

    const surveySlug = window.location.pathname.split('/').pop();
    console.log('formData', formData);
    $.ajax({
        url: `/survey/${surveySlug}/submit`,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                // Show success message
                showSurveySuccess(response.message);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: response.message
                });
                submitBtn.html(originalText).prop('disabled', false);
            }
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Có lỗi xảy ra khi gửi khảo sát'
            });
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
}

/**
 * Initialize conditional logic for survey fields
 */
function initializeConditionalLogic() {
    // Get all fields with conditional logic from window.surveyFields
    if (typeof window.surveyFields !== 'undefined') {
        window.surveyFields.forEach(field => {
            if (field.conditional_logic && field.conditional_logic.field) {
                const targetField = $(`[name="${field.field_name}"]`).closest('.survey-field');
                const sourceField = $(`[name="${field.conditional_logic.field}"]`);

                if (targetField.length && sourceField.length) {
                    // Initially hide the conditional field
                    targetField.hide();

                    // Add change event to source field
                    sourceField.on('change input', function() {
                        checkConditionalLogic(field, targetField, sourceField);
                    });

                    // Check initial state
                    checkConditionalLogic(field, targetField, sourceField);
                }
            }
        });
    }
}

/**
 * Check conditional logic for a field
 */
function checkConditionalLogic(field, targetField, sourceField) {
    const sourceValue = getFieldValue(sourceField);
    const condition = field.conditional_logic;
    let shouldShow = false;

    switch (condition.operator) {
        case 'equals':
            shouldShow = sourceValue === condition.value;
            break;
        case 'not_equals':
            shouldShow = sourceValue !== condition.value;
            break;
        case 'contains':
            shouldShow = sourceValue && sourceValue.toString().includes(condition.value);
            break;
        case 'not_contains':
            shouldShow = !sourceValue || !sourceValue.toString().includes(condition.value);
            break;
    }

    if (shouldShow) {
        targetField.slideDown();
    } else {
        targetField.slideUp();
        // Clear value when hidden
        clearFieldValue(targetField);
    }
}

/**
 * Get field value based on field type
 */
function getFieldValue(field) {
    if (field.attr('type') === 'radio') {
        return field.filter(':checked').val() || '';
    } else if (field.attr('type') === 'checkbox') {
        const values = [];
        field.filter(':checked').each(function() {
            values.push($(this).val());
        });
        return values.join(',');
    } else {
        return field.val() || '';
    }
}

/**
 * Clear field value
 */
function clearFieldValue(fieldContainer) {
    fieldContainer.find('input, textarea, select').each(function() {
        const field = $(this);
        if (field.attr('type') === 'checkbox' || field.attr('type') === 'radio') {
            field.prop('checked', false);
        } else {
            field.val('');
        }
    });
}

/**
 * Show survey success message
 */
function showSurveySuccess(message) {
    const successHtml = `
        <div class="survey-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Cảm ơn bạn!</h2>
            <p>${message}</p>
        </div>
    `;

    $('.survey-body').html(successHtml);
}

/**
 * Utility functions
 */

// Generate field name from label
function generateFieldNameFromLabel(label) {
    if (!label) return '';

    return label
        .toLowerCase()
        .trim()
        // Remove Vietnamese accents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace special characters with underscore
        .replace(/[^a-z0-9\s]/g, '')
        // Replace spaces with underscore
        .replace(/\s+/g, '_')
        // Remove multiple underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_|_$/g, '')
        // Ensure it starts with letter if it doesn't
        .replace(/^(\d)/, 'field_$1')
        // Limit length
        .substring(0, 50);
}

// Copy survey link to clipboard
function copyLink(url) {
    navigator.clipboard.writeText(url).then(function() {
        Swal.fire({
            icon: 'success',
            title: 'Đã sao chép!',
            text: 'Link khảo sát đã được sao chép vào clipboard',
            timer: 2000,
            showConfirmButton: false
        });
    }).catch(function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        Swal.fire({
            icon: 'success',
            title: 'Đã sao chép!',
            text: 'Link khảo sát đã được sao chép vào clipboard',
            timer: 2000,
            showConfirmButton: false
        });
    });
}

// Edit project
function editProject(id) {
    window.location.href = `/projects/${id}/edit`;
}

// View surveys
function viewSurveys(projectId) {
    window.location.href = `/projects/${projectId}/surveys`;
}

// Delete project
function deleteProject(id) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Bạn có chắc chắn muốn xóa dự án này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/projects/${id}/delete`,
                method: 'POST',
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: response.message,
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            // Reload DataTable
                            if (typeof table !== 'undefined' && table.ajax) {
                                table.ajax.reload();
                            } else {
                                window.location.reload();
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: response.message
                        });
                    }
                },
                error: function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'Có lỗi xảy ra khi xóa dự án'
                    });
                }
            });
        }
    });
}

// Edit survey config
function editSurveyConfig(id) {
    window.location.href = `/survey-configs/${id}/edit`;
}

// Config fields
function configFields(id) {
    window.location.href = `/survey-configs/${id}/fields`;
}

// View responses
function viewResponses(id) {
    window.location.href = `/survey-configs/${id}/responses`;
}

// Delete survey config
function deleteSurveyConfig(id) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Bạn có chắc chắn muốn xóa cấu hình khảo sát này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/survey-configs/${id}/delete`,
                method: 'POST',
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: response.message,
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            // Reload DataTable
                            if (typeof table !== 'undefined' && table.ajax) {
                                table.ajax.reload();
                            } else {
                                window.location.reload();
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: response.message
                        });
                    }
                },
                error: function() {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'Có lỗi xảy ra khi xóa cấu hình khảo sát'
                    });
                }
            });
        }
    });
}
