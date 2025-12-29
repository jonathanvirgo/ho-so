const moment = require('moment');
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');
const googleSheetsService = require('../services/googleSheetsService');

const surveyConfigController = {
    /**
     * Hiển thị danh sách cấu hình khảo sát của dự án
     */
    getList: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const errors = [];
            
            // Kiểm tra dự án tồn tại và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập dự án này",
                    status: 403
                });
            }
            
            res.render('survey-configs/index', {
                user: user,
                errors: errors,
                project: project,
                moment: moment
            });
        } catch (error) {
            console.error('Error in surveyConfigController.getList:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * API lấy danh sách cấu hình khảo sát cho DataTable
     */
    getListTable: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            
            // Order mặc định
            const defaultOrder = [
                { column: 'id', dir: 'DESC' }
            ];
            
            // Cấu hình DataTable
            const config = {
                table: 'survey_configs',
                columns: ['id', 'name', 'description', 'survey_url_slug', 'active', 'created_at'],
                primaryKey: 'id',
                active: -1,
                activeOperator: '!=',
                filters: {
                    project_id: projectId,
                    ...securityService.applyRoleBasedFiltering(user, {})
                },
                searchColumns: ['name', 'description', 'survey_url_slug'],
                columnsMapping: [
                    '', // checkbox column
                    'name',
                    'description',
                    'survey_url_slug',
                    'active',
                    'created_at',
                    '' // action column
                ],
                defaultOrder: defaultOrder,
                checkRole: false
            };
            
            // Gọi service xử lý DataTable
            await dataTableService.handleDataTableRequest(req, res, config, (data) => {
                // Format dữ liệu cho hiển thị
                return data.map(config => {
                    const statusText = config.active === 1 ? 'Hoạt động' : 'Tạm dừng';
                    const statusClass = config.active === 1 ? 'success' : 'warning';
                    
                    const surveyUrl = `${req.protocol}://${req.get('host')}/survey/${config.survey_url_slug}`;
                    
                    return [
                        `<input type="checkbox" class="select-row" value="${config.id}">`,
                        config.name,
                        config.description || '',
                        `<a href="${surveyUrl}" target="_blank" class="text-primary">${config.survey_url_slug}</a>`,
                        `<span class="badge badge-${statusClass}">${statusText}</span>`,
                        moment(config.created_at).format('DD/MM/YYYY HH:mm'),
                        `<div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="editSurveyConfig(${config.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="formBuilder(${config.id})" title="Form Builder">
                                <i class="fas fa-tools"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="configFields(${config.id})" title="Configure Fields">
                                <i class="fas fa-cogs"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="viewResponses(${config.id})" title="View Responses">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="copyLink('${surveyUrl}')" title="Copy Link">
                                <i class="fas fa-link"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSurveyConfig(${config.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>`
                    ];
                });
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra khi tải dữ liệu!"));
        }
    },

    /**
     * Hiển thị form tạo cấu hình khảo sát mới
     */
    getCreate: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const errors = [];
            
            // Kiểm tra dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập dự án này",
                    status: 403
                });
            }
            
            res.render('survey-configs/create', {
                user: user,
                errors: errors,
                project: project,
                surveyConfig: {},
                moment: moment
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },

    /**
     * Tạo cấu hình khảo sát mới
     */
    create: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const user = req.user;
            const projectId = req.body.project_id;
            
            // Validation rules
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên khảo sát!" },
                { field: "survey_url_slug", type: "string", required: true, message: "Vui lòng nhập slug URL!" },
                { field: "description", type: "string", required: false }
            ];
            
            const parameter = {
                project_id: projectId,
                name: req.body.name,
                description: req.body.description || null,
                survey_url_slug: req.body.survey_url_slug,
                active: parseInt(req.body.active) || 1,
                allow_multiple_responses: 1, // Luôn cho phép multiple responses vì không có email để track
                require_email: 0, // Không yêu cầu email
                success_message: req.body.success_message || 'Cảm ơn bạn đã tham gia khảo sát!',
                settings: req.body.settings ? JSON.stringify(req.body.settings) : null,
                created_by: user.id,
                campaign_id: user.campaign_id
            };
            
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
            
            // Kiểm tra dự án tồn tại và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền tạo khảo sát cho dự án này!';
                return res.json(resultData);
            }
            
            // Kiểm tra slug URL đã tồn tại
            const existingSlug = await commonService.getAllDataTable('survey_configs', {
                survey_url_slug: parameter.survey_url_slug
            });
            
            if (existingSlug.success && existingSlug.data && existingSlug.data.length > 0) {
                resultData.message = 'Slug URL đã tồn tại!';
                return res.json(resultData);
            }
            
            // Tạo cấu hình khảo sát
            const response = await commonService.addRecordTable(parameter, 'survey_configs', true);
            
            if (response.success && response.data) {
                resultData.success = true;
                resultData.message = 'Tạo cấu hình khảo sát thành công!';
                resultData.data = { id: response.data.insertId };
            } else {
                resultData.message = response.message || 'Có lỗi xảy ra khi tạo cấu hình khảo sát!';
            }
            
            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Hiển thị trang cấu hình các trường khảo sát
     */
    getFieldsConfig: async (req, res) => {
        try {
            const user = req.user;
            const surveyConfigId = req.params.id;
            const errors = [];

            // Lấy thông tin cấu hình khảo sát
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });
            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy cấu hình khảo sát",
                    status: 404
                });
            }

            const surveyConfig = configResponse.data[0];

            // Lấy thông tin dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập",
                    status: 403
                });
            }

            // Lấy danh sách các trường khảo sát
            const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                survey_config_id: surveyConfigId,
                active: 1
            }, 'field_order ASC');

            const surveyFields = fieldsResponse.success ? fieldsResponse.data : [];

            res.render('survey-configs/fields-config', {
                user: user,
                errors: errors,
                project: project,
                surveyConfig: surveyConfig,
                surveyFields: surveyFields,
                moment: moment,
                req: req
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },

    /**
     * Lưu cấu hình các trường khảo sát
     */
    saveFieldsConfig: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const surveyConfigId = req.body.survey_config_id;
            const fields = req.body.fields || [];

            // Kiểm tra cấu hình khảo sát tồn tại và quyền truy cập
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const surveyConfig = configResponse.data[0];

            // Kiểm tra quyền truy cập dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền chỉnh sửa!';
                return res.json(resultData);
            }
            await commonService.deleteRecordTable('survey_fields', { survey_config_id: surveyConfigId, active: -1 });
            // Xóa mềm tất cả các trường cũ trước khi thêm mới
            await commonService.updateRecordTable(
                { active: -1, updated_at: new Date() },
                { survey_config_id: surveyConfigId },
                'survey_fields'
            ).then(responseData => {
                console.log('responseData updateRecordTable', responseData);
            });

            // Kiểm tra field names unique trong request
            const fieldNames = fields.map(f => f.field_name);
            const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
            if (duplicateNames.length > 0) {
                resultData.message = `Tên trường bị trùng lặp: ${duplicateNames.join(', ')}`;
                return res.json(resultData);
            }
            console.log('fields', fields);
            // Thêm các trường mới
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];

                const fieldData = {
                    survey_config_id: surveyConfigId,
                    field_name: field.field_name,
                    field_label: field.field_label,
                    field_type: field.field_type,
                    field_options: field.field_options ? JSON.stringify(field.field_options) : null,
                    is_required: field.is_required && field.is_required === 'true' ? 1 : 0,
                    placeholder: field.placeholder || null,
                    help_text: field.help_text || null,
                    validation_rules: field.validation_rules ? JSON.stringify(field.validation_rules) : null,
                    field_order: i + 1,
                    active: 1,
                    field_settings: field.field_settings ? JSON.stringify(field.field_settings) : null,
                    created_by: user.id,
                    created_at: new Date()
                };
                console.log('fieldData', fieldData);
                try {
                    await commonService.addRecordTable(fieldData, 'survey_fields', false).then(responseData => {
                        console.log('responseData', responseData);
                    });
                } catch (error) {
                    if (error.message.includes('Duplicate entry')) {
                        resultData.message = `Tên trường "${field.field_name}" đã tồn tại trong khảo sát này!`;
                        return res.json(resultData);
                    }
                    throw error;
                }
            }

            // Cập nhật headers trong Google Sheet nếu có
            if (project.google_sheet_id) {
                try {
                    await googleSheetsService.updateSheetHeaders(project.google_sheet_id, fields);
                } catch (sheetError) {
                    console.warn('Warning: Could not update Google Sheet headers:', sheetError.message);
                }
            }

            resultData.success = true;
            resultData.message = 'Lưu cấu hình trường thành công!';

            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Lấy danh sách template khảo sát
     */
    getTemplates: async (req, res) => {
        try {
            const user = req.user;

            // Lấy templates public và của user
            const templatesResponse = await commonService.getAllDataTable('survey_templates', {
                active: 1,
                $or: [
                    { is_public: 1 },
                    { created_by: user.id }
                ]
            }, 'usage_count DESC, created_at DESC');

            const templates = templatesResponse.success ? templatesResponse.data : [];

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra khi tải templates!"));
        }
    },

    /**
     * Hiển thị form chỉnh sửa cấu hình khảo sát
     */
    getEdit: async (req, res) => {
        try {
            const user = req.user;
            const surveyConfigId = req.params.id;
            const errors = [];

            // Lấy thông tin survey config
            const surveyConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!surveyConfigResponse.success || !surveyConfigResponse.data || surveyConfigResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy cấu hình khảo sát",
                    status: 404
                });
            }

            const surveyConfig = surveyConfigResponse.data[0];

            // Lấy thông tin project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }

            const project = projectResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập dự án này",
                    status: 403
                });
            }

            res.render('survey-configs/edit', {
                user: user,
                errors: errors,
                surveyConfig: surveyConfig,
                project: project,
                moment: moment
            });
        } catch (error) {
            console.error('Error in surveyConfigController.getEdit:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * Cập nhật cấu hình khảo sát
     */
    update: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const parameter = req.body;

            // Validate required fields
            if (!parameter.id) {
                resultData.message = 'ID cấu hình khảo sát không được để trống!';
                return res.json(resultData);
            }

            if (!parameter.name || parameter.name.trim() === '') {
                resultData.message = 'Tên khảo sát không được để trống!';
                return res.json(resultData);
            }

            // Lấy thông tin survey config hiện tại
            const currentConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: parameter.id
            });

            if (!currentConfigResponse.success || !currentConfigResponse.data || currentConfigResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const currentConfig = currentConfigResponse.data[0];

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: currentConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền cập nhật khảo sát này!';
                return res.json(resultData);
            }

            // Kiểm tra slug URL đã tồn tại (nếu thay đổi)
            if (parameter.survey_url_slug && parameter.survey_url_slug !== currentConfig.survey_url_slug) {
                const existingSlug = await commonService.getAllDataTable('survey_configs', {
                    survey_url_slug: parameter.survey_url_slug
                });

                if (existingSlug.success && existingSlug.data && existingSlug.data.length > 0) {
                    const existing = existingSlug.data.find(item => item.id != parameter.id);
                    if (existing) {
                        resultData.message = 'URL slug đã tồn tại, vui lòng chọn slug khác!';
                        return res.json(resultData);
                    }
                }
            }

            // Chuẩn bị dữ liệu cập nhật
            const updateData = {
                name: parameter.name.trim(),
                description: parameter.description || '',
                survey_url_slug: parameter.survey_url_slug || '',
                allow_multiple_responses: parameter.allow_multiple_responses ? 1 : 0,
                require_email: parameter.require_email ? 1 : 0,
                success_message: parameter.success_message || 'Cảm ơn bạn đã tham gia khảo sát!',
                updated_at: new Date()
            };

            // Cập nhật survey config
            const response = await commonService.updateRecordTable(updateData, { id: parameter.id }, 'survey_configs');

            if (response.success) {
                resultData.success = true;
                resultData.message = 'Cập nhật cấu hình khảo sát thành công!';
                resultData.data = { id: parameter.id };
            } else {
                resultData.message = response.message || 'Có lỗi xảy ra khi cập nhật!';
            }

            res.json(resultData);
        } catch (error) {
            console.error('Error in surveyConfigController.update:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Hiển thị danh sách responses của survey config
     */
    getResponses: async (req, res) => {
        try {
            const user = req.user;
            const surveyConfigId = req.params.id;
            const errors = [];

            // Lấy thông tin survey config
            const surveyConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!surveyConfigResponse.success || !surveyConfigResponse.data || surveyConfigResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy cấu hình khảo sát",
                    status: 404
                });
            }

            const surveyConfig = surveyConfigResponse.data[0];

            // Lấy thông tin project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }

            const project = projectResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập dự án này",
                    status: 403
                });
            }

            // Lấy thống kê từ SQLite nếu có
            let statistics = {};
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(project.id);

            if (sqlitePath) {
                try {
                    statistics = await sqliteService.getStatistics(sqlitePath);
                } catch (error) {
                    console.warn('Could not get statistics from SQLite:', error.message);
                }
            }

            res.render('survey-configs/responses', {
                user: user,
                errors: errors,
                surveyConfig: surveyConfig,
                project: project,
                statistics: statistics,
                moment: moment
            });
        } catch (error) {
            console.error('Error in surveyConfigController.getResponses:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * Hiển thị form builder
     */
    getFormBuilder: async (req, res) => {
        try {
            const user = req.user;
            const surveyConfigId = req.params.id;
            const errors = [];

            // Lấy thông tin survey config
            const surveyConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!surveyConfigResponse.success || !surveyConfigResponse.data || surveyConfigResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy cấu hình khảo sát",
                    status: 404
                });
            }

            const surveyConfig = surveyConfigResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, surveyConfig)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập cấu hình khảo sát này",
                    status: 403
                });
            }

            // Lấy thông tin project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy dự án",
                    status: 404
                });
            }

            const project = projectResponse.data[0];

            res.render('survey-configs/form-builder', {
                user: user,
                errors: errors,
                surveyConfig: surveyConfig,
                project: project,
                moment: moment
            });
        } catch (error) {
            console.error('Error in surveyConfigController.getFormBuilder:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * Lấy cấu hình form builder
     */
    getFormConfig: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const surveyConfigId = req.params.id;

            // Lấy thông tin survey config
            const surveyConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!surveyConfigResponse.success || !surveyConfigResponse.data || surveyConfigResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const surveyConfig = surveyConfigResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, surveyConfig)) {
                resultData.message = 'Bạn không có quyền truy cập cấu hình khảo sát này!';
                return res.json(resultData);
            }

            // Parse form config từ settings
            let formConfig = null;
            if (surveyConfig.form_config) {
                try {
                    formConfig = JSON.parse(surveyConfig.form_config);
                } catch (e) {
                    console.warn('Could not parse form_config:', e.message);
                }
            }

            resultData.success = true;
            resultData.data = formConfig;
            res.json(resultData);
        } catch (error) {
            console.error('Error in surveyConfigController.getFormConfig:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Lưu cấu hình form builder
     */
    saveFormConfig: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const surveyConfigId = req.params.id;
            const configData = req.body.config;

            // Validate input
            if (!configData) {
                resultData.message = 'Dữ liệu cấu hình không hợp lệ!';
                return res.json(resultData);
            }

            // Validate JSON
            let parsedConfig;
            try {
                parsedConfig = JSON.parse(configData);
            } catch (e) {
                resultData.message = 'Dữ liệu cấu hình không đúng định dạng JSON!';
                return res.json(resultData);
            }

            // Lấy thông tin survey config
            const surveyConfigResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!surveyConfigResponse.success || !surveyConfigResponse.data || surveyConfigResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const surveyConfig = surveyConfigResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, surveyConfig)) {
                resultData.message = 'Bạn không có quyền chỉnh sửa cấu hình khảo sát này!';
                return res.json(resultData);
            }

            // Cập nhật form config
            const updateData = {
                form_config: configData,
                updated_at: new Date()
            };

            const updateResponse = await commonService.updateRecordTable(updateData, 'survey_configs', { id: surveyConfigId });

            if (updateResponse.success) {
                resultData.success = true;
                resultData.message = 'Lưu cấu hình form thành công!';
            } else {
                resultData.message = updateResponse.message || 'Có lỗi xảy ra khi lưu cấu hình!';
            }

            res.json(resultData);
        } catch (error) {
            console.error('Error in surveyConfigController.saveFormConfig:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Xóa cấu hình khảo sát
     */
    delete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const surveyConfigId = req.params.id;

            // Lấy thông tin survey config
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                id: surveyConfigId
            });

            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const surveyConfig = configResponse.data[0];

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền xóa khảo sát này!';
                return res.json(resultData);
            }

            // Soft delete survey config
            const deleteResponse = await commonService.updateRecordTable(
                { active: -1, updated_at: new Date() },
                { id: surveyConfigId },
                'survey_configs'
            );

            if (deleteResponse.success) {
                // Soft delete các fields liên quan
                await commonService.updateRecordTable(
                    { active: -1, updated_at: new Date() },
                    { survey_config_id: surveyConfigId },
                    'survey_fields'
                );

                resultData.success = true;
                resultData.message = 'Xóa cấu hình khảo sát thành công!';
            } else {
                resultData.message = deleteResponse.message || 'Có lỗi xảy ra khi xóa!';
            }

            res.json(resultData);
        } catch (error) {
            console.error('Error in surveyConfigController.delete:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Xóa field khảo sát
     */
    deleteField: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const fieldId = req.params.id;

            // Lấy thông tin field
            const fieldResponse = await commonService.getAllDataTable('survey_fields', {
                id: fieldId,
                active: 1
            });

            if (!fieldResponse.success || !fieldResponse.data || fieldResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy trường khảo sát!';
                return res.json(resultData);
            }

            const field = fieldResponse.data[0];

            // Lấy thông tin survey config
            const configResponse = await commonService.getAllDataTable('survey_configs', {
                id: field.survey_config_id
            });

            if (!configResponse.success || !configResponse.data || configResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy cấu hình khảo sát!';
                return res.json(resultData);
            }

            const surveyConfig = configResponse.data[0];

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: surveyConfig.project_id
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền xóa trường này!';
                return res.json(resultData);
            }

            // Soft delete field
            const deleteResponse = await commonService.updateRecordTable(
                { active: -1, updated_at: new Date() },
                { id: fieldId },
                'survey_fields'
            );

            if (deleteResponse.success) {
                resultData.success = true;
                resultData.message = 'Xóa trường thành công!';
            } else {
                resultData.message = deleteResponse.message || 'Có lỗi xảy ra khi xóa!';
            }

            res.json(resultData);
        } catch (error) {
            console.error('Error in surveyConfigController.deleteField:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    }
};

module.exports = surveyConfigController;
