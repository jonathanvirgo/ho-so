// DataTable Service - Utility functions cho DataTables
const commonService = require('./commonService');
const securityService = require('./securityService');

const dataTableService = {
    /**
     * Tạo parameter chuẩn cho getDataTableData
     * @param {Object} config - Cấu hình DataTable
     * @param {Object} reqBody - Request body từ DataTables
     * @param {Object} user - User object
     * @returns {Object} - Parameter object cho getDataTableData
     */
    createDataTableParameter: function(config, reqBody, user) {
        const {
            table,
            columns = ['*'],
            primaryKey = 'id',
            active = 0,
            activeOperator = '!=',
            filters = {},
            searchColumns = [],
            columnsMapping = [],
            defaultOrder = [{ column: 'id', dir: 'DESC' }],
            pageLength = 15
        } = config;

        // Parse order từ req.body
        const finalOrder = commonService.parseDataTableOrder(reqBody, columnsMapping, defaultOrder);
        let roleBasedFilters = filters;
        if(!['campaign', 'food_info', 'log_activities', 'audit_logs', 'auth_logs', 'user'].includes(config.table)){
            // Apply role-based filtering
            roleBasedFilters = securityService.applyRoleBasedFiltering(user, filters);
        }

        return {
            table,
            columns,
            primaryKey,
            active,
            activeOperator,
            filters: roleBasedFilters,
            search: {
                value: reqBody.search['value'],
                columns: searchColumns
            },
            order: finalOrder,
            start: isNaN(parseInt(reqBody.start)) ? 0 : parseInt(reqBody.start),
            length: isNaN(parseInt(reqBody.length)) ? pageLength : parseInt(reqBody.length),
            draw: reqBody.draw || 1
        };
    },

    /**
     * Tạo response chuẩn cho DataTable khi có lỗi
     * @param {Object} reqBody - Request body
     * @param {String} error - Error message
     * @returns {Object} - Error response object
     */
    createErrorResponse: function(reqBody, error) {
        return {
            draw: reqBody?.draw || 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
            error: error
        };
    },

    /**
     * Tạo cấu hình DataTable frontend chuẩn
     * @param {Object} config - Cấu hình
     * @returns {Object} - DataTable configuration object
     */
    createFrontendConfig: function(config) {
        const {
            url,
            columns,
            pageLength = 25,
            lengthMenu = [25, 50, 75, 100],
            ordering = true,
            searching = true,
            rowIdPrefix = 'row'
        } = config;

        return {
            dom: '<"top d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2"pf>rt<"bottom d-flex flex-wrap gap-2 justify-content-between align-items-center mt-2"il><"clear">',
            serverSide: true,
            processing: true,
            responsive: true,
            pageLength,
            lengthMenu,
            paging: true,
            scrollX: true,
            ajax: {
                url,
                method: 'POST',
                dataType: "json",
                beforeSend: function() {
                    if (typeof loading !== 'undefined') loading.show();
                },
                complete: function() {
                    if (typeof loading !== 'undefined') loading.hide();
                },
                dataSrc: function(response) {
                    if (response.data) {
                        return response.data;
                    } else {
                        return [];
                    }
                }
            },
            rowId: function(row) {
                return `${rowIdPrefix}-${row.id}`;
            },
            columns,
            order: [], // Để server xử lý order
            searching,
            ordering
        };
    },

    /**
     * Tạo column configuration chuẩn cho actions
     * @param {Function} renderFunction - Custom render function
     * @returns {Object} - Column configuration
     */
    createActionsColumn: function(renderFunction) {
        return {
            data: null,
            orderable: false,
            searchable: false,
            render: renderFunction || function(data, type, row) {
                return `
                    <div class="d-flex gap-2">
                        <button class="btn btn-info btn-sm btn-circle" onclick="editItem(${row.id})" title="Sửa">
                            <i class="fas fa-pen-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-circle" onclick="deleteItem(${row.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }
        };
    },

    /**
     * Tạo column configuration chuẩn cho data column
     * @param {Object} config - Column configuration
     * @returns {Object} - Column configuration
     */
    createDataColumn: function(config) {
        const {
            data,
            orderable = true,
            searchable = true,
            className = '',
            render = null
        } = config;

        const column = {
            data,
            orderable,
            searchable
        };

        if (className) column.className = className;
        if (render) column.render = render;

        return column;
    },

    /**
     * Tạo column configuration cho ngày tháng
     * @param {String} data - Column data name
     * @param {String} format - Date format (default: 'D/M/YYYY')
     * @returns {Object} - Column configuration
     */
    createDateColumn: function(data, format = 'D/M/YYYY') {
        return this.createDataColumn({
            data,
            orderable: true,
            searchable: false,
            render: function(data, type, row) {
                return data ? moment(data).format(format) : '';
            }
        });
    },

    /**
     * Xử lý DataTable request trong controller
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Object} config - DataTable configuration
     * @param {Function} preprocessData - Optional function để xử lý data trước khi trả về
     */
    handleDataTableRequest: async function(req, res, config, preprocessData = null) {
        try {
            // Kiểm tra quyền truy cập
            if (config.checkRole) {
                const checkRole = commonService.checkRoleUser(req.body.path, req.user);
                if (checkRole.length > 0) {
                    return res.json(this.createErrorResponse(req.body, checkRole.join(', ')));
                }
            }

            // Tạo parameter
            const parameter = this.createDataTableParameter(config, req.body, req.user);
            // Gọi getDataTableData
            const responseData = await commonService.getDataTableData(parameter);
            // Xử lý dữ liệu nếu có preprocessData function
            if (preprocessData && responseData.data && responseData.data.length > 0) {
                responseData.data = await preprocessData(responseData.data);
            }

            res.json(responseData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(this.createErrorResponse(req.body, 'Có lỗi xảy ra, vui lòng thử lại sau!'));
        }
    }
};

module.exports = dataTableService;
