var bcrypt = require('bcrypt'),
    commonService   = require('../services/commonService'),
    moment = require('moment'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');    

let adminService = {
    index: (req, res) => {
        try {
            if(!req.user.isAdmin){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            res.render('admin/index', {user: req.user})
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    user: async (req, res) =>{
        try {
            let errors = [];
            let campaigns = [];
            if(!req.user.isAdmin){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            const listCampaign = await commonService.getAllDataTable('campaign', {active: 1});
            if (listCampaign.success && listCampaign.data) {
                campaigns = listCampaign.data.map(item => ({
                    label: item.name,
                    value: item.id
                }));
            }
            res.render('admin/user/list', {
                user: req.user,
                errors: errors,
                campaigns: JSON.stringify(campaigns)
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    menuExample: (req, res) =>{
        try {
            let errors = [];
            if(!req.user.isAdmin){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            res.render('admin/menuExample', {
                user: req.user,
                errors: errors
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    getDataEditTable: (req, res) =>{
        try {
            var resultData = {
                success: false,
                message: "",
                data: {}
            };
    
            let table = req.body.table;
            if(!req.user.isAdmin){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }
            if(!table){
                resultData.message = 'Thiếu dữ liệu bảng!';
                return res.json(resultData);
            }
            commonService.getAllDataTable(table, { id: req.body.id}).then(async responseData =>{
                if(responseData.success){
                    resultData.success = true;
                    if(responseData.data && responseData.data.length > 0){
                        resultData.data = responseData.data[0];
                        if(table == 'user'){
                            let role_user = await commonService.getAllDataTable('role_user', {user_id: req.body.id});
                            if(role_user.success && role_user.data && role_user.data.length > 0){
                                resultData.data['role'] = role_user.data.map(item => item.role_id);
                            }
                        } else if(table == 'menu_example'){
                            // Không cần xử lý thêm gì cho menu_example
                        } else if(table == 'food_info'){
                            // Dữ liệu dinh dưỡng đã được gộp vào food_info, không cần lấy từ main_nutrients
                        }
                        
                    }else{
                        resultData.message = 'Không có dữ liệu';
                    }
                }else{
                    resultData.message = responseData.message;
                }
                return res.json(resultData);
            }).catch(error => {
                commonService.saveLog(req, error.message, error.stack);
                res.json({
                    success: false,
                    message: "Có lỗi xảy ra, vui lòng thử lại sau!",
                    data: {}
                });
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    userList: (req, res) =>{

        // Cấu hình DataTable
        const config = {
            table: 'user',
            columns: ['id', 'fullname', 'email', 'active', 'campaign_id'],
            primaryKey: 'id',
            active: -1,
            activeOperator: '!=',
            filters: {},
            searchColumns: ['fullname', 'email', 'phone'],
            columnsMapping: [
                'fullname', // column 1
                'email', // column 2
                'role', // column 3
                'active' // column 4
            ],
            defaultOrder: [
                { column: 'id', dir: 'DESC' }
            ],
            checkRole: false // Admin only, check manual
        };

        // Function xử lý dữ liệu trước khi trả về
        const preprocessData = async (data) => {
            let role_user = await commonService.getAllDataTable('role_user',{});
            if(role_user.success && role_user.data && role_user.data.length > 0){
                for(let item of data){
                    let userRoles = role_user.data.filter(r => item.id == r.user_id).map(r => r.role_id);
                    item['role'] = userRoles;
                }
            }
            // Đảm bảo tất cả user đều có thuộc tính role
            for(let item of data){
                if(!item.hasOwnProperty('role')){
                    item['role'] = [];
                }
            }
            return data;
        };

        // Xử lý request với preprocessData
        dataTableService.handleDataTableRequest(req, res, config, preprocessData);
    },
    userUpsert: async (req, res) => {
        try {
            var resultData = {
                success: false,
                message: "",
                data: ''
            };
        
            // Quy tắc validate chung
            const validateRules = [
                { field: "fullname", type: "string", required: true, message: "Vui lòng nhập họ tên!" },
                { field: "email", type: "string", required: true, message: "Vui lòng nhập email!", 
                    customValidator: (value) => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        return emailRegex.test(value) ? null : "Định dạng email không hợp lệ";
                    } 
                }
            ];
        
            // Nếu là tạo mới, thêm validate cho password
            const isCreate = !req.body.id;
            if (isCreate) {
                validateRules.push({ 
                    field: "password", 
                    type: "string", 
                    required: true, 
                    message: "Vui lòng nhập mật khẩu!" 
                });
            }
        
            // Chuẩn bị tham số
            const parameter = {
                fullname: req.body.fullname,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
                gender: req.body.gender ? parseInt(req.body.gender) : 0,
                campaign_id: req.body.campaign_id ? parseInt(req.body.campaign_id) : 0,
                active: req.body.active ? parseInt(req.body.active) : 0,
            };
            
            // Xử lý role từ multi-select
            let role_ids = [];
            if (req.body.role) {
                // Nếu role là array (từ AJAX)
                if (Array.isArray(req.body.role)) {
                    role_ids = req.body.role;
                } else {
                    role_ids = [parseInt(req.body.role)];
                }
            } else if (req.body['role[]']) {
                // Nếu role là role[] (từ form serialize)
                if (Array.isArray(req.body['role[]'])) {
                    role_ids = req.body['role[]'].map(r => parseInt(r));
                } else {
                    role_ids = [parseInt(req.body['role[]'])];
                }
            }
        
            // Kiểm tra quyền admin
            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }
        
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
        
            // Validate role_ids
            if (!role_ids || role_ids.length === 0) {
                resultData.message = 'Vui lòng chọn quyền!';
                return res.json(resultData);
            }
        
            // Xử lý password
            if (parameter.password) {
                parameter.password = await bcrypt.hash(parameter.password, 10);
            } else if (!isCreate) {
                delete parameter.password; // Không cập nhật password nếu không có giá trị
            }
        
            // Lưu role_ids và xóa role khỏi parameter
            delete parameter.role;
    
            let responseData;
            if (isCreate) {
                // Kiểm tra email tồn tại
                let checkEmail = await commonService.getAllDataTable('user', {email: parameter.email});
                if(checkEmail.success && checkEmail.data && checkEmail.data.length > 0){
                    resultData.message = 'Email ' + parameter.email + ' đã tồn tại! Vui lòng chọn email khác.';
                    return res.json(resultData);
                }
                // Thêm mới user
                responseData = await commonService.addRecordTable(parameter, 'user', true);
                if (responseData.success && responseData.data) {
                    const userId = responseData.data.insertId;
                    // Thêm tất cả role cho user
                    for (let role_id of role_ids) {
                        await commonService.addRecordTable({ role_id, user_id: userId }, 'role_user');
                    }
                    resultData.data = { id: userId };
                }
            } else {
                // Kiểm tra email tồn tại
                let checkEmail = await commonService.getListTable('SELECT * FROM user WHERE email = ? AND id != ?', [parameter.email, req.body.id]);
                if(checkEmail.success && checkEmail.data && checkEmail.data.length > 0){
                    resultData.message = 'Email ' + parameter.email + ' đã tồn tại! Vui lòng chọn email khác.';
                    return res.json(resultData);
                }
                // Cập nhật user
                responseData = await commonService.updateRecordTable(parameter, { id: req.body.id }, 'user');
                if (responseData.success && responseData.data) {
                    // Lấy danh sách role hiện tại của user
                    let currentRolesRes = await commonService.getAllDataTable('role_user', { user_id: req.body.id });
                    let currentRoles = [];
                    if(currentRolesRes.success && currentRolesRes.data) {
                        currentRoles = currentRolesRes.data.map(r => r.role_id);
                    }
                    // Tìm role cần xóa (có trong DB nhưng không có trong role_ids)
                    let rolesToDelete = currentRoles.filter(r => !role_ids.includes(r));
                    // Tìm role cần thêm (có trong role_ids nhưng không có trong DB)
                    let rolesToAdd = role_ids.filter(r => !currentRoles.includes(r));
                    // Xóa role không còn
                    for(let role_id of rolesToDelete) {
                        await commonService.deleteRecordTable({ user_id: req.body.id, role_id }, {}, 'role_user');
                    }
                    // Thêm role mới
                    for(let role_id of rolesToAdd) {
                        await commonService.addRecordTable({ role_id, user_id: req.body.id }, 'role_user');
                    }
                }
            }
    
            resultData.success = responseData.success;
            resultData.message = responseData.success 
                ? (isCreate ? 'Lưu thành công!' : 'Cập nhật thành công!')
                : responseData.message;
            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    userDelete: async (req, res) =>{
        try {
            // Khởi tạo response mặc định
            const resultData = {
                success: false,
                message: '',
                data: null,
                error: null
            };
    
            // Lấy tham số từ request
            const { id } = req.params;
            const user = req.user;
            const table = 'user';
    
            // Kiểm tra quyền truy cập
            const allowedRoles = [1]; // Có thể mở rộng danh sách vai trò
            const hasPermission = user.isAdmin || (user.role_id && allowedRoles.some(role => user.role_id.includes(role)));
            
            if (!hasPermission) {
                throw new Error('Bạn không có quyền xóa danh sách này!');
            }
    
            // Kiểm tra ID
            if (!id) {
                throw new Error('Thiếu ID bản ghi!');
            }
    
            // Validate ID (giả sử ID là số)
            const recordId = parseInt(id, 10);
            if (isNaN(recordId)) {
                throw new Error('ID bản ghi không hợp lệ!');
            }
    
            // Cập nhật bản ghi
            const updateData = { active: -1 };
            const conditions = { id: recordId };
            
            const responseData = await commonService.updateRecordTable(updateData, conditions, table);
    
            // Xử lý kết quả
            if (!responseData || !responseData.success) {
                throw new Error('Không thể cập nhật bản ghi!');
            }
    
            resultData.success = responseData.success;
            resultData.message = responseData.success ? 'Xóa bản ghi thành công!' : responseData.message;
            resultData.data = responseData.data || null;
    
            return res.status(200).json(resultData);
    
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    
    // Campaign methods
    campaign: async (req, res) => {
        try {
            let errors = [];
            if(!req.user.isAdmin){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            res.render('admin/campaign/list', {
                user: req.user,
                errors: errors
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    campaignList: (req, res) => {
        try {
            // Cấu hình DataTable
            const config = {
                table: 'campaign',
                columns: ['id', 'name', 'created_by', 'created_at', 'active'],
                primaryKey: 'id',
                active: 0,
                activeOperator: '!=',
                filters: {},
                searchColumns: ['name'],
                columnsMapping: [
                    'name', // column 1
                    'created_by_name', // column 2
                    'created_at', // column 3
                    'active' // column 4
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: false
            };

            // Function xử lý dữ liệu trước khi trả về
            const preprocessData = async (data) => {
                for (let item of data) {
                    if (item.created_by) {
                        const userRes = await commonService.getAllDataTable('user', { id: item.created_by });
                        if (userRes.success && userRes.data && userRes.data.length > 0) {
                            item.created_by_name = userRes.data[0].fullname;
                        } else {
                            item.created_by_name = 'N/A';
                        }
                    } else {
                        item.created_by_name = 'N/A';
                    }
                }
                return data;
            };

            // Xử lý request với preprocessData
            dataTableService.handleDataTableRequest(req, res, config, preprocessData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json({
                "data": [],
                "error": "Có lỗi xảy ra, vui lòng thử lại sau!",
                "draw": "1",
                "recordsFiltered": 0,
                "recordsTotal": 0
            });
        }
    },
    
    campaignUpsert: async (req, res) => {
        try {
            var resultData = {
                success: false,
                message: "",
                data: ''
            };
        
            // Quy tắc validate
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên chiến dịch!" }
            ];
        
            // Chuẩn bị tham số
            const parameter = {
                name: req.body.name,
                active: req.body.active ? parseInt(req.body.active) : 1,
                created_by: req.user.id
            };
            
            const isCreate = !req.body.id;
        
            // Kiểm tra quyền admin
            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }
        
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
        
            let responseData;
            if (isCreate) {
                // Kiểm tra tên campaign tồn tại
                let checkName = await commonService.getAllDataTable('campaign', {name: parameter.name, active: 1});
                if(checkName.success && checkName.data && checkName.data.length > 0){
                    resultData.message = 'Tên chiến dịch "' + parameter.name + '" đã tồn tại! Vui lòng chọn tên khác.';
                    return res.json(resultData);
                }
                // Thêm mới campaign
                responseData = await commonService.addRecordTable(parameter, 'campaign', true);
                if (responseData.success && responseData.data) {
                    resultData.data = { id: responseData.data.insertId };
                }
            } else {
                // Kiểm tra tên campaign tồn tại
                let checkName = await commonService.getListTable('SELECT * FROM campaign WHERE name = ? AND id != ? AND active = 1', [parameter.name, req.body.id]);
                if(checkName.success && checkName.data && checkName.data.length > 0){
                    resultData.message = 'Tên chiến dịch "' + parameter.name + '" đã tồn tại! Vui lòng chọn tên khác.';
                    return res.json(resultData);
                }
                // Cập nhật campaign
                delete parameter.created_by; // Không cập nhật created_by khi edit
                responseData = await commonService.updateRecordTable(parameter, { id: req.body.id }, 'campaign');
            }
    
            resultData.success = responseData.success;
            resultData.message = responseData.success 
                ? (isCreate ? 'Lưu thành công!' : 'Cập nhật thành công!')
                : responseData.message;
            res.json(resultData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    
    campaignDelete: async (req, res) => {
        try {
            // Khởi tạo response mặc định
            const resultData = {
                success: false,
                message: '',
                data: null,
                error: null
            };
    
            // Lấy tham số từ request
            const { id } = req.params;
            const user = req.user;
            const table = 'campaign';
    
            // Kiểm tra quyền truy cập
            if (!user.isAdmin) {
                throw new Error('Bạn không có quyền xóa danh sách này!');
            }
    
            // Kiểm tra ID
            if (!id) {
                throw new Error('Thiếu ID bản ghi!');
            }
    
            // Validate ID
            const recordId = parseInt(id, 10);
            if (isNaN(recordId)) {
                throw new Error('ID bản ghi không hợp lệ!');
            }
    
            // Kiểm tra xem có user nào đang sử dụng campaign này không
            const usersUsingCampaign = await commonService.getAllDataTable('user', {campaign_id: recordId, active: 1});
            if(usersUsingCampaign.success && usersUsingCampaign.data && usersUsingCampaign.data.length > 0){
                throw new Error('Không thể xóa chiến dịch này vì đang có ' + usersUsingCampaign.data.length + ' người dùng sử dụng!');
            }
    
            // Cập nhật bản ghi (soft delete)
            const updateData = { active: -1 };
            const conditions = { id: recordId };
            
            const responseData = await commonService.updateRecordTable(updateData, conditions, table);
    
            // Xử lý kết quả
            if (!responseData || !responseData.success) {
                throw new Error('Không thể cập nhật bản ghi!');
            }
    
            resultData.success = responseData.success;
            resultData.message = responseData.success ? 'Xóa chiến dịch thành công!' : responseData.message;
            resultData.data = responseData.data || null;
    
            return res.status(200).json(resultData);
    
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || "Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    getCampaignOptions: async (req, res) => {
        try {
            // Kiểm tra quyền admin
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập chức năng này!'
                });
            }

            // Lấy danh sách campaign active
            const campaignResult = await commonService.getAllDataTable('campaign', { active: 1 });

            if (!campaignResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể lấy danh sách campaign!'
                });
            }

            // Format dữ liệu cho select option
            const campaigns = campaignResult.data.map(campaign => ({
                value: campaign.id,
                label: campaign.name
            }));

            return res.json({
                success: true,
                data: campaigns
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách campaign!'
            });
        }
    },

    switchCampaign: async (req, res) => {
        try {
            // Kiểm tra quyền admin
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền thực hiện chức năng này!'
                });
            }

            const { campaign_id } = req.body;

            // Validate campaign_id
            if (!campaign_id || isNaN(parseInt(campaign_id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Campaign ID không hợp lệ!'
                });
            }

            const campaignId = parseInt(campaign_id);

            // Kiểm tra campaign có tồn tại và active không
            const campaignResult = await commonService.getAllDataTable('campaign', {
                id: campaignId,
                active: 1
            });

            if (!campaignResult.success || !campaignResult.data || campaignResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Campaign không tồn tại hoặc không hoạt động!'
                });
            }

            // Cập nhật campaign_id trực tiếp trong bảng user
            const updateUserResult = await commonService.updateRecordTable(
                { campaign_id: campaignId },
                { id: req.user.id },
                'user'
            );

            if (!updateUserResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể cập nhật campaign cho user!'
                });
            }

            // Clear user cache để force reload user data
            const cacheService = require('../services/cacheService');
            cacheService.invalidateUser(req.user.id);

            // Cập nhật campaign_id trong req.user để phản ánh ngay lập tức
            req.user.campaign_id = campaignId;

            return res.json({
                success: true,
                message: 'Đã chuyển đổi campaign thành công!',
                data: {
                    campaign_id: campaignId,
                    campaign_name: campaignResult.data[0].name
                }
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi chuyển đổi campaign!'
            });
        }
    },

    // Thực đơn mẫu methods
    menuExampleList: async (req, res) => {
        try {
            let errors = [];
            let menuTime = [];
            
            // Lấy danh sách thời gian ăn
            const menuTimeRes = await commonService.getAllDataTable('menu_time', {});
            if (menuTimeRes.success && menuTimeRes.data) {
                menuTime = menuTimeRes.data.map(item => ({
                    id: item.id,
                    name: item.time
                }));
            }
            
            res.render('admin/thuc-don-mau/list', {
                user: req.user,
                errors: errors,
                menuTime: menuTime
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    menuExampleDetail: async (req, res) => {
        try {
            const errors = [];
            const user = req.user;
            const id = req.params.id;
            let menuExamine = [];
            let menuTime = [];
            
            // Lấy danh sách thời gian ăn trước
            const menuTimeRes = await commonService.getAllDataTable('menu_time', {});
            if (menuTimeRes.success && menuTimeRes.data) {
                menuTime = menuTimeRes.data.map(item => ({
                    id: item.id,
                    name: item.time
                }));
            }
            
            // Lấy thông tin thực đơn mẫu hiện tại hoặc tạo mới
            if (id && id !== 'new') {
                const currentMenuRes = await commonService.getAllDataTable('menu_example', { id: id });
                if (currentMenuRes.success && currentMenuRes.data && currentMenuRes.data.length > 0) {
                    const currentMenu = currentMenuRes.data[0];
                    // Parse detail JSON
                    if (currentMenu.detail) {
                        try {
                            const detail = JSON.parse(currentMenu.detail);
                            menuExamine = [{
                                id: currentMenu.id,
                                name: currentMenu.name_menu,
                                detail: detail,
                                note: '',
                                isExisting: true
                            }];
                        } catch (e) {
                            // Tạo thực đơn trống nếu không parse được
                            menuExamine = [{
                                id: currentMenu.id,
                                name: currentMenu.name_menu,
                                detail: menuTime.map(time => ({
                                    id: time.id,
                                    name: time.name,
                                    name_course: '',
                                    listFood: []
                                })),
                                note: '',
                                isExisting: true
                            }];
                        }
                    } else {
                        // Tạo thực đơn trống nếu chưa có detail
                        menuExamine = [{
                            id: currentMenu.id,
                            name: currentMenu.name_menu,
                            detail: menuTime.map(time => ({
                                id: time.id,
                                name: time.name,
                                name_course: '',
                                listFood: []
                            })),
                            note: '',
                            isExisting: true
                        }];
                    }
                }
            } else if (id === 'new') {
                // Tạo thực đơn mẫu trống cho chế độ tạo mới
                menuExamine = [{
                    id: 'new',
                    name: 'Thực đơn mới',
                    detail: menuTime.map(time => ({
                        id: time.id,
                        name: time.name,
                        name_course: '',
                        listFood: []
                    })),
                    note: '',
                    isExisting: false
                }];
            }
            
            res.render('admin/thuc-don-mau/index', {
                user: user,
                errors: errors,
                menuExamine: menuExamine,
                menuTime: menuTime
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    menuExampleListData: (req, res) => {
        try {
            // Kiểm tra quyền truy cập
            if (!req.user.isAdmin) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }

            // Cấu hình DataTable
            const config = {
                table: 'menu_example',
                columns: ['id', 'name_menu', 'created_by', 'created_at'],
                primaryKey: 'id',
                active: 0,
                activeOperator: '!=',
                filters: securityService.applyRoleBasedFiltering(req.user, {}),
                searchColumns: ['name_menu'],
                columnsMapping: [
                    'name_menu', // column 1
                    'created_at', // column 2
                    'created_by_name', // column 3
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: false
            };

            // Function xử lý dữ liệu trước khi trả về
            const preprocessData = async (data) => {
                for (let item of data) {
                    if (item.created_by) {
                        const userRes = await commonService.getAllDataTable('user', { id: item.created_by });
                        if (userRes.success && userRes.data && userRes.data.length > 0) {
                            item.created_by_name = userRes.data[0].fullname;
                        } else {
                            item.created_by_name = 'N/A';
                        }
                    } else {
                        item.created_by_name = 'N/A';
                    }
                }
                return data;
            };

            // Xử lý request với preprocessData
            dataTableService.handleDataTableRequest(req, res, config, preprocessData);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json({
                draw: req.body.draw || 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                error: 'Có lỗi xảy ra khi tải dữ liệu'
            });
        }
    },
    
    menuExampleUpsert: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const validateRules = [
                { field: "name_menu", type: "string", required: true, message: "Vui lòng nhập tên thực đơn!" }
            ];
            
            const parameter = {
                name_menu: req.body.name_menu,
                detail: req.body.detail || '[]',
                share: req.body.share ? parseInt(req.body.share) : 0,
                created_by: req.user.id,
                campaign_id: req.user.campaign_id
            };
            
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
            
            const isCreate = !req.body.id;
            let responseData;
            
            if (isCreate) {
                responseData = await commonService.addRecordTable(parameter, 'menu_example', true);
                if (responseData.success && responseData.data) {
                    resultData.data = { id: responseData.data.insertId };
                }
            } else {
                delete parameter.created_by; // Không cập nhật created_by khi edit
                delete parameter.campaign_id; // Không cập nhật campaign_id khi edit
                responseData = await commonService.updateRecordTable(parameter, { id: req.body.id }, 'menu_example');
            }
            
            resultData.success = responseData.success;
            resultData.message = responseData.success 
                ? (isCreate ? 'Lưu thành công!' : 'Cập nhật thành công!')
                : responseData.message;
                
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }
        
        res.json(resultData);
    },
    
    menuExampleDelete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null,
            error: null
        };

        try {
            const { id } = req.params;
            const user = req.user;

            // Kiểm tra quyền truy cập
            if (!user.isAdmin) {
                throw new Error('Bạn không có quyền xóa danh sách này!');
            }

            // Kiểm tra ID
            if (!id) {
                throw new Error('Thiếu ID bản ghi!');
            }

            const recordId = parseInt(id, 10);
            if (isNaN(recordId)) {
                throw new Error('ID bản ghi không hợp lệ!');
            }

            // Xóa bản ghi (soft delete)
            const updateData = { active: -1 };
            const conditions = { id: recordId };
            
            const responseData = await commonService.updateRecordTable(updateData, conditions, 'menu_example');

            if (!responseData || !responseData.success) {
                throw new Error('Không thể xóa bản ghi!');
            }

            resultData.success = responseData.success;
            resultData.message = 'Xóa thực đơn mẫu thành công!';
            resultData.data = responseData.data || null;

            return res.status(200).json(resultData);

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    
    // Thực phẩm methods
    foodList: (req, res) => {
        try{
            let errors = [];
            res.render('admin/thuc-pham/list', {
                user: req.user,
                errors: errors
            });
        }catch(error){
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    foodDetail: async (req, res) => {
        const errors = [];
        const user = req.user;
        const id = req.params.id;
        let foodData = null;
        let mainNutrients = null;
        
        try {
            if (id && id !== 'new') {
                // Lấy thông tin thực phẩm hiện tại (đã bao gồm dữ liệu dinh dưỡng)
                const currentFoodRes = await commonService.getAllDataTable('food_info', { id: id });
                if (currentFoodRes.success && currentFoodRes.data && currentFoodRes.data.length > 0) {
                    foodData = currentFoodRes.data[0];
                    // Dữ liệu dinh dưỡng đã có trong foodData
                }
            }
            
        } catch (error) {
            errors.push('Có lỗi xảy ra khi tải dữ liệu: ' + error.message);
            commonService.saveLog(req, error.message, error.stack)
        }
        
        res.render('admin/thuc-pham/index', {
            user: user,
            errors: errors,
            foodData: foodData,
            mainNutrients: mainNutrients,
            isEdit: id && id !== 'new'
        });
    },
    
    foodListData: (req, res) => {
        // Kiểm tra quyền truy cập
        if (!req.user.isAdmin) {
            return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
        }

        // Cấu hình DataTable
        const config = {
            table: 'food_info',
            columns: ['id', 'code', 'name', 'type', 'type_year', 'ten', 'weight', 'protein', 'created_at', 'energy'],
            primaryKey: 'id',
            filters: {},
            searchColumns: ['name'],
            columnsMapping: [
                'name', // column 2
                'type', // column 3
                'type_year', // column 4
                'ten', // column 4
                'weight', // column 5
                'protein', // column 6
                'energy', // column 7
                'created_at' // column 7
            ],
            defaultOrder: [
                { column: 'id', dir: 'DESC' }
            ],
            checkRole: false
        };

        // Function xử lý dữ liệu trước khi trả về
        const preprocessData = async (data) => {
            // Dữ liệu energy đã có sẵn trong food_info, không cần JOIN với main_nutrients
            return data;
        };

        // Xử lý request với preprocessData
        dataTableService.handleDataTableRequest(req, res, config, preprocessData);
    },
    
    foodUpsert: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên thực phẩm!" },
                { field: "weight", type: "number", required: true, message: "Vui lòng nhập khối lượng!" }
            ];

            // Ensure all required fields are properly formatted and match database schema
            // Remove null values to avoid column count mismatch
            const foodParameterRaw = {
                code: req.body.code || null,
                name: req.body.name,
                type: req.body.type || 'raw',
                type_year: req.body.type_year || '2017',
                ten: req.body.ten || null,
                active: req.body.active ? parseInt(req.body.active) : 1,
                total_sugar: req.body.total_sugar || null,
                galactose: req.body.galactose || null,
                maltose: req.body.maltose || null,
                lactose: req.body.lactose || null,
                fructose: req.body.fructose || null,
                glucose: req.body.glucose || null,
                sucrose: req.body.sucrose || null,
                lycopene: req.body.lycopene || null,
                lutein_zeaxanthin: req.body.lutein_zeaxanthin || null,
                total_isoflavone: req.body.total_isoflavone || null,
                daidzein: req.body.daidzein || null,
                genistein: req.body.genistein || null,
                glycetin: req.body.glycetin || null,
                phytosterol: req.body.phytosterol || null,
                purine: req.body.purine || null,
                weight: req.body.weight ? parseInt(req.body.weight) : null,
                protein: req.body.protein || null,
                lysin: req.body.lysin || null,
                methionin: req.body.methionin || null,
                tryptophan: req.body.tryptophan || null,
                phenylalanin: req.body.phenylalanin || null,
                threonin: req.body.threonin || null,
                isoleucine: req.body.isoleucine || null,
                arginine: req.body.arginine || null,
                histidine: req.body.histidine || null,
                alanine: req.body.alanine || null,
                aspartic_acid: req.body.aspartic_acid || null,
                glutamic_acid: req.body.glutamic_acid || null,
                glycine: req.body.glycine || null,
                proline: req.body.proline || null,
                serine: req.body.serine || null,
                animal_protein: req.body.animal_protein || null,
                cystine: req.body.cystine || null,
                valine: req.body.valine || null,
                tyrosine: req.body.tyrosine || null,
                leucine: req.body.leucine || null,
                lignoceric: req.body.lignoceric || null,
                animal_lipid: req.body.animal_lipid || null,
                unanimal_lipid: req.body.unanimal_lipid || null,
                riboflavin: req.body.riboflavin || null,
                thiamine: req.body.thiamine || null,
                niacin: req.body.niacin || null,
                pantothenic_acid: req.body.pantothenic_acid || null,
                folic_acid: req.body.folic_acid || null,
                biotin: req.body.biotin || null,
                caroten: req.body.caroten || null,
                vitamin_a_rae: req.body.vitamin_a_rae || null,
                vitamin_b6: req.body.vitamin_b6 || null,
                vitamin_b12: req.body.vitamin_b12 || null,
                vitamin_c: req.body.vitamin_c || null,
                vitamin_e: req.body.vitamin_e || null,
                vitamin_k: req.body.vitamin_k || null,
                choline: req.body.choline || null,
                taurine: req.body.taurine || null,
                b_carotene: req.body.b_carotene || null,
                a_carotene: req.body.a_carotene || null,
                b_cryptoxanthin: req.body.b_cryptoxanthin || null,
                edible: req.body.edible ? parseInt(req.body.edible) : null,
                energy: req.body.energy ? parseInt(req.body.energy) : null,
                water: req.body.water || null,
                fat: req.body.fat || null,
                carbohydrate: req.body.carbohydrate || null,
                fiber: req.body.fiber || null,
                ash: req.body.ash || null,
                calci: req.body.calci ? parseFloat(req.body.calci) : null,
                phosphorous: req.body.phosphorous || null,
                fe: req.body.fe || null,
                zinc: req.body.zinc || null,
                sodium: req.body.sodium ? parseInt(req.body.sodium) : null,
                potassium: req.body.potassium ? parseInt(req.body.potassium) : null,
                magnesium: req.body.magnesium ? parseInt(req.body.magnesium) : null,
                manganese: req.body.manganese || null,
                copper: req.body.copper ? parseInt(req.body.copper) : null,
                selenium: req.body.selenium || null,
                total_saturated_fat: req.body.total_saturated_fat || null,
                palmitic: req.body.palmitic || null,
                margaric: req.body.margaric || null,
                stearic: req.body.stearic || null,
                arachidic: req.body.arachidic || null,
                behenic: req.body.behenic || null,
                mufa: req.body.mufa || null,
                myristoleic: req.body.myristoleic || null,
                palmitoleic: req.body.palmitoleic || null,
                oleic: req.body.oleic || null,
                pufa: req.body.pufa || null,
                linoleic: req.body.linoleic || null,
                linolenic: req.body.linolenic || null,
                arachidonic: req.body.arachidonic || null,
                dha: req.body.dha || null,
                trans_fatty_acids: req.body.trans_fatty_acids || null,
                cholesterol: req.body.cholesterol || null,
                vitamin_d: req.body.vitamin_d || null,
                vitamin_d_ui: req.body.vitamin_d_ui || null,
                vitamin_a_ui: req.body.vitamin_a_ui || null,
                mct: req.body.mct || null,
                epa: req.body.epa || null,
                note: req.body.note || null,
                created_by: req.user.id || null
            };

            // Remove null values to avoid column count mismatch
            const foodParameter = {};
            for (const [key, value] of Object.entries(foodParameterRaw)) {
                if (value !== null && value !== undefined) {
                    foodParameter[key] = value;
                }
            }

            // Validate input
            const errors = securityService.validateInput(foodParameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }

            const isCreate = !req.body.id;
            let responseData;
            let foodId;
            if (isCreate) {
                //Kiểm tra code đã tồn tại
                if (foodParameter.code) {
                    let checkCode = await commonService.getAllDataTable('food_info', { code: foodParameter.code, active: 1 });
                    if (checkCode.success && checkCode.data && checkCode.data.length > 0) {
                        resultData.message = 'Mã thực phẩm "' + foodParameter.code + '" đã tồn tại! Vui lòng chọn mã khác.';
                        return res.json(resultData);
                    }
                }
                // Thêm mới food_info (không dùng isCreated_at để tránh lỗi column count)
                responseData = await commonService.addRecordTable(foodParameter, 'food_info', true);

                if (responseData.success && responseData.data) {
                    foodId = responseData.data.insertId;
                    resultData.data = { id: foodId };
                } else {
                    console.log('Insert failed:', responseData.message);
                }
            } else {
                foodId = req.body.id;
                delete foodParameter.created_by; // Không cập nhật created_by khi edit
                delete foodParameter.code; // Không cập nhật code khi edit để tránh trùng lặp
                // Cập nhật food_info (đã bao gồm tất cả dữ liệu dinh dưỡng)
                responseData = await commonService.updateRecordTable(foodParameter, { id: foodId }, 'food_info');
            }
            
            resultData.success = responseData.success;
            resultData.message = responseData.success 
                ? (isCreate ? 'Lưu thành công!' : 'Cập nhật thành công!')
                : responseData.message;
                
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }
        
        res.json(resultData);
    },
    
    foodDelete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null,
            error: null
        };

        try {
            const { id } = req.params;
            const user = req.user;

            // Kiểm tra quyền truy cập
            if (!user.isAdmin) {
                throw new Error('Bạn không có quyền xóa danh sách này!');
            }

            // Kiểm tra ID
            if (!id) {
                throw new Error('Thiếu ID bản ghi!');
            }

            const recordId = parseInt(id, 10);
            if (isNaN(recordId)) {
                throw new Error('ID bản ghi không hợp lệ!');
            }

            // Xóa bản ghi từ food_info (hard delete vì không có trường active)
            const responseData = await commonService.deleteRecordTable({ id: recordId }, {}, 'food_info');
            
            if (!responseData || !responseData.success) {
                throw new Error('Không thể xóa bản ghi!');
            }
            
            // Không cần xóa main_nutrients vì dữ liệu đã được gộp vào food_info

            resultData.success = responseData.success;
            resultData.message = 'Xóa thực phẩm thành công!';
            resultData.data = responseData.data || null;

            return res.status(200).json(resultData);

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },

    // Log Management Methods
    logs: async (req, res) => {
        try {
            let errors = [];
            if(!req.user.isAdmin){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            res.render('admin/admin-logs/index', {
                user: req.user,
                errors: errors
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },

    auditLogsList: (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }

            // Cấu hình DataTable
            const config = {
                table: 'audit_logs',
                columns: ['id', 'user_id', 'email', 'action', 'resource', 'ip_address', 'created_at'],
                primaryKey: 'id',
                filters: {},
                searchColumns: ['email', 'action', 'resource', 'ip_address'],
                columnsMapping: [
                    'user_id', // column 2
                    'email', // column 3
                    'action', // column 4
                    'resource', // column 5
                    'ip_address', // column 6
                    'created_at' // column 7
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: false
            };

            // Xử lý request
            dataTableService.handleDataTableRequest(req, res, config);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    authLogsList: (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }

            // Cấu hình DataTable
            const config = {
                table: 'auth_logs',
                columns: ['id', 'email', 'action', 'success', 'ip_address', 'created_at'],
                primaryKey: 'id',
                filters: {},
                searchColumns: ['email', 'action', 'ip_address'],
                columnsMapping: [
                    'email', // column 2
                    'action', // column 3
                    'success', // column 4
                    'ip_address', // column 5
                    'created_at' // column 6
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: false
            };

            // Xử lý request
            dataTableService.handleDataTableRequest(req, res, config);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    activityLogsList: (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }

            // Cấu hình DataTable
            const config = {
                table: 'log_activities',
                columns: ['id', 'user_id', 'action', 'resource', 'details', 'ip_address', 'created_at'],
                primaryKey: 'id',
                filters: {},
                searchColumns: ['action', 'resource', 'details', 'ip_address'],
                columnsMapping: [
                    'user_id', // column 2
                    'name', // column 3
                    'message', // column 4
                    'url', // column 5
                    'method', // column 6
                    'ip', // column 7
                    'created_at' // column 7
                ],
                defaultOrder: [
                    { column: 'id', dir: 'DESC' }
                ],
                checkRole: false
            };

            // Xử lý request
            dataTableService.handleDataTableRequest(req, res, config);;
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },

    // Delete individual log methods
    deleteAuditLog: async (req, res) => {
        try {
            let resultData = securityService.createErrorResponse("Xóa log thất bại");

            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            const logId = parseInt(req.params.id);
            if (!logId) {
                resultData.message = 'ID log không hợp lệ';
                return res.json(resultData);
            }

            const responseData = await commonService.deleteRecordTable1({ id: logId }, 'audit_logs');

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa audit log thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa audit log thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    },

    deleteAuthLog: async (req, res) => {
        try {
            let resultData = securityService.createErrorResponse("Xóa log thất bại");

            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            const logId = parseInt(req.params.id);
            if (!logId) {
                resultData.message = 'ID log không hợp lệ';
                return res.json(resultData);
            }

            const responseData = await commonService.deleteRecordTable1({ id: logId }, 'auth_logs');

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa auth log thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa auth log thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    },

    deleteActivityLog: async (req, res) => {
        try {
            let resultData = securityService.createErrorResponse("Xóa log thất bại");

            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            const logId = parseInt(req.params.id);
            if (!logId) {
                resultData.message = 'ID log không hợp lệ';
                return res.json(resultData);
            }

            const responseData = await commonService.deleteRecordTable1({ id: logId }, 'log_activities');

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa activity log thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa activity log thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    },

    // Clear all logs methods
    clearAllAuditLogs: async (req, res) => {
        const resultData = securityService.createErrorResponse("Xóa toàn bộ audit logs thất bại");
        try {

            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            // Use raw SQL to truncate table for better performance
            const responseData = await commonService.getListTable('TRUNCATE TABLE audit_logs', []);

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa toàn bộ audit logs thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa toàn bộ audit logs thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    },

    clearAllAuthLogs: async (req, res) => {
         const resultData = securityService.createErrorResponse("Xóa toàn bộ auth logs thất bại");
        try {

            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            // Use raw SQL to truncate table for better performance
            const responseData = await commonService.getListTable('TRUNCATE TABLE auth_logs', []);

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa toàn bộ auth logs thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa toàn bộ auth logs thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    },

    clearAllActivityLogs: async (req, res) => {
        const resultData = securityService.createErrorResponse("Xóa toàn bộ activity logs thất bại");
        try {
            
            if (!req.user.isAdmin) {
                resultData.message = 'Bạn không có quyền thực hiện thao tác này!';
                return res.json(resultData);
            }

            // Use raw SQL to truncate table for better performance
            const responseData = await commonService.getListTable('TRUNCATE TABLE log_activities', []);

            if (responseData.success) {
                resultData.success = true;
                resultData.message = 'Xóa toàn bộ activity logs thành công!';
            } else {
                resultData.message = responseData.message || 'Xóa toàn bộ activity logs thất bại!';
            }

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }

        res.json(resultData);
    }
}

module.exports = adminService;
