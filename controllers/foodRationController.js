var moment = require('moment'),
    commonService = require('../services/commonService');
const securityService = require('../services/securityService');
const dishCategoryService = require('../services/dishCategoryService');

let foodRation = {
    index: function (req, res) {
        const arrPromise = [];
        const errors = [];
        const user = req.user;
        const resultData = {
            menuTime: [],
            menuExample: [],
            detailPatient: {}
        }
        if (!user.isAdmin && !user.role_id.includes(7)) {
            errors.push('Bạn không có quyền truy cập danh sách này!');
        }

        arrPromise.push(commonService.getAllDataTable('menu_time', {}, { column: 'order_sort', type: 'asc' }, 'AND', 'id, time AS name').then(responseData => {
            if (responseData.success) {
                resultData.menuTime = responseData.data;
            } else {
                errors.push(responseData.message);
            }
        }));
        arrPromise.push(commonService.getAllDataTable('menu_example', securityService.applyRoleBasedFiltering(req.user, {}), {}, 'AND').then(responseData1 => {
            if (responseData1.success) {
                resultData.menuExample = responseData1.data;
            } else {
                errors.push(responseData1.message);
            }
        }));

        arrPromise.push(commonService.getAllDataTable('patients_research', securityService.applyRoleBasedFiltering(req.user, {id: req.params.patient_id}), {}, 'AND').then(responseData2 => {
            if (responseData2.success) {
                if(responseData2.data && responseData2.data.length > 0){
                    resultData.detailPatient = responseData2.data[0];
                }
            } else {
                errors.push(responseData2.message);
            }
        }));
        Promise.all(arrPromise).then(() => {
            return res.render('khau-phan-an/index', {
                user: user,
                errors: errors,
                menuExample: resultData.menuExample,
                menuTime: resultData.menuTime,
                menuExamine: JSON.parse(resultData.detailPatient.menu_example ? resultData.detailPatient.menu_example : '[]'),
                path:'khau-phan-an',
                patient: resultData.detailPatient,
                patient_id: req.params.patient_id,
                dishCategories: dishCategoryService.getAllCategories()
            });
        })
    },
    foodName: function (req, res) {
        try {
            var resultData = {
                success: false,
                message: "",
                data: []
            };
            if (!req.user) {
                resultData.message = "Vui lòng đăng nhập lại để thực hiện chức năng này!";
                res.json(resultData);
                return;
            }
            commonService.getAllDataTable('food_info', { name: { op: 'LIKE', value: '%' + req.query.search + '%' } }, {}, 'AND').then(async responseData => {
                if (responseData.success && responseData.data.length > 0) {
                    // Dữ liệu dinh dưỡng đã được gộp vào food_info, không cần JOIN với main_nutrients nữa
                    // Các trường dinh dưỡng đã có sẵn trong food_info
                    
                    resultData.message = "Thành công";
                    resultData.success = true;
                    resultData.data = responseData.data;
                } else {
                    resultData.message = "Tải dữ liệu thất bại!"
                    resultData.data = [];
                }
                res.json(resultData);
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Tải dữ liệu thất bại', error, 500))
        }
    },
    saveMenu: function (req, res) {
        var resultData = {
            success: false,
            message: "",
            data: null
        };
        
        const user = req.user;
        if (!user.isAdmin && !user.role_id.includes(7)) {
            resultData.message = 'Bạn không có quyền thực hiện chức năng này!';
            return res.json(resultData);
        }
        
        try {
            const { detail, patient_id } = req.body;
            
            // Validate dữ liệu đầu vào
            if (!detail) {
                resultData.message = 'Tên thực đơn và chi tiết không được để trống!';
                return res.json(resultData);
            }
            
            if (!patient_id) {
                resultData.message = 'Thiếu thông tin bệnh nhân!';
                return res.json(resultData);
            }
            
            const arrPromise = [];
            
            // Lưu/cập nhật vào patients_research
            arrPromise.push(
                commonService.getAllDataTable('patients_research', { id: patient_id, campaign_id: req.user.campaign_id }, {}, 'AND')
                    .then(responseData => {
                        if (responseData.success && responseData.data && responseData.data.length > 0) {
                            // Cập nhật bản ghi đã có
                            const updateData = {
                                menu_example: detail
                            };
                            return commonService.updateRecordTable(updateData, { id: patient_id }, 'patients_research');
                        } else {
                            throw new Error('Không tìm thấy bệnh nhân trong hệ thống nghiên cứu!');
                        }
                    })
                    .then(responseData => {
                        if (!responseData.success) {
                            throw new Error('Lưu thông tin bệnh nhân thất bại: ' + responseData.message);
                        }
                        return responseData;
                    })
            );
            
            Promise.all(arrPromise)
                .then(() => {
                    resultData.success = true;
                    resultData.message = 'Lưu thực đơn thành công!';
                    res.json(resultData);
                })
                .catch(error => {
                    resultData.message = error.message || 'Đã xảy ra lỗi trong quá trình lưu dữ liệu!';
                    res.json(resultData);
                });
                
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
        }
    },
        // API External - Tạo thực đơn mẫu từ hệ thống khác
    externalCreateMenuExample: async (req, res) => {
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
                share: req.body.share !== undefined ? parseInt(req.body.share) : 0,
                created_by: req.body.created_by || 2,
                campaign_id: req.body.campaign_id || 1,
                active: req.body.active ? parseInt(req.body.active) : 1
            };
            
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
            
            // Validate detail array structure
            let detailArray = parameter.detail;
            if (typeof detailArray === 'string') {
                try {
                    detailArray = JSON.parse(detailArray);
                } catch (e) {
                    resultData.message = 'Chi tiết thực đơn phải là một JSON hợp lệ!';
                    return res.json(resultData);
                }
            }
            
            if (!Array.isArray(detailArray)) {
                resultData.message = 'Chi tiết thực đơn phải là một mảng!';
                return res.json(resultData);
            }
            
            // Validate each item in detail array
            const detailErrors = foodRation.validateMenuDetail(detailArray);
            if (detailErrors.length > 0) {
                resultData.message = 'Cấu trúc chi tiết thực đơn không hợp lệ: ' + detailErrors.join(', ');
                return res.json(resultData);
            }
            
            // Convert detail array to JSON string if needed
            if (Array.isArray(parameter.detail)) {
                parameter.detail = JSON.stringify(parameter.detail);
            }
            
            // Tạo mới menu_example
            const responseData = await commonService.addRecordTable(parameter, 'menu_example', true);
            
            if (responseData.success && responseData.data) {
                resultData.data = { id: responseData.data.insertId };
                resultData.success = true;
                resultData.message = 'Thực đơn mẫu đã được tạo thành công!';
            } else {
                resultData.message = responseData.message || 'Không thể tạo thực đơn mẫu!';
            }
                
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý: ' + error.message;
        }
        
        res.json(resultData);
    },
    
    // Validate menu detail structure
    validateMenuDetail: function(detailArray) {
        const errors = [];
        
        if (!Array.isArray(detailArray) || detailArray.length === 0) {
            errors.push('Chi tiết thực đơn không được để trống!');
            return errors;
        }
        
        detailArray.forEach((item, index) => {
            const itemErrors = [];
            
            // Check id field
            if (item.id === undefined || item.id === null) {
                itemErrors.push(`mục ${index + 1}: id là bắt buộc`);
            } else if (typeof item.id !== 'number') {
                itemErrors.push(`mục ${index + 1}: id phải là số`);
            }
            
            // Check name field
            if (item.name === undefined || item.name === null) {
                itemErrors.push(`mục ${index + 1}: name là bắt buộc`);
            } else if (typeof item.name !== 'string') {
                itemErrors.push(`mục ${index + 1}: name phải là chuỗi`);
            }
            
            // Check courses field
            if (item.courses === undefined || item.courses === null) {
                itemErrors.push(`mục ${index + 1}: courses là bắt buộc`);
            } else if (!Array.isArray(item.courses)) {
                itemErrors.push(`mục ${index + 1}: courses phải là mảng`);
            }
            
            // Check listFood field
            if (item.listFood === undefined || item.listFood === null) {
                itemErrors.push(`mục ${index + 1}: listFood là bắt buộc`);
            } else if (!Array.isArray(item.listFood)) {
                itemErrors.push(`mục ${index + 1}: listFood phải là mảng`);
            }
            
            errors.push(...itemErrors);
        });
        
        return errors;
    }
}

module.exports = foodRation;