const moment = require('moment');
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');
const googleSheetsService = require('../services/googleSheetsService');

const projectController = {
    /**
     * Hiển thị danh sách dự án
     */
    getList: async (req, res) => {
        try {
            const user = req.user;
            const errors = [];
            
            res.render('projects/index', {
                user: user,
                errors: errors,
                moment: moment
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * API lấy danh sách dự án cho DataTable
     */
    getListTable: async (req, res) => {
        try {
            const user = req.user;
            
            // Order mặc định
            const defaultOrder = [
                { column: 'id', dir: 'DESC' }
            ];
            
            // Cấu hình DataTable
            const config = {
                table: 'projects',
                columns: ['id', 'name', 'description', 'active', 'start_date', 'end_date', 'created_at'],
                primaryKey: 'id',
                active: -1,
                activeOperator: '!=',
                filters: securityService.applyRoleBasedFiltering(user, {}),
                searchColumns: ['name', 'description'],
                columnsMapping: [
                    '', // checkbox column
                    'name',
                    'description', 
                    'active',
                    'start_date',
                    'end_date',
                    'created_at',
                    '' // action column
                ],
                defaultOrder: defaultOrder,
                checkRole: false
            };
            
            // Gọi service xử lý DataTable và tự động xử lý response
            await dataTableService.handleDataTableRequest(req, res, config, (data) => {
                // Format dữ liệu cho hiển thị
                return data.map(project => {
                    const statusText = project.active === 1 ? 'Hoạt động' : 
                                     project.active === 0 ? 'Tạm dừng' : 'Đã xóa';
                    const statusClass = project.active === 1 ? 'success' : 
                                       project.active === 0 ? 'warning' : 'danger';
                    
                    return [
                        `<input type="checkbox" class="select-row" value="${project.id}">`,
                        project.name,
                        project.description || '',
                        `<span class="badge badge-${statusClass}">${statusText}</span>`,
                        project.start_date ? moment(project.start_date).format('DD/MM/YYYY') : '',
                        project.end_date ? moment(project.end_date).format('DD/MM/YYYY') : '',
                        moment(project.created_at).format('DD/MM/YYYY HH:mm'),
                        `<div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="editProject(${project.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="viewSurveys(${project.id})">
                                <i class="fas fa-poll"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>`
                    ];
                });
            });
        } catch (error) {
            console.log("error", error);
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra khi tải dữ liệu!"));
        }
    },

    /**
     * Hiển thị form tạo dự án mới
     */
    getCreate: async (req, res) => {
        try {
            const user = req.user;
            const errors = [];
            
            res.render('projects/create', {
                user: user,
                errors: errors,
                project: {},
                moment: moment
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },

    /**
     * Hiển thị form chỉnh sửa dự án
     */
    getEdit: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.id;
            const errors = [];
            // Lấy thông tin dự án
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
            
            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, project)) {
                return res.render("error", {
                    user: user,
                    message: "Bạn không có quyền truy cập dự án này",
                    status: 403
                });
            }
            
            res.render('projects/edit', {
                user: user,
                errors: errors,
                project: project,
                moment: moment
            });
        } catch (error) {
            console.error('Error in projectController.getEdit:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * Tạo dự án mới
     */
    create: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const user = req.user;
            
            // Validation rules
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên dự án!" },
                { field: "description", type: "string", required: false }
            ];
            const parameter = {
                name: req.body.name,
                description: req.body.description || null,
                active: parseInt(req.body.active) || 1,
                start_date: req.body.start_date || null,
                end_date: req.body.end_date || null,
                created_by: user.id,
                campaign_id: user.campaign_id
            };
            
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
            
            // Kiểm tra tên dự án đã tồn tại
            const existingProject = await commonService.getAllDataTable('projects', {
                name: parameter.name,
                created_by: user.id,
                active: 1,
                campaign_id: user.campaign_id
            });
            
            if (existingProject.success && existingProject.data && existingProject.data.length > 0) {
                resultData.message = 'Tên dự án đã tồn tại!';
                return res.json(resultData);
            }
            
            // Tạo Google Sheet cho dự án
            const sheetResult = await googleSheetsService.createNewSheet(parameter.name);
            if (sheetResult.sheetId) {
                parameter.google_sheet_id = sheetResult.sheetId;
                parameter.google_sheet_url = sheetResult.sheetUrl;
            }
            console.log('sheetResult', sheetResult);
            // Tạo dự án
            const response = await commonService.addRecordTable(parameter, 'projects', true);
            if (response.success && response.data) {
                const projectId = response.data.insertId;

                // Tạo SQLite database cho dự án
                try {
                    const sqliteService = require('../services/sqliteService');
                    const sqlitePath = sqliteService.createProjectDatabase(parameter.name, projectId);

                    if (sqlitePath) {
                        // Cập nhật project với đường dẫn SQLite
                        await commonService.updateRecordTable(
                            { sqlite_db_path: sqlitePath },
                            { id: projectId },
                            'projects'
                        );
                        console.log(`✓ SQLite database created for project ${projectId}: ${sqlitePath}`);
                    }
                } catch (sqliteError) {
                    console.warn('Warning: Could not create SQLite database:', sqliteError.message);
                    // Không block việc tạo project nếu SQLite fail
                }

                resultData.success = true;
                resultData.message = 'Tạo dự án thành công!';
                resultData.data = { id: projectId };
            } else {
                resultData.message = response.message || 'Có lỗi xảy ra khi tạo dự án!';
            }
            
            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Cập nhật dự án
     */
    update: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const projectId = req.body.id;

            if (!projectId) {
                resultData.message = 'ID dự án không hợp lệ!';
                return res.json(resultData);
            }

            // Validation rules
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên dự án!" },
                { field: "description", type: "string", required: false },
                { field: "start_date", type: "date", required: false },
                { field: "end_date", type: "date", required: false }
            ];

            const parameter = {
                name: req.body.name,
                description: req.body.description || null,
                active: parseInt(req.body.active) || 1,
                start_date: req.body.start_date || null,
                end_date: req.body.end_date || null,
                updated_at: new Date()
            };

            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }

            // Kiểm tra dự án tồn tại và quyền truy cập
            const existingProject = await commonService.getAllDataTable('projects', {
                id: projectId
            });

            if (!existingProject.success || !existingProject.data || existingProject.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = existingProject.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền chỉnh sửa dự án này!';
                return res.json(resultData);
            }

            // Kiểm tra tên dự án trùng lặp (trừ chính nó)
            const duplicateCheck = await commonService.getAllDataTable('projects', {
                name: parameter.name,
                created_by: user.id,
                active: 1,
                campaign_id: user.campaign_id
            });

            if (duplicateCheck.success && duplicateCheck.data && duplicateCheck.data.length > 0) {
                const duplicate = duplicateCheck.data.find(p => p.id != projectId);
                if (duplicate) {
                    resultData.message = 'Tên dự án đã tồn tại!';
                    return res.json(resultData);
                }
            }

            // Cập nhật dự án
            const response = await commonService.updateRecordTable(parameter, { id: projectId }, 'projects');

            if (response.success) {
                resultData.success = true;
                resultData.message = 'Cập nhật dự án thành công!';
            } else {
                resultData.message = response.message || 'Có lỗi xảy ra khi cập nhật dự án!';
            }

            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Xóa dự án (soft delete)
     */
    delete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const projectId = req.body.id || req.params.id;

            if (!projectId) {
                resultData.message = 'ID dự án không hợp lệ!';
                return res.json(resultData);
            }

            // Kiểm tra dự án tồn tại và quyền truy cập
            const existingProject = await commonService.getAllDataTable('projects', {
                id: projectId
            });

            if (!existingProject.success || !existingProject.data || existingProject.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }

            const project = existingProject.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền xóa dự án này!';
                return res.json(resultData);
            }

            // Soft delete
            const response = await commonService.updateRecordTable(
                { active: -1, updated_at: new Date() },
                { id: projectId },
                'projects'
            );

            if (response.success) {
                resultData.success = true;
                resultData.message = 'Xóa dự án thành công!';
            } else {
                resultData.message = response.message || 'Có lỗi xảy ra khi xóa dự án!';
            }

            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    /**
     * Lấy chi tiết dự án
     */
    getDetail: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.id;

            // Lấy thông tin dự án
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });

            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json(securityService.createErrorResponse("Không tìm thấy dự án!"));
            }

            const project = projectResponse.data[0];

            // Kiểm tra quyền truy cập
            if (!securityService.canAccessRecord(user, project)) {
                return res.json(securityService.createErrorResponse("Bạn không có quyền truy cập dự án này!"));
            }

            res.json({
                success: true,
                data: project
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    }
};

module.exports = projectController;
