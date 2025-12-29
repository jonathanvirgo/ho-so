var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');
const menuTimeService = require('../services/menuTimeService');
const dishCategoryService = require('../services/dishCategoryService');
const inventoryService = require('../services/inventoryService');

let menuBuild = {
    // Trang danh sách thực đơn
    index: async (req, res) => {
        try {
            res.render('menu-build/index', {
                user: req.user,
                errors: []
            });
        } catch (error) {
            console.error('Error in menuBuild.index:', error);
            res.render('menu-build/index', {
                user: req.user,
                errors: [error.message]
            });
        }
    },

    // Lấy danh sách thực đơn (DataTable)
    listData: async (req, res) => {
        try {
            // Kiểm tra quyền truy cập
            if (!req.user.isAdmin && !req.user.role_id.includes(3)) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }

            // Cấu hình DataTable
            const config = {
                table: 'menu_builds',
                primaryKey: 'id',
                active: 0,
                activeOperator: '!=',
                filters: {
                    active: 1
                },
                searchColumns: ['name', 'description'],
                columnsMapping: [
                    'id', // column 0
                    'name', // column 1
                    'view_type', // column 2
                    'status', // column 3
                    'start_date', // column 4
                    'created_at' // column 5
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: true,
                roleColumn: 'created_by',
                roleValue: req.user.id,
                roleCondition: !req.user.isAdmin // Chỉ áp dụng phân quyền nếu không phải admin
            };

            // Xử lý request
            dataTableService.handleDataTableRequest(req, res, config);
        } catch (error) {
            console.error('Error in menuBuild.listData:', error);
            res.json({
                "data": [],
                "error": "Có lỗi xảy ra, vui lòng thử lại sau!",
                "draw": req.body.draw || 1,
                "recordsFiltered": 0,
                "recordsTotal": 0
            });
        }
    },

    // Trang tạo mới thực đơn
    create: async (req, res) => {
        try {
            const errors = [];

            // Lấy danh sách giờ ăn từ service
            const menuTimes = menuTimeService.getAllMenuTimes();

            res.render('menu-build/form', {
                user: req.user,
                errors: errors,
                menuTimes: menuTimes,
                menuBuild: null,
                menuDetails: [],
                isEdit: false
            });
        } catch (error) {
            console.error('Error in menuBuild.create:', error);
            res.render('menu-build/form', {
                user: req.user,
                errors: [error.message],
                menuTimes: [],
                menuBuild: null,
                menuDetails: [],
                isEdit: false
            });
        }
    },

    // Trang chỉnh sửa thực đơn
    edit: async (req, res) => {
        try {
            const { id } = req.params;
            const user = req.user;
            const errors = [];
            let menuBuild = null;
            let menuDetails = [];

            // Lấy danh sách giờ ăn từ service
            const menuTimes = menuTimeService.getAllMenuTimes();

            // Lấy thông tin thực đơn
            const menuResult = await commonService.getAllDataTable('menu_builds', { id: id, active: 1 });

            if (!menuResult.success || menuResult.data.length === 0) {
                errors.push('Không tìm thấy thực đơn');
            } else {
                menuBuild = menuResult.data[0];

                // Parse visible_meal_times từ JSON
                menuBuild.visible_meal_times = menuTimeService.parseVisibleMealTimes(menuBuild.visible_meal_times);

                // Parse visible_categories từ JSON
                if (menuBuild.visible_categories) {
                    try {
                        menuBuild.visible_categories = JSON.parse(menuBuild.visible_categories);
                    } catch (e) {
                        menuBuild.visible_categories = dishCategoryService.getAllCategories().map(c => c.key);
                    }
                } else {
                    menuBuild.visible_categories = dishCategoryService.getAllCategories().map(c => c.key);
                }

                // Kiểm tra quyền
                if (!user.isAdmin && menuBuild.created_by !== user.id) {
                    errors.push('Bạn không có quyền chỉnh sửa thực đơn này');
                    menuBuild = null;
                }
            }

            // Lấy chi tiết thực đơn
            if (menuBuild) {
                const detailsSql = `
                    SELECT
                        mbd.*,
                        mt.time as menu_time_name
                    FROM menu_build_details mbd
                    INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
                    WHERE mbd.menu_build_id = ? AND mbd.active = 1
                    ORDER BY mbd.week_number, mbd.day_of_week, mt.order_sort
                `;
                const detailsResult = await commonService.getListTable(detailsSql, [id]);
                if (detailsResult.success) {
                    menuDetails = detailsResult.data;
                    // Parse detail JSON cho mỗi record
                    menuDetails.forEach(detail => {
                        if (detail.detail) {
                            try {
                                detail.detail = JSON.parse(detail.detail);
                            } catch (e) {
                                detail.detail = { courses: [], listFood: [] };
                            }
                        } else {
                            detail.detail = { courses: [], listFood: [] };
                        }
                    });
                }
            }

            res.render('menu-build/form', {
                user: req.user,
                errors: errors,
                menuTimes: menuTimes,
                menuBuild: menuBuild,
                menuDetails: menuDetails,
                isEdit: true
            });
        } catch (error) {
            console.error('Error in menuBuild.edit:', error);
            res.render('menu-build/form', {
                user: req.user,
                errors: [error.message],
                menuTimes: menuTimeService.getAllMenuTimes(),
                menuBuild: null,
                menuDetails: [],
                isEdit: true
            });
        }
    },

    // Trang chỉnh sửa chi tiết 1 ngày
    editDay: async (req, res) => {
        try {
            const { menuId, week, day } = req.params;
            const user = req.user;
            const errors = [];
            let menuBuild = null;
            let dayDetails = []; // Chi tiết tất cả giờ ăn trong ngày này

            // Lấy thông tin thực đơn
            const menuResult = await commonService.getAllDataTable('menu_builds', { id: menuId, active: 1 });

            if (!menuResult.success || menuResult.data.length === 0) {
                errors.push('Không tìm thấy thực đơn');
            } else {
                menuBuild = menuResult.data[0];

                // Kiểm tra quyền
                if (!user.isAdmin && menuBuild.created_by !== user.id) {
                    errors.push('Bạn không có quyền chỉnh sửa thực đơn này');
                    menuBuild = null;
                }
            }
            console.log('menuResult', menuResult);
            // Lấy chi tiết tất cả giờ ăn trong ngày này
            if (menuBuild) {
                // Lấy danh sách giờ ăn hiển thị
                let visibleMealTimes = [];
                try {
                    visibleMealTimes = JSON.parse(menuBuild.visible_meal_times || '[]');
                } catch (e) {
                    visibleMealTimes = [5]; // Default: Trưa
                }
                console.log('visibleMealTimes', visibleMealTimes);
                const detailsSql = `
                    SELECT
                        mbd.*,
                        mt.time as menu_time_name,
                        mt.name as menu_time_full_name,
                        mt.order_sort
                    FROM menu_build_details mbd
                    INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
                    WHERE mbd.menu_build_id = ?
                    AND mbd.week_number = ?
                    AND mbd.day_of_week = ?
                    ORDER BY mt.order_sort
                `;
                const detailsResult = await commonService.getListTable(detailsSql, [menuId, week, day]);
                console.log('detailsResult', detailsResult);
                if (detailsResult.success) {
                    dayDetails = detailsResult.data;
                } else {
                    dayDetails = [];
                }

                // Tạo detail cho các giờ ăn chưa có
                for (const mealTimeId of visibleMealTimes) {
                    const exists = dayDetails.find(d => d.menu_time_id === mealTimeId);
                    if (!exists) {
                        // Lấy thông tin meal time
                        const mealTimeResult = await commonService.getAllDataTable('menu_time', { id: mealTimeId });
                        if (mealTimeResult.success && mealTimeResult.data.length > 0) {
                            const mealTime = mealTimeResult.data[0];
                            dayDetails.push({
                                id: null, // Chưa có trong DB
                                menu_build_id: menuId,
                                week_number: week,
                                day_number: day,
                                menu_time_id: mealTimeId,
                                menu_time_name: mealTime.time,
                                menu_time_full_name: mealTime.name,
                                order_sort: mealTime.order_sort,
                                detail: { courses: [], listFood: [] },
                                is_new: true
                            });
                        }
                    }
                }

                // Parse detail JSON
                dayDetails.forEach(detail => {
                    if (!detail.is_new) {
                        if (detail.detail) {
                            try {
                                detail.detail = JSON.parse(detail.detail);
                            } catch (e) {
                                detail.detail = { courses: [], listFood: [] };
                            }
                        } else {
                            detail.detail = { courses: [], listFood: [] };
                        }
                    }
                });

                // Sắp xếp lại theo order_sort
                dayDetails.sort((a, b) => (a.order_sort || 0) - (b.order_sort || 0));
            }

            // Lấy danh sách giờ ăn
            const menuTimes = menuTimeService.getAllMenuTimes();
            console.log('menuTimes', menuTimes);
            // Tên ngày
            const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            const dayName = dayNames[day] || `Ngày ${day}`;

            res.render('menu-build/edit-day', {
                user: req.user,
                errors: errors,
                menuBuild: menuBuild,
                dayDetails: dayDetails,
                menuTimes: menuTimes,
                week: parseInt(week),
                day: parseInt(day),
                dayName: dayName
            });
        } catch (error) {
            console.error('Error in menuBuild.editDay:', error);
            res.render('menu-build/edit-day', {
                user: req.user,
                errors: [error.message],
                menuBuild: null,
                dayDetails: [],
                menuTimes: menuTimeService.getAllMenuTimes(),
                week: parseInt(req.params.week),
                day: parseInt(req.params.day),
                dayName: 'Ngày'
            });
        }
    },

    // Lưu thực đơn (tạo mới hoặc cập nhật)
    save: async (req, res) => {
        const resultData = {
            success: false,
            message: "",
            data: null
        };

        try {
            const user = req.user;
            const { id, name, description, view_type, selected_week, start_date, end_date, status, note, visible_meal_times, visible_categories, details, detail_id_remove } = req.body;

            // Nếu có id (update) và chỉ update details (không có name), bỏ qua validate name
            const isDetailOnlyUpdate = id && !name && details && details.length > 0;

            // Validate (chỉ khi không phải detail-only update)
            if (!isDetailOnlyUpdate) {
                if (!name || name.trim() === '') {
                    resultData.message = 'Tên thực đơn không được để trống';
                    return res.json(resultData);
                }

                if (!view_type || !['week', 'month'].includes(view_type)) {
                    resultData.message = 'Loại hiển thị không hợp lệ';
                    return res.json(resultData);
                }
            }

            // Validate visible_meal_times
            if (visible_meal_times && Array.isArray(visible_meal_times)) {
                const validation = menuTimeService.validateMenuTimeIds(visible_meal_times);
                if (!validation.valid) {
                    resultData.message = validation.message;
                    return res.json(resultData);
                }
            }

            let menuId = id;

            // Nếu là detail-only update, chỉ cần validate menu tồn tại
            if (isDetailOnlyUpdate) {
                const existingMenu = await commonService.getAllDataTable('menu_builds', { id: id, active: 1 });

                if (!existingMenu.success || existingMenu.data.length === 0) {
                    resultData.message = 'Không tìm thấy thực đơn';
                    return res.json(resultData);
                }

                // Check permission
                if (!user.isAdmin && existingMenu.data[0].created_by !== user.id) {
                    resultData.message = 'Bạn không có quyền chỉnh sửa thực đơn này';
                    return res.json(resultData);
                }

                // Chỉ update updated_at
                await commonService.updateRecordTable(
                    { updated_at: moment().format('YYYY-MM-DD HH:mm:ss') },
                    { id: id },
                    'menu_builds'
                );
            } else {
                // Prepare data cho full update hoặc create
                const menuData = {
                    name: name.trim(),
                    description: description || null,
                    view_type: view_type,
                    selected_week: view_type === 'week' ? (selected_week || 1) : null,
                    visible_meal_times: menuTimeService.stringifyVisibleMealTimes(visible_meal_times),
                    visible_categories: visible_categories ? JSON.stringify(visible_categories) : JSON.stringify(dishCategoryService.getAllCategories().map(c => c.key)),
                    start_date: start_date || null,
                    end_date: end_date || null,
                    status: status || 'draft',
                    note: note || null,
                    updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
                };

                if (id) {
                    // Update existing menu
                    const existingMenu = await commonService.getAllDataTable('menu_builds', { id: id, active: 1 });

                    if (!existingMenu.success || existingMenu.data.length === 0) {
                        resultData.message = 'Không tìm thấy thực đơn';
                        return res.json(resultData);
                    }

                    // Check permission
                    if (!user.isAdmin && existingMenu.data[0].created_by !== user.id) {
                        resultData.message = 'Bạn không có quyền chỉnh sửa thực đơn này';
                        return res.json(resultData);
                    }

                    const updateResult = await commonService.updateRecordTable(menuData, { id: id }, 'menu_builds');

                    if (!updateResult.success) {
                        resultData.message = 'Lỗi khi cập nhật thực đơn: ' + updateResult.message;
                        return res.json(resultData);
                    }
                } else {
                    // Create new menu
                    menuData.created_by = user.id;
                    menuData.campaign_id = user.campaign_id || null;

                    const insertResult = await commonService.addRecordTable(menuData, 'menu_builds', true);

                    if (!insertResult.success) {
                        resultData.message = 'Lỗi khi tạo thực đơn: ' + insertResult.message;
                        return res.json(resultData);
                    }

                    menuId = insertResult.data.insertId;
                }
            }

            // Save details (mỗi detail là 1 ngày + giờ ăn với detail JSON)
            if (details && Array.isArray(details)) {
                for (const detail of details) {
                    // Validate menu_time_id
                    if (!detail.menu_time_id) {
                        console.warn(`Missing menu_time_id for detail`);
                        continue;
                    }

                    const validation = menuTimeService.validateMenuTimeIds([detail.menu_time_id]);
                    if (!validation.valid) {
                        console.warn(`Invalid menu_time_id: ${detail.menu_time_id}`);
                        continue;
                    }

                    // Validate và stringify detail JSON
                    let detailJson = null;
                    if (detail.detail) {
                        try {
                            // Nếu detail đã là object, stringify nó
                            detailJson = typeof detail.detail === 'string' ? detail.detail : JSON.stringify(detail.detail);
                            // Validate JSON
                            JSON.parse(detailJson);
                        } catch (e) {
                            console.warn(`Invalid detail JSON for detail:`, e);
                            detailJson = JSON.stringify({ courses: [], listFood: [] });
                        }
                    }

                    const detailData = {
                        menu_build_id: menuId,
                        week_number: detail.week_number,
                        day_of_week: detail.day_of_week,
                        menu_time_id: detail.menu_time_id,
                        detail: detailJson,
                        note: detail.note || null
                    };

                    if (detail.existing_id) {
                        await commonService.updateRecordTable(detailData, { id: detail.existing_id }, 'menu_build_details');
                    } else {
                        await commonService.addRecordTable(detailData, 'menu_build_details', true);
                    }
                }
            }

            // Xóa details đã đánh dấu
            if (detail_id_remove && Array.isArray(detail_id_remove)) {
                for (const detailId of detail_id_remove) {
                    await commonService.deleteRecordTable({ id: detailId }, {}, 'menu_build_details');
                }
            }

            resultData.success = true;
            resultData.message = id ? 'Cập nhật thực đơn thành công' : 'Tạo thực đơn thành công';
            resultData.data = { id: menuId };

            res.json(resultData);
        } catch (error) {
            console.error('Error in menuBuild.save:', error);
            resultData.message = 'Lỗi hệ thống: ' + error.message;
            res.json(resultData);
        }
    },

    // Xóa thực đơn
    delete: async (req, res) => {
        const resultData = {
            success: false,
            message: "",
            data: null
        };

        try {
            const { id } = req.params;
            const user = req.user;

            // Check exists
            const menuResult = await commonService.getAllDataTable('menu_builds', { id: id, active: 1 });

            if (!menuResult.success || menuResult.data.length === 0) {
                resultData.message = 'Không tìm thấy thực đơn';
                return res.json(resultData);
            }

            // Check permission
            if (!user.isAdmin && menuResult.data[0].created_by !== user.id) {
                resultData.message = 'Bạn không có quyền xóa thực đơn này';
                return res.json(resultData);
            }

            // Soft delete
            const deleteResult = await commonService.updateRecordTable(
                { active: 0, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') },
                { id: id },
                'menu_builds'
            );

            if (!deleteResult.success) {
                resultData.message = 'Lỗi khi xóa thực đơn: ' + deleteResult.message;
                return res.json(resultData);
            }

            resultData.success = true;
            resultData.message = 'Xóa thực đơn thành công';
            res.json(resultData);
        } catch (error) {
            console.error('Error in menuBuild.delete:', error);
            resultData.message = 'Lỗi hệ thống: ' + error.message;
            res.json(resultData);
        }
    },

    // API: Lấy danh sách giờ ăn (từ service)
    getMenuTimes: async (req, res) => {
        try {
            const menuTimes = menuTimeService.getAllMenuTimes();

            res.json({
                success: true,
                data: menuTimes
            });
        } catch (error) {
            console.error('Error in menuBuild.getMenuTimes:', error);
            res.json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    // API: Lấy danh sách loại món (từ service)
    getDishCategories: async (req, res) => {
        try {
            const categories = dishCategoryService.getAllCategories();

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error in menuBuild.getDishCategories:', error);
            res.json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    getMenuExamplesExternal: async (req, res) => {
        try {
            const result = await commonService.getListTable('SELECT * FROM menu_example ORDER BY id DESC', []);

            if (result.success) {
                return res.json({
                    success: true,
                    data: result.data,
                    message: 'Successfully retrieved menu examples'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: result.message || 'Failed to retrieve menu examples'
                });
            }
        } catch (error) {
            console.error('Error in getMenuExamplesExternal:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error: ' + error.message
            });
        }
    },

    // API: Lấy chi tiết món ăn cho một ngày cụ thể
    getDayDetail: async (req, res) => {
        try {
            const { menu_build_id, week_number, day_of_week, menu_time_id } = req.query;

            if (!menu_build_id || !week_number || !day_of_week) {
                return res.json({
                    success: false,
                    message: 'Thiếu thông tin menu_build_id, week_number hoặc day_of_week',
                    data: []
                });
            }

            let sql = `
                SELECT mbd.*, mt.time as menu_time_name
                FROM menu_build_details mbd
                INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
                WHERE mbd.menu_build_id = ?
                AND mbd.week_number = ?
                AND mbd.day_of_week = ?
                AND mbd.active = 1
            `;
            const params = [menu_build_id, week_number, day_of_week];

            // Nếu có menu_time_id thì filter theo menu_time_id
            if (menu_time_id) {
                sql += ' AND mbd.menu_time_id = ?';
                params.push(menu_time_id);
            }

            sql += ' ORDER BY mt.order_sort';

            const result = await commonService.getListTable(sql, params);
            let details = result.success ? result.data : [];

            // Parse detail JSON
            details = details.map(d => {
                if (d.detail) {
                    try {
                        d.detail = JSON.parse(d.detail);
                    } catch (e) {
                        d.detail = { courses: [], listFood: [] };
                    }
                } else {
                    d.detail = { courses: [], listFood: [] };
                }
                return d;
            });

            res.json({
                success: true,
                data: details || []
            });
        } catch (error) {
            console.error('Error in menuBuild.getDayDetail:', error);
            res.json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    // API: Cập nhật chi tiết món ăn cho một detail cụ thể
    updateDetailFood: async (req, res) => {
        const resultData = {
            success: false,
            message: "",
            data: null
        };

        try {
            const { id, detail } = req.body;

            if (!id) {
                resultData.message = 'Thiếu ID';
                return res.json(resultData);
            }

            // Validate detail is valid JSON
            if (detail) {
                try {
                    JSON.parse(detail);
                } catch (e) {
                    resultData.message = 'Detail không phải JSON hợp lệ';
                    return res.json(resultData);
                }
            }

            await commonService.updateRecordTable(
                { detail: detail },
                { id: id },
                'menu_build_details'
            );

            resultData.success = true;
            resultData.message = 'Cập nhật chi tiết thành công';
            res.json(resultData);
        } catch (error) {
            console.error('Error in menuBuild.updateDetailFood:', error);
            resultData.message = 'Lỗi hệ thống: ' + error.message;
            res.json(resultData);
        }
    },

    // API: Lấy danh sách thực phẩm cho select
    getFoodsForSelect: async (req, res) => {
        try {
            const sql = `
                SELECT id, name, unit
                FROM food_info
                WHERE active = 1
                ORDER BY name ASC
            `;

            const result = await commonService.getListTable(sql, []);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.json({
                    success: false,
                    message: result.message || 'Không thể lấy danh sách thực phẩm',
                    data: []
                });
            }
        } catch (error) {
            console.error('Error in menuBuild.getFoodsForSelect:', error);
            res.json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    /**
     * Calculate ingredients for a menu day
     */
    calculateIngredients: async (req, res) => {
        try {
            const { menuId, week, day } = req.params;
            const user = req.user;
            const errors = [];
            let menuBuild = null;
            let dayDetails = [];
            let ingredientsList = [];

            // Lấy thông tin thực đơn
            const menuResult = await commonService.getAllDataTable('menu_builds', { id: menuId, active: 1 });

            if (!menuResult.success || menuResult.data.length === 0) {
                errors.push('Không tìm thấy thực đơn');
            } else {
                menuBuild = menuResult.data[0];

                // Kiểm tra quyền
                if (!user.isAdmin && menuBuild.created_by !== user.id) {
                    errors.push('Bạn không có quyền xem thực đơn này');
                    menuBuild = null;
                }
            }

            // Lấy chi tiết tất cả giờ ăn trong ngày này
            if (menuBuild) {
                const detailsSql = `
                    SELECT
                        mbd.*,
                        mt.time as menu_time_name,
                        mt.order_sort
                    FROM menu_build_details mbd
                    INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
                    WHERE mbd.menu_build_id = ?
                    AND mbd.week_number = ?
                    AND mbd.day_of_week = ?
                    AND mbd.active = 1
                    ORDER BY mt.order_sort
                `;
                const detailsResult = await commonService.getListTable(detailsSql, [menuId, week, day]);
                if (detailsResult.success) {
                    dayDetails = detailsResult.data;
                    // Parse detail JSON
                    dayDetails.forEach(detail => {
                        if (detail.detail) {
                            try {
                                detail.detail = JSON.parse(detail.detail);
                            } catch (e) {
                                detail.detail = { courses: [], listFood: [] };
                            }
                        } else {
                            detail.detail = { courses: [], listFood: [] };
                        }
                    });

                    // Tổng hợp tất cả foods từ tất cả giờ ăn
                    const allFoods = [];
                    dayDetails.forEach(detail => {
                        if (detail.detail.listFood && detail.detail.listFood.length > 0) {
                            detail.detail.listFood.forEach(food => {
                                allFoods.push({
                                    ...food,
                                    menu_time_name: detail.menu_time_name
                                });
                            });
                        }
                    });

                    // Nhóm foods theo food_id và tính tổng
                    const foodsMap = new Map();
                    allFoods.forEach(food => {
                        const foodId = food.id_food || food.food_id;
                        if (!foodId) return;

                        if (foodsMap.has(foodId)) {
                            const existing = foodsMap.get(foodId);
                            existing.total_weight += parseFloat(food.weight) || 0;
                            existing.meal_times.add(food.menu_time_name);
                        } else {
                            foodsMap.set(foodId, {
                                food_id: foodId,
                                name: food.name || food.food_name || 'N/A',
                                total_weight: parseFloat(food.weight) || 0,
                                edible: parseFloat(food.edible) || 100,
                                price: parseFloat(food.price) || 0,
                                unit: food.unit || 'g',
                                meal_times: new Set([food.menu_time_name])
                            });
                        }
                    });

                    // Tính toán khối lượng cần mua
                    const tempList = Array.from(foodsMap.values()).map(item => {
                        const ediblePercent = item.edible / 100;
                        const purchaseWeight = ediblePercent > 0 ? item.total_weight / ediblePercent : item.total_weight;
                        const purchaseWeightKg = purchaseWeight / 1000;

                        return {
                            ...item,
                            meal_times: Array.from(item.meal_times).join(', '),
                            purchase_weight: Math.round(purchaseWeight * 100) / 100,
                            purchase_weight_kg: purchaseWeightKg
                        };
                    });

                    // Lấy kho đầu tiên của campaign để tính chi phí FIFO
                    let warehouseId = null;
                    const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                        campaign_id: user.campaign_id,
                        active: 1
                    });
                    if (warehouseResult.success && warehouseResult.data.length > 0) {
                        warehouseId = warehouseResult.data[0].id;
                    }

                    // Tính chi phí theo FIFO nếu có kho
                    if (warehouseId) {
                        const costPromises = tempList.map(async (item) => {
                            const costResult = await inventoryService.calculateCostByFIFO(
                                warehouseId,
                                item.food_id,
                                item.purchase_weight_kg
                            );

                            return {
                                ...item,
                                total_cost: costResult.total_cost,
                                avg_price: costResult.avg_price,
                                is_reference: costResult.is_reference,
                                cost_details: costResult.details
                            };
                        });

                        ingredientsList = await Promise.all(costPromises);
                    } else {
                        // Không có kho, dùng giá tham khảo
                        ingredientsList = tempList.map(item => {
                            const pricePerKg = item.price || 0;
                            const totalCost = item.purchase_weight_kg * pricePerKg;

                            return {
                                ...item,
                                total_cost: Math.round(totalCost),
                                avg_price: pricePerKg,
                                is_reference: true,
                                cost_details: []
                            };
                        });
                    }

                    // Sắp xếp theo tên
                    if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
                        ingredientsList.sort((a, b) => {
                            const nameA = a.name || '';
                            const nameB = b.name || '';
                            return nameA.localeCompare(nameB);
                        });
                    }
                }
            }

            // Lấy danh sách giờ ăn
            const menuTimes = menuTimeService.getAllMenuTimes();

            // Tên ngày
            const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            const dayName = dayNames[day] || `Ngày ${day}`;

            res.render('menu-build/ingredients', {
                user: req.user,
                errors: errors,
                menuBuild: menuBuild,
                dayDetails: dayDetails,
                ingredientsList: ingredientsList,
                menuTimes: menuTimes,
                week: parseInt(week),
                day: parseInt(day),
                dayName: dayName
            });
        } catch (error) {
            console.error('Error in menuBuild.calculateIngredients:', error);
            res.render('menu-build/ingredients', {
                user: req.user,
                errors: [error.message],
                menuBuild: null,
                dayDetails: [],
                ingredientsList: [],
                menuTimes: menuTimeService.getAllMenuTimes(),
                week: parseInt(req.params.week),
                day: parseInt(req.params.day),
                dayName: 'Ngày'
            });
        }
    },

    /**
     * Tính nguyên liệu cho 1 giờ ăn cụ thể
     */
    calculateIngredientsByMealTime: async (req, res) => {
        try {
            const user = req.user;
            const menuId = req.params.menuId;
            const week = parseInt(req.params.week);
            const day = parseInt(req.params.day);
            const mealTimeId = parseInt(req.params.mealTimeId);

            // Lấy thông tin menu build
            const menuResult = await commonService.getAllDataTable('menu_builds', {
                id: menuId,
                campaign_id: user.campaign_id
            });
            console.log('menuResult', menuResult);
            if (!menuResult.success || menuResult.data.length === 0) {
                return res.render('menu-build/ingredients-mealtime', {
                    user: user,
                    errors: ['Không tìm thấy thực đơn hoặc bạn không có quyền truy cập'],
                    menuBuild: null,
                    ingredientsList: [],
                    week: week,
                    day: day,
                    mealTimeId: mealTimeId,
                    mealTimeName: '',
                    dayLabel: ''
                });
            }

            const menuBuild = menuResult.data[0];
            console.log('menuBuild', menuBuild);
            // Lấy tên giờ ăn
            const mealTimeResult = await commonService.getAllDataTable('menu_time', { id: mealTimeId });
            console.log('mealTimeResult', mealTimeResult);
            const mealTimeName = mealTimeResult.success && mealTimeResult.data.length > 0
                ? mealTimeResult.data[0].name
                : `Giờ ăn ${mealTimeId}`;
            console.log('mealTimeName', mealTimeName);
            // Lấy chi tiết ngày
            const detailResult = await commonService.getAllDataTable('menu_build_details', {
                menu_build_id: menuId,
                week_number: week,
                day_of_week: day,
                menu_time_id: mealTimeId
            });
            console.log('detailResult', detailResult);
            let ingredientsList = [];

            if (detailResult.success && detailResult.data.length > 0) {
                const detailRecord = detailResult.data[0];
                let detailData = null;

                try {
                    detailData = JSON.parse(detailRecord.detail || '{}');
                } catch (e) {
                    console.error('Error parsing detail JSON:', e);
                }

                if (detailData && detailData.listFood && Array.isArray(detailData.listFood)) {
                    // Nhóm foods theo food_id
                    const foodsMap = new Map();

                    detailData.listFood.forEach(food => {
                        const foodId = food.food_id || food.id_food;
                        if (!foodId) return;

                        if (foodsMap.has(foodId)) {
                            const existing = foodsMap.get(foodId);
                            existing.total_weight += parseFloat(food.weight || 0);
                        } else {
                            foodsMap.set(foodId, {
                                food_id: foodId,
                                food_name: food.name || food.ten || 'N/A',
                                food_code: food.code || '',
                                total_weight: parseFloat(food.weight || 0),
                                unit: food.unit || 'g',
                                edible: parseFloat(food.edible || 100),
                                price: parseFloat(food.price || 0)
                            });
                        }
                    });

                    // Tính toán khối lượng cần mua
                    const tempList = Array.from(foodsMap.values()).map(item => {
                        const ediblePercent = item.edible / 100;
                        const purchaseWeight = ediblePercent > 0 ? item.total_weight / ediblePercent : item.total_weight;
                        const purchaseWeightKg = purchaseWeight / 1000;

                        return {
                            ...item,
                            purchase_weight: Math.round(purchaseWeight * 100) / 100,
                            purchase_weight_kg: purchaseWeightKg
                        };
                    });

                    // Lấy warehouse_id từ campaign
                    let warehouseId = null;
                    if (user.campaign_id) {
                        const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                            campaign_id: user.campaign_id,
                            active: 1
                        });
                        if (warehouseResult.success && warehouseResult.data.length > 0) {
                            warehouseId = warehouseResult.data[0].id;
                        }
                    }

                    // Tính chi phí theo FIFO nếu có kho
                    if (warehouseId) {
                        const costPromises = tempList.map(async (item) => {
                            const costResult = await inventoryService.calculateCostByFIFO(
                                warehouseId,
                                item.food_id,
                                item.purchase_weight_kg
                            );

                            return {
                                ...item,
                                total_cost: costResult.success ? Math.round(costResult.total_cost) : 0,
                                avg_price: costResult.success ? Math.round(costResult.avg_price) : item.price,
                                price_source: costResult.success ? (costResult.is_reference ? 'reference' : 'fifo') : 'reference',
                                fifo_details: costResult.details || []
                            };
                        });

                        ingredientsList = await Promise.all(costPromises);
                    } else {
                        // Không có kho, dùng giá tham khảo
                        ingredientsList = tempList.map(item => {
                            const totalCost = item.purchase_weight_kg * item.price;
                            return {
                                ...item,
                                total_cost: Math.round(totalCost),
                                avg_price: item.price,
                                price_source: 'reference',
                                fifo_details: []
                            };
                        });
                    }

                    // Sắp xếp theo tên
                    if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
                        ingredientsList.sort((a, b) => {
                            const nameA = a.food_name || '';
                            const nameB = b.food_name || '';
                            return nameA.localeCompare(nameB);
                        });
                    }
                }
            }

            const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayLabel = dayLabels[day] || `Ngày ${day}`;

            res.render('menu-build/ingredients-mealtime', {
                user: user,
                errors: [],
                menuBuild: menuBuild,
                ingredientsList: ingredientsList,
                week: week,
                day: day,
                mealTimeId: mealTimeId,
                mealTimeName: mealTimeName,
                dayLabel: dayLabel
            });

        } catch (error) {
            console.error('Error in calculateIngredientsByMealTime:', error);
            res.render('menu-build/ingredients-mealtime', {
                user: req.user,
                errors: [error.message],
                menuBuild: null,
                ingredientsList: [],
                week: 0,
                day: 0,
                mealTimeId: 0,
                mealTimeName: '',
                dayLabel: ''
            });
        }
    },

    /**
     * Calculate ingredients for a whole week
     */
    calculateWeekIngredients: async (req, res) => {
        try {
            const { menuId, week } = req.params;
            const user = req.user;
            const errors = [];
            let menuBuild = null;
            let weekDetails = [];
            let ingredientsList = [];

            // Lấy thông tin thực đơn
            const menuResult = await commonService.getAllDataTable('menu_builds', { id: menuId, active: 1 });

            if (!menuResult.success || menuResult.data.length === 0) {
                errors.push('Không tìm thấy thực đơn');
            } else {
                menuBuild = menuResult.data[0];

                // Kiểm tra quyền
                if (!user.isAdmin && menuBuild.created_by !== user.id) {
                    errors.push('Bạn không có quyền xem thực đơn này');
                    menuBuild = null;
                }
            }

            // Lấy chi tiết tất cả giờ ăn trong cả tuần (từ Thứ 2 đến Chủ nhật)
            if (menuBuild) {
                const detailsSql = `
                    SELECT
                        mbd.*,
                        mt.time as menu_time_name,
                        mt.order_sort,
                        d.day_name
                    FROM menu_build_details mbd
                    INNER JOIN menu_time mt ON mbd.menu_time_id = mt.id
                    LEFT JOIN (
                        SELECT 2 as day_value, 'Thứ 2' as day_name
                        UNION SELECT 3, 'Thứ 3'
                        UNION SELECT 4, 'Thứ 4'
                        UNION SELECT 5, 'Thứ 5'
                        UNION SELECT 6, 'Thứ 6'
                        UNION SELECT 7, 'Thứ 7'
                        UNION SELECT 8, 'Chủ nhật'
                    ) d ON mbd.day_of_week = d.day_value
                    WHERE mbd.menu_build_id = ?
                    AND mbd.week_number = ?
                    AND mbd.active = 1
                    ORDER BY mbd.day_of_week, mt.order_sort
                `;
                const detailsResult = await commonService.getListTable(detailsSql, [menuId, week]);
                if (detailsResult.success) {
                    weekDetails = detailsResult.data;
                    // Parse detail JSON
                    weekDetails.forEach(detail => {
                        if (detail.detail) {
                            try {
                                detail.detail = JSON.parse(detail.detail);
                            } catch (e) {
                                detail.detail = { courses: [], listFood: [] };
                            }
                        } else {
                            detail.detail = { courses: [], listFood: [] };
                        }
                    });

                    // Tổng hợp tất cả foods từ tất cả ngày và giờ ăn trong tuần
                    const allFoods = [];
                    weekDetails.forEach(detail => {
                        if (detail.detail.listFood && detail.detail.listFood.length > 0) {
                            detail.detail.listFood.forEach(food => {
                                allFoods.push({
                                    ...food,
                                    menu_time_name: detail.menu_time_name,
                                    day_name: detail.day_name || `Ngày ${detail.day_of_week}`
                                });
                            });
                        }
                    });

                    // Nhóm foods theo food_id và tính tổng
                    const foodsMap = new Map();
                    allFoods.forEach(food => {
                        const foodId = food.id_food || food.food_id;
                        if (!foodId) return;

                        if (foodsMap.has(foodId)) {
                            const existing = foodsMap.get(foodId);
                            existing.total_weight += parseFloat(food.weight) || 0;
                            existing.meal_times.add(`${food.day_name} - ${food.menu_time_name}`);
                        } else {
                            foodsMap.set(foodId, {
                                food_id: foodId,
                                name: food.name || food.food_name || 'N/A',
                                total_weight: parseFloat(food.weight) || 0,
                                edible: parseFloat(food.edible) || 100,
                                price: parseFloat(food.price) || 0,
                                unit: food.unit || 'g',
                                meal_times: new Set([`${food.day_name} - ${food.menu_time_name}`])
                            });
                        }
                    });

                    // Tính toán khối lượng cần mua
                    const tempList = Array.from(foodsMap.values()).map(item => {
                        const ediblePercent = item.edible / 100;
                        const purchaseWeight = ediblePercent > 0 ? item.total_weight / ediblePercent : item.total_weight;
                        const purchaseWeightKg = purchaseWeight / 100;

                        return {
                            ...item,
                            meal_times: Array.from(item.meal_times).join(', '),
                            purchase_weight: Math.round(purchaseWeight * 100) / 100,
                            purchase_weight_kg: purchaseWeightKg
                        };
                    });

                    // Lấy kho đầu tiên của campaign để tính chi phí FIFO
                    let warehouseId = null;
                    const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                        campaign_id: user.campaign_id,
                        active: 1
                    });
                    if (warehouseResult.success && warehouseResult.data.length > 0) {
                        warehouseId = warehouseResult.data[0].id;
                    }

                    // Tính chi phí theo FIFO nếu có kho
                    if (warehouseId) {
                        const costPromises = tempList.map(async (item) => {
                            const costResult = await inventoryService.calculateCostByFIFO(
                                warehouseId,
                                item.food_id,
                                item.purchase_weight_kg
                            );

                            return {
                                ...item,
                                total_cost: costResult.total_cost,
                                avg_price: costResult.avg_price,
                                is_reference: costResult.is_reference,
                                cost_details: costResult.details
                            };
                        });

                        ingredientsList = await Promise.all(costPromises);
                    } else {
                        // Không có kho, dùng giá tham khảo
                        ingredientsList = tempList.map(item => {
                            const pricePerKg = item.price || 0;
                            const totalCost = item.purchase_weight_kg * pricePerKg;

                            return {
                                ...item,
                                total_cost: Math.round(totalCost),
                                avg_price: pricePerKg,
                                is_reference: true,
                                cost_details: []
                            };
                        });
                    }

                    // Sắp xếp theo tên
                    if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
                        ingredientsList.sort((a, b) => {
                            const nameA = a.name || '';
                            const nameB = b.name || '';
                            return nameA.localeCompare(nameB);
                        });
                    }
                }
            }

            // Lấy danh sách giờ ăn
            const menuTimes = menuTimeService.getAllMenuTimes();

            // Tên ngày trong tuần để hiển thị
            const dayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

            res.render('menu-build/ingredients-week', {
                user: req.user,
                errors: errors,
                menuBuild: menuBuild,
                weekDetails: weekDetails,
                ingredientsList: ingredientsList,
                menuTimes: menuTimes,
                week: parseInt(week),
                dayNames: dayNames
            });
        } catch (error) {
            console.error('Error in menuBuild.calculateWeekIngredients:', error);
            res.render('menu-build/ingredients-week', {
                user: req.user,
                errors: [error.message],
                menuBuild: null,
                weekDetails: [],
                ingredientsList: [],
                menuTimes: menuTimeService.getAllMenuTimes(),
                week: parseInt(req.params.week),
                dayNames: ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
            });
        }
    }
};

module.exports = menuBuild;
