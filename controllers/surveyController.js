const moment = require('moment');
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');
const googleSheetsService = require('../services/googleSheetsService');

const surveyController = {
    /**
     * Hiển thị form khảo sát công khai
     */
    getPublicSurvey: async (req, res) => {
        try {
            const surveySlug = req.params.slug;
            const errors = [];
            
            // Lấy thông tin cấu hình khảo sát
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                survey_url_slug: surveySlug,
                active: 1
            });
            
            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                return res.render("error", {
                    user: null,
                    message: "Khảo sát không tồn tại hoặc đã bị vô hiệu hóa",
                    status: 404
                });
            }
            
            const surveyConfig = configResponse.data[0];
            
            // Lấy thông tin dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id,
                active: 1
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: null,
                    message: "Dự án không tồn tại hoặc đã bị vô hiệu hóa",
                    status: 404
                });
            }
            
            const project = projectResponse.data[0];
            
            // Lấy danh sách các trường khảo sát
            const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                survey_config_id: surveyConfig.id,
                active: 1
            }, 'field_order ASC');
            
            const surveyFields = fieldsResponse.success ? fieldsResponse.data : [];
            
            // Parse field options và settings
            surveyFields.forEach(field => {
                if (field.field_options) {
                    try {
                        field.field_options = JSON.parse(field.field_options);
                    } catch (e) {
                        field.field_options = [];
                    }
                }

                if (field.validation_rules) {
                    try {
                        field.validation_rules = JSON.parse(field.validation_rules);
                    } catch (e) {
                        field.validation_rules = {};
                    }
                }

                if (field.field_settings) {
                    try {
                        field.field_settings = JSON.parse(field.field_settings);
                    } catch (e) {
                        field.field_settings = {};
                    }
                }

                if (field.conditional_logic) {
                    try {
                        field.conditional_logic = JSON.parse(field.conditional_logic);
                    } catch (e) {
                        field.conditional_logic = null;
                    }
                }

                // Convert is_required to boolean
                field.is_required = Boolean(field.is_required);
            });
            
            // Parse survey settings
            let surveySettings = {};
            if (surveyConfig.settings) {
                try {
                    surveySettings = JSON.parse(surveyConfig.settings);
                } catch (e) {
                    surveySettings = {};
                }
            }
            console.log("surveySettings", surveySettings);
            console.log("surveyFields", surveyFields);
            console.log("surveyConfig", surveyConfig);
            res.render('survey/public-form', {
                user: null,
                errors: errors,
                project: project,
                surveyConfig: surveyConfig,
                surveyFields: surveyFields,
                surveySettings: surveySettings,
                moment: moment
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error", {
                user: null,
                message: "Có lỗi xảy ra khi tải khảo sát",
                status: 500
            });
        }
    },

    /**
     * Xử lý submit form khảo sát công khai
     */
    submitPublicSurvey: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const surveySlug = req.params.slug;
            const formData = req.body;
            // Lấy thông tin cấu hình khảo sát
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                survey_url_slug: surveySlug,
                active: 1
            });
            
            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                resultData.message = 'Khảo sát không tồn tại hoặc đã bị vô hiệu hóa!';
                return res.json(resultData);
            }
            
            const surveyConfig = configResponse.data[0];
            
            // Lấy thông tin dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id,
                active: 1
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Dự án không tồn tại hoặc đã bị vô hiệu hóa!';
                return res.json(resultData);
            }
            
            const project = projectResponse.data[0];
            
            // Lấy danh sách các trường khảo sát
            const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                survey_config_id: surveyConfig.id,
                active: 1
            }, 'field_order ASC');
            
            if (!fieldsResponse.success || !fieldsResponse.data || fieldsResponse.data.length === 0) {
                resultData.message = 'Khảo sát chưa được cấu hình các trường!';
                return res.json(resultData);
            }
            
            const surveyFields = fieldsResponse.data;
            
            // Validate dữ liệu form
            const validationErrors = [];
            const responseData = [];
            
            for (const field of surveyFields) {
                const fieldValue = formData[field.field_name];
                
                // Kiểm tra required
                if (field.is_required && (!fieldValue || fieldValue.toString().trim() === '')) {
                    validationErrors.push(`${field.field_label} là bắt buộc`);
                    continue;
                }
                
                // Validate theo field type
                if (fieldValue && fieldValue.toString().trim() !== '') {
                    let validationRules = {};
                    if (field.validation_rules) {
                        try {
                            validationRules = JSON.parse(field.validation_rules);
                        } catch (e) {
                            validationRules = {};
                        }
                    }
                    
                    // Validate email
                    if (field.field_type === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(fieldValue)) {
                            validationErrors.push(`${field.field_label} không đúng định dạng email`);
                            continue;
                        }
                    }
                    
                    // Validate URL
                    if (field.field_type === 'url') {
                        try {
                            new URL(fieldValue);
                        } catch (e) {
                            validationErrors.push(`${field.field_label} không đúng định dạng URL`);
                            continue;
                        }
                    }
                    
                    // Validate min/max length
                    if (validationRules.minLength && fieldValue.length < validationRules.minLength) {
                        validationErrors.push(`${field.field_label} phải có ít nhất ${validationRules.minLength} ký tự`);
                        continue;
                    }
                    
                    if (validationRules.maxLength && fieldValue.length > validationRules.maxLength) {
                        validationErrors.push(`${field.field_label} không được vượt quá ${validationRules.maxLength} ký tự`);
                        continue;
                    }
                }
                
                // Chuẩn bị dữ liệu response
                let fieldValueJson = null;
                let fieldValueText = fieldValue;
                
                // Xử lý multiselect và checkbox
                if (['multiselect', 'checkbox'].includes(field.field_type) && Array.isArray(fieldValue)) {
                    fieldValueJson = JSON.stringify(fieldValue);
                    fieldValueText = fieldValue.join(', ');
                } else if (typeof fieldValue === 'object') {
                    fieldValueJson = JSON.stringify(fieldValue);
                    fieldValueText = JSON.stringify(fieldValue);
                }
                
                responseData.push({
                    survey_field_id: field.id,
                    field_name: field.field_name,
                    field_value: fieldValueText,
                    field_value_json: fieldValueJson
                });
            }
            
            if (validationErrors.length > 0) {
                resultData.message = validationErrors.join(', ');
                return res.json(resultData);
            }
            
            // Không cần kiểm tra email và multiple responses vì không thu thập email
            
            // Tạo survey response (đã loại bỏ email và IP address)
            const surveyResponseData = {
                survey_config_id: surveyConfig.id,
                respondent_email: null, // Không thu thập email
                respondent_ip: null, // Không thu thập IP address
                user_agent: req.get('User-Agent'),
                session_id: req.sessionID,
                is_completed: 1,
                submitted_at: new Date(),
                metadata: JSON.stringify({
                    referrer: req.get('Referrer'),
                    user_agent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                })
            };
            
            const responseResult = await commonService.addRecordTable(surveyResponseData, 'survey_responses', true);
            
            if (!responseResult.success || !responseResult.data) {
                resultData.message = 'Có lỗi xảy ra khi lưu phản hồi!';
                return res.json(resultData);
            }
            
            const surveyResponseId = responseResult.data.insertId;
            
            // Lưu chi tiết response data
            for (const data of responseData) {
                data.survey_response_id = surveyResponseId;
                await commonService.addRecordTable(data, 'survey_response_data', false);
            }
            // Lưu vào SQLite database
            if (project.sqlite_db_path) {
                try {
                    const sqliteService = require('../services/sqliteService');
                    await sqliteService.saveSurveyResponse(
                        project.sqlite_db_path,
                        surveyResponseData,
                        responseData
                    );
                    console.log(`✓ Survey response saved to SQLite: ${project.sqlite_db_path}`);
                } catch (sqliteError) {
                    console.warn('Warning: Could not save to SQLite:', sqliteError.message);
                    // Không block submit nếu SQLite fail
                }
            }
            
            // Lưu vào Google Sheets
            if (project.google_sheet_id) {
                try {
                    const sheetData = googleSheetsService.prepareSurveyDataForSheet(
                        { ...surveyResponseData, id: surveyResponseId },
                        surveyFields,
                        responseData
                    );
                    
                    const sheetResult = await googleSheetsService.appendRowToSheet(
                        project.google_sheet_id,
                        sheetData,
                        ['ID', ...surveyFields.map(f => f.field_label), 'Thời gian gửi']
                    );
                    
                    if (sheetResult.success) {
                        // Cập nhật row ID trong database
                        await commonService.updateRecordTable(
                            { google_sheet_row_id: sheetResult.rowIndex },
                            { id: surveyResponseId },
                            'survey_responses'
                        );
                    }
                } catch (sheetError) {
                    console.warn('Warning: Could not save to Google Sheets:', sheetError.message);
                    // Vẫn cho phép submit thành công mà không cần Google Sheets
                }
            }
            
            resultData.success = true;
            resultData.message = surveyConfig.success_message || 'Cảm ơn bạn đã tham gia khảo sát!';
            resultData.data = { responseId: surveyResponseId };
            
            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    }
};

module.exports = surveyController;
