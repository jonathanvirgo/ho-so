const moment = require('moment');
const commonService = require('../services/commonService');
const securityService = require('../services/securityService');
const sqliteService = require('../services/sqliteService');

const surveyDataController = {
    /**
     * Hiển thị danh sách dữ liệu khảo sát từ SQLite
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
            
            // Kiểm tra file SQLite tồn tại
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath) {
                return res.render("error", {
                    user: user,
                    message: "Không tìm thấy database SQLite cho dự án này",
                    status: 404
                });
            }
            
            // Lấy thống kê
            let statistics = {};
            try {
                statistics = await sqliteService.getStatistics(sqlitePath);
            } catch (error) {
                console.warn('Could not get statistics:', error.message);
            }
            
            res.render('survey-data/index', {
                user: user,
                errors: errors,
                project: project,
                statistics: statistics,
                moment: moment
            });
        } catch (error) {
            console.error('Error in surveyDataController.getList:', error.message);
            return res.render("error", {
                user: req.user,
                message: "Có lỗi xảy ra khi tải trang",
                status: 500
            });
        }
    },

    /**
     * API lấy danh sách dữ liệu khảo sát cho DataTable
     */
    getListTable: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            
            // Kiểm tra dự án và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({
                    draw: req.body.draw || 1,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                    error: "Không tìm thấy dự án"
                });
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({
                    draw: req.body.draw || 1,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                    error: "Bạn không có quyền truy cập dự án này"
                });
            }
            
            // Lấy file SQLite
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath) {
                return res.json({
                    draw: req.body.draw || 1,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                    error: "Không tìm thấy database SQLite"
                });
            }
            
            // Chuẩn bị filters
            const filters = {};

            if (req.body.search && req.body.search.value) {
                filters.email = req.body.search.value;
            }

            if (req.body.survey_config_id) {
                filters.survey_config_id = req.body.survey_config_id;
            }

            if (req.body.length) {
                filters.limit = parseInt(req.body.length);
            }

            // Lấy survey fields để hiển thị theo cột
            let surveyFields = [];
            if (filters.survey_config_id) {
                const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                    survey_config_id: filters.survey_config_id,
                    active: 1
                });
                if (fieldsResponse.success && fieldsResponse.data) {
                    surveyFields = fieldsResponse.data.sort((a, b) => a.field_order - b.field_order);
                }
            }

            // Lấy dữ liệu từ SQLite với fields riêng biệt
            const responses = await sqliteService.getSurveyResponsesWithFields(sqlitePath, filters, surveyFields);

            // Format dữ liệu cho DataTable với các cột riêng biệt cho từng field
            const formattedData = responses.map(response => {
                const rowData = {
                    id: response.id,
                    submitted_at: moment(response.submitted_at).format('DD/MM/YYYY HH:mm:ss'),
                    actions: `
                        <button class="btn btn-sm btn-info view-response" data-id="${response.id}">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="btn btn-sm btn-warning edit-response" data-id="${response.id}">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger delete-response" data-id="${response.id}">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    `
                };

                // Thêm dữ liệu cho từng field
                surveyFields.forEach(field => {
                    const fieldData = response.field_data && response.field_data[field.field_name];
                    let value = '';

                    if (fieldData) {
                        if (fieldData.field_value_json && ['multiselect', 'checkbox'].includes(field.field_type)) {
                            try {
                                const jsonValue = JSON.parse(fieldData.field_value_json);
                                value = Array.isArray(jsonValue) ? jsonValue.join(', ') : fieldData.field_value;
                            } catch (e) {
                                value = fieldData.field_value || '';
                            }
                        } else {
                            value = fieldData.field_value || '';
                        }
                    }

                    rowData[field.field_name] = value;
                });

                return rowData;
            });
            res.json({
                draw: req.body.draw || 1,
                recordsTotal: responses.length,
                recordsFiltered: responses.length,
                data: formattedData,
                fields: surveyFields
            });
            
        } catch (error) {
            console.error('Error in surveyDataController.getListTable:', error.message);
            res.json({
                draw: req.body.draw || 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                error: "Có lỗi xảy ra khi tải dữ liệu"
            });
        }
    },

    /**
     * Lấy chi tiết response
     */
    getDetail: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const responseId = req.params.responseId;
            
            // Kiểm tra dự án và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy dự án"
                });
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập dự án này"
                });
            }
            
            // Lấy file SQLite
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy database SQLite"
                });
            }
            
            // Lấy chi tiết response
            const responseDetail = await sqliteService.getSurveyResponseDetail(sqlitePath, responseId);
            
            if (!responseDetail) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy response"
                });
            }
            
            res.json({
                success: true,
                data: responseDetail
            });
            
        } catch (error) {
            console.error('Error in surveyDataController.getDetail:', error.message);
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi tải chi tiết"
            });
        }
    },

    /**
     * Cập nhật response
     */
    update: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const responseId = req.params.responseId;
            const updateData = req.body;
            
            // Kiểm tra dự án và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền truy cập dự án này!';
                return res.json(resultData);
            }
            
            // Lấy file SQLite
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath) {
                resultData.message = 'Không tìm thấy database SQLite!';
                return res.json(resultData);
            }
            
            // Cập nhật response
            await sqliteService.updateSurveyResponse(sqlitePath, responseId, updateData);
            
            resultData.success = true;
            resultData.message = 'Cập nhật thành công!';
            
            res.json(resultData);
            
        } catch (error) {
            console.error('Error in surveyDataController.update:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra khi cập nhật!"));
        }
    },

    /**
     * Xóa response
     */
    delete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };

        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const responseId = req.params.responseId;
            
            // Kiểm tra dự án và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: projectId
            });
            
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                resultData.message = 'Không tìm thấy dự án!';
                return res.json(resultData);
            }
            
            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                resultData.message = 'Bạn không có quyền truy cập dự án này!';
                return res.json(resultData);
            }
            
            // Lấy file SQLite
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath) {
                resultData.message = 'Không tìm thấy database SQLite!';
                return res.json(resultData);
            }
            
            // Xóa response
            const deleted = await sqliteService.deleteSurveyResponse(sqlitePath, responseId);
            
            if (deleted) {
                resultData.success = true;
                resultData.message = 'Xóa thành công!';
            } else {
                resultData.message = 'Không tìm thấy response để xóa!';
            }
            
            res.json(resultData);

        } catch (error) {
            console.error('Error in surveyDataController.delete:', error.message);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra khi xóa!"));
        }
    },

    /**
     * Xuất dữ liệu ra file Excel
     */
    exportExcel: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;

            // Kiểm tra dự án và quyền truy cập
            const projectResponse = await commonService.getAllDataTable('projects', {
                id: parseInt(projectId)
            });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy dự án"
                });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập dự án này"
                });
            }

            // Lấy file SQLite
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);
            if (!sqlitePath || !require('fs').existsSync(sqlitePath)) {
                // Tạo file Excel trống nếu chưa có SQLite database
                console.log('SQLite database not found, creating empty Excel file');
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Survey Responses');

                // Tạo headers cơ bản
                const headers = ['ID', 'Email người trả lời', 'IP Address', 'Thời gian gửi'];
                worksheet.addRow(headers);

                // Style headers
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };

                // Tạo buffer và gửi file trống
                const buffer = await workbook.xlsx.writeBuffer();
                const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
                const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_survey_data_${timestamp}.xlsx`;

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Length', buffer.length);

                return res.send(buffer);
            }

            // Lấy survey fields để tạo headers
            let surveyFields = [];
            console.log('Export Excel - survey_config_id:', req.query.survey_config_id);

            if (req.query.survey_config_id) {
                // Lấy fields từ survey config cụ thể
                const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                    survey_config_id: req.query.survey_config_id,
                    active: 1
                });

                if (fieldsResponse.success && fieldsResponse.data) {
                    surveyFields = fieldsResponse.data.sort((a, b) => a.field_order - b.field_order);
                    console.log('Found survey fields:', surveyFields.length, 'fields');
                    console.log('Field labels:', surveyFields.map(f => f.field_label));
                }
            } else {
                // Nếu không có survey_config_id cụ thể, lấy từ survey config đầu tiên của project
                const surveyConfigsResponse = await commonService.getAllDataTable('survey_configs', {
                    project_id: projectId,
                    active: 1
                });

                if (surveyConfigsResponse.success && surveyConfigsResponse.data && surveyConfigsResponse.data.length > 0) {
                    const surveyConfig = surveyConfigsResponse.data[0];
                    const fieldsResponse = await commonService.getAllDataTable('survey_fields', {
                        survey_config_id: surveyConfig.id,
                        active: 1
                    });

                    if (fieldsResponse.success && fieldsResponse.data) {
                        surveyFields = fieldsResponse.data.sort((a, b) => a.field_order - b.field_order);
                        console.log('Found survey fields from first config:', surveyFields.length, 'fields');
                    }
                }
            }

            // Chuẩn bị filters từ query params
            const filters = {};
            if (req.query.email) filters.email = req.query.email;
            if (req.query.date_from) filters.date_from = req.query.date_from;
            if (req.query.date_to) filters.date_to = req.query.date_to;
            if (req.query.survey_config_id) filters.survey_config_id = req.query.survey_config_id;

            // Xuất Excel (sẽ tạo file trống nếu không có dữ liệu)
            const excelBuffer = await sqliteService.exportToExcel(sqlitePath, surveyFields, filters);

            // Tạo tên file
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_survey_data_${timestamp}.xlsx`;

            // Set headers và gửi file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', excelBuffer.length);

            res.send(excelBuffer);

        } catch (error) {
            console.error('Error in surveyDataController.exportExcel:', error.message);
            res.status(500).json({
                success: false,
                message: "Có lỗi xảy ra khi xuất file Excel"
            });
        }
    },

    /**
     * Get analytics overview data
     */
    getAnalyticsOverview: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;
            const dateRange = req.query.dateRange || '7d';

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();

            switch(dateRange) {
                case '1d':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
            }

            // Get analytics data
            const analytics = await sqliteService.getAnalyticsOverview(sqlitePath, {
                surveyConfigId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            console.error('Error in getAnalyticsOverview:', error.message);
            res.json({ success: false, message: 'Failed to get analytics overview' });
        }
    },

    /**
     * Get response trend data
     */
    getResponseTrend: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;
            const dateRange = req.query.dateRange || '7d';

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Get trend data
            const trendData = await sqliteService.getResponseTrend(sqlitePath, {
                surveyConfigId,
                dateRange
            });

            res.json({
                success: true,
                data: trendData
            });
        } catch (error) {
            console.error('Error in getResponseTrend:', error.message);
            res.json({ success: false, message: 'Failed to get response trend' });
        }
    },

    /**
     * Get field analysis data
     */
    getFieldAnalysis: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Get field analysis data
            const fieldData = await sqliteService.getFieldAnalysis(sqlitePath, {
                surveyConfigId
            });

            res.json({
                success: true,
                data: fieldData
            });
        } catch (error) {
            console.error('Error in getFieldAnalysis:', error.message);
            res.json({ success: false, message: 'Failed to get field analysis' });
        }
    },

    /**
     * Get response time analysis
     */
    getResponseTime: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;
            const period = req.query.period || '24h';

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Get response time data
            const timeData = await sqliteService.getResponseTimeAnalysis(sqlitePath, {
                surveyConfigId,
                period
            });

            res.json({
                success: true,
                data: timeData
            });
        } catch (error) {
            console.error('Error in getResponseTime:', error.message);
            res.json({ success: false, message: 'Failed to get response time analysis' });
        }
    },

    /**
     * Get recent responses
     */
    getRecentResponses: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;
            const limit = parseInt(req.query.limit) || 10;

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Get recent responses
            const recentResponses = await sqliteService.getRecentResponses(sqlitePath, {
                surveyConfigId,
                limit
            });

            res.json({
                success: true,
                data: recentResponses
            });
        } catch (error) {
            console.error('Error in getRecentResponses:', error.message);
            res.json({ success: false, message: 'Failed to get recent responses' });
        }
    },

    /**
     * Get geographic analysis data
     */
    getGeographicAnalysis: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const surveyConfigId = req.query.surveyConfigId;

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.json({ success: false, message: 'Database not found' });
            }

            // Get geographic data
            const geographicData = await sqliteService.getGeographicAnalysis(sqlitePath, {
                surveyConfigId
            });

            res.json({
                success: true,
                data: geographicData
            });
        } catch (error) {
            console.error('Error in getGeographicAnalysis:', error.message);
            res.json({ success: false, message: 'Failed to get geographic analysis' });
        }
    },

    /**
     * Export analytics data
     */
    exportAnalytics: async (req, res) => {
        try {
            const user = req.user;
            const projectId = req.params.projectId;
            const format = req.query.format || 'excel';
            const surveyConfigId = req.query.surveyConfigId;

            // Kiểm tra quyền truy cập project
            const projectResponse = await commonService.getAllDataTable('projects', { id: projectId });
            if (!projectResponse.success || !projectResponse.data || projectResponse.data.length === 0) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            const project = projectResponse.data[0];
            if (!securityService.canAccessRecord(user, project)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            // Get SQLite path
            const sqliteService = require('../services/sqliteService');
            const sqlitePath = project.sqlite_db_path || sqliteService.getProjectDatabasePath(projectId);

            if (!sqlitePath) {
                return res.status(404).json({ success: false, message: 'Database not found' });
            }

            // Export analytics based on format
            let exportBuffer;
            let fileName;
            let contentType;

            switch(format) {
                case 'pdf':
                    exportBuffer = await sqliteService.exportAnalyticsToPDF(sqlitePath, { surveyConfigId });
                    fileName = `analytics_report_${moment().format('YYYY-MM-DD')}.pdf`;
                    contentType = 'application/pdf';
                    break;
                case 'csv':
                    exportBuffer = await sqliteService.exportAnalyticsToCSV(sqlitePath, { surveyConfigId });
                    fileName = `analytics_data_${moment().format('YYYY-MM-DD')}.csv`;
                    contentType = 'text/csv';
                    break;
                default: // excel
                    exportBuffer = await sqliteService.exportAnalyticsToExcel(sqlitePath, { surveyConfigId });
                    fileName = `analytics_report_${moment().format('YYYY-MM-DD')}.xlsx`;
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(exportBuffer);
        } catch (error) {
            console.error('Error in exportAnalytics:', error.message);
            res.status(500).json({ success: false, message: 'Failed to export analytics' });
        }
    }
};

module.exports = surveyDataController;
