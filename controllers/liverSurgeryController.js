var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');

let liverSurgery = {
    index: function(req, res){
        try {
            const arrPromise = [];
            const errors = [];
            const patient_id = req.params.patient_id;
            const user = req.user;
            let patient = {};
            let detailLiverSurgery = {};
            let typeDetail = {view: 'index'};
            const type = req.params.type;
            if(user.isAdmin || user.role_id.includes(5)){
                // lấy thông tin cơ bản
                arrPromise.push(
                    commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, {id: patient_id})).then(responseData =>{
                        if(responseData.success){
                            if(responseData.data && responseData.data.length > 0){
                                patient = responseData.data[0];
                            }
                        }else{
                            errors.push(responseData.message);  
                        }
                    })
                )
            }else{
                errors.push('Bạn không có quyền truy cập bệnh nhân này!');
            }

            Promise.all(arrPromise).then(responseData =>{
                return res.render('cat-gan-nho/' + typeDetail.view, {
                    user: req.user,
                    errors: errors,
                    patient: patient,
                    moment: moment,
                    detailLiverSurgery: detailLiverSurgery,
                    type: type,
                    path: 'hoi-chan'
                });
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            return res.render("error");
        }
    },
    addBroading: function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                insertId: ''
            };
            const validateRules = [
                // { field: "time", type: "string", required: true, message: "Vui lòng chọn ngày!" }
            ];
            const parameter = liverSurgery.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(5) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền tạo danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                parameter.data['created_by'] = req.user.id;
                parameter.data['patient_id'] = req.params.patient_id;
                parameter.data['campaign_id'] = req.user.campaign_id;
                parameter.data.time = parameter.data.time.split("/").reverse().join("/");
                commonService.addRecordTable(parameter.data, parameter.table, true).then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                        resultData.insertId = responseData.data.insertId;
                    }else{
                        resultData.message = responseData.message;
                    }
                    res.json(resultData);
                })
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    updateBroading: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            const validateRules = [
                // { field: "time", type: "string", required: true, message: "Vui lòng chọn ngày!" }
            ];
            const parameter = liverSurgery.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            let id = req.body.id;
            if(!id){
                errors.push('Thiếu Id');
            }
            if(!req.user.role_id.includes(5) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền sửa danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                parameter.data.time = parameter.data.time.split("/").reverse().join("/");
                commonService.updateRecordTable(parameter.data, {id: req.body.id}, parameter.table).then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                    }else{
                        resultData.message = responseData.message;
                    }
                    res.json(resultData);
                })
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    dataBroading: function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                data: {}
            };
            let table = 'cat_gan_nho_kpa';
            if(!req.user.role_id.includes(5) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultMessage);
            }
            commonService.getAllDataTable(table, securityService.applyRoleBasedFiltering(req.user, {id: req.params.id})).then(responseData =>{
                if(responseData.success){
                    resultData.success = true;
                    if(responseData.data && responseData.data.length > 0){
                        resultData.data = responseData.data[0];
                    }else{
                        resultData.message = 'Không có dữ liệu';
                    }
                }else{
                    resultData.message = responseData.message;
                }
                return res.json(resultData);
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    deleteBroading: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            let id = req.params.id;
            let table = 'cat_gan_nho_kpa';
            if(!req.user.role_id.includes(5) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có xóa danh sách này!';
                return res.json(resultMessage);
            }
            if(id){
                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {id: id}), table).then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                    }else{
                        resultData.message = responseData.message;
                    }
                    return res.json(resultData);
                })
            }else{
                resultData.message = 'Thiếu Id bệnh nhân!';
                return res.json(resultData);
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    getDataBodyBroading: function(body, type){
        return {data: liverSurgery.khauPhanAn(body), table: 'cat_gan_nho_kpa'}
    },
    khauPhanAn: function(body){
        return {
            time: body.date,
            nd_duong_th: body.nd_duong_th,
            nd_tinh_mac: body.nd_tinh_mac,
            note: body.note,
            xet_nghiem: body.xet_nghiem,
            y_kien_bs: body.y_kien_bs
        }
    },
    getListTable: function(req, res, next){
        // Kiểm tra quyền truy cập
        if (!req.user.isAdmin && !req.user.role_id.includes(5)) {
            return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
        }

        // Cấu hình DataTable
        const config = {
            table: 'cat_gan_nho_kpa',
            primaryKey: 'id',
            active: 0,
            activeOperator: '!=',
            filters: {
                patient_id: req.params.patient_id
            },
            searchColumns: ['nd_duong_th', 'nd_tinh_mac'],
            columnsMapping: [
                'time', // column 0
                'nd_duong_th', // column 1
                'nd_tinh_mac', // column 2
                'note', // column 3
                'xet_nghiem', // column 4
                'y_kien_bs' // column 5
            ],
            defaultOrder: [
                { column: 'id', dir: 'DESC' }
            ],
            checkRole: false
        };

        // Xử lý request
        dataTableService.handleDataTableRequest(req, res, config);
        // try {
        //     var resultMessage = {
        //         "data": [],
        //         "error": "",
        //         "draw": "1",
        //         "recordsFiltered": 0,
        //         "recordsTotal": 0
        //     };
        //     var arrPromise = [],
        //         errors     = [],
        //         parameter  = {
        //             skip: isNaN(parseInt(req.body.start)) ? 0 : parseInt(req.body.start),
        //             take: isNaN(parseInt(req.body.length)) ? 15 : parseInt(req.body.length),
        //             search_value: req.body['search[value]'],
        //             table: 'cat_gan_nho_kpa',
        //             patient_id: req.params.patient_id,
        //             // user: req.user // Thêm thông tin user để áp dụng phân quyền
        //         };
        //     if(!req.user.role_id.includes(5) && !req.user.isAdmin){
        //         resultMessage.error = 'Bạn không có quyền truy cập danh sách này!';
        //         return res.json(resultMessage);
        //     }
        //     arrPromise.push(commonService.countAllBoarding(parameter).then(responseData =>{
        //         if(responseData.success){
        //             if(responseData.data && responseData.data.length > 0){
        //                 let count = responseData.data[0].count;
        //                 resultMessage.recordsFiltered = count;
        //                 resultMessage.recordsTotal = count;
        //             }
        //         }else{
        //             errors.push(responseData.message);
        //         }
        //     }));

        //     arrPromise.push(commonService.getAllBoarding(parameter).then(responseData =>{
        //         if(responseData.success){
        //             if(responseData.data && responseData.data.length > 0) resultMessage.data = responseData.data;
        //         }else{
        //             errors.push(responseData.message);
        //         }
        //     }));
        //     Promise.all(arrPromise).then(()=>{
        //         resultMessage.draw = req.body.draw;
        //         if(errors.length > 0){
        //             resultMessage.error = errors.join(', ');
        //         }
        //         return res.json(resultMessage);
        //     })
        // } catch (error) {
        //     commonService.saveLog(req, error.message, error.stack);
        //     res.json({
        //         "data": [],
        //         "error": "Có lỗi xảy ra, vui lòng thử lại sau!",
        //         "draw": "1",
        //         "recordsFiltered": 0,
        //         "recordsTotal": 0
        //     });
        // }
    }
}

module.exports = liverSurgery;