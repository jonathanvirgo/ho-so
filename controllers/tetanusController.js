var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');

let tetanus = {
    index: function(req, res){
        try {
            const arrPromise = [];
            const errors = [];
            const patient_id = req.params.patient_id;
            const user = req.user;
            let patient = {};
            let detailTetanus = {};
            let times = [];
            let listMed = [];
            let tetanusMed = [];
            let timeActiveId;
            let typeDetail = {view: 'index'};
            const type = req.params.type;
            if(user.isAdmin || user.role_id.includes(4)){
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
                typeDetail = tetanus.getTypeDetail(type);
                // Lấy thông tin uốn ván
                if(typeDetail.isData){
                    arrPromise.push(
                        tetanus.getDataTetanus(patient_id, typeDetail.isTime, typeDetail.table, req.user).then(responseData =>{
                            detailTetanus = responseData.detailTetanus;
                            tetanusMed = commonService.isJSON(detailTetanus.thuoc) ? JSON.parse(detailTetanus.thuoc) : [];
                            times = responseData.listTime;
                            timeActiveId = responseData.timeActiveId;
                        })
                    );
                }
                if(typeDetail.isMedicine){
                    arrPromise.push(
                        commonService.getAllDataTable('uon_van_med', securityService.applyRoleBasedFiltering(req.user, {active: 1})).then(responseData =>{
                            if(responseData.success && responseData.data && responseData.data.length > 0){
                                listMed = responseData.data;
                            }
                        })
                    );

                }
            }else{
                errors.push('Bạn không có quyền truy cập bệnh nhân này!');
            }

            Promise.all(arrPromise).then(responseData =>{
                return res.render('uon-van/' + typeDetail.view, {
                    user: req.user,
                    errors: errors,
                    patient: patient,
                    moment: moment,
                    detailTetanus: detailTetanus,
                    times: times,
                    type: type,
                    timeActiveId: timeActiveId, 
                    listMed: listMed,
                    tetanusMed: tetanusMed,
                    order: 1,
                    path: 'uon-van'
                });
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    getDataTetanus: function(patient_id, isTime, table, user){
        return new Promise(async (resolve, reject) => {
            try {
                let detailTetanus = {};
                let listTime = [];
                let condition = securityService.applyRoleBasedFiltering(user, {patient_id: patient_id, active: 1});
                let timeActiveId;
                if(isTime){
                    // Get list time
                    switch(table){
                        case 'uon_van_ls': condition['type'] = 'lam-sang';
                            break;
                        case 'uon_van_ttth': condition['type'] = 'tinh-trang-tieu-hoa';
                            break;
                        case 'uon_van_sga': condition['type'] = 'sga';
                            break;
                        default: break;
                    }

                    // Apply role-based filtering for times
                    // const timeConditions = securityService.applyRoleBasedFiltering(user, condition);
                    let listTimeResult = await commonService.getAllDataTable('times', condition, 'asc');
                    if(listTimeResult.success && listTimeResult.data && listTimeResult.data.length > 0){
                        listTime = listTimeResult.data;
                    }
                }

                if(isTime && listTime.length > 0){
                    timeActiveId = listTime[0].id;
                    condition['time_id'] = timeActiveId;
                }
                if(condition.hasOwnProperty('type')) delete condition.type;

                // // Apply role-based filtering for main data
                // const filteredCondition = securityService.applyRoleBasedFiltering(user, condition);

                // Get detail tetanus
                commonService.getAllDataTable(table, condition).then(responseData =>{
                    if(responseData.success){
                        if(responseData.data && responseData.data.length > 0) detailTetanus = responseData.data[0];
                    }
                    resolve({detailTetanus: detailTetanus, listTime: listTime, timeActiveId: timeActiveId});
                })
            } catch (error) {
                console.error('Error in getDataTetanus:', error.message);
                commonService.saveLog({}, error.message, error.stack);
                resolve({detailTetanus: {}, listTime: [], timeActiveId: null})
            }
        })
    },
    getTypeDetail: function(type){
        let view = 'index';
        let table = '';
        let isTime = true;
        let isData = true;
        let isMedicine = false;
        switch(type){
            case 'lam-sang':
                view = 'index';
                table = 'uon_van_ls';
                isMedicine = true;
                break;
            case 'sga':
                view = 'sga';
                table = 'uon_van_sga';
                break;
            case 'khau-phan-an':
                view = 'khau-phan-an';
                table = 'uon_van_kpa';
                isData = false;
                isTime = false;
                break;
            case 'tinh-trang-tieu-hoa':
                view = 'tinh-trang-tieu-hoa';
                table = 'uon_van_ttth';
                break;
            default: break;
        }
        return {view: view, table: table, isTime: isTime, isData: isData, isMedicine: isMedicine};
    },
    getListTable: function(req, res, next){
        // Kiểm tra quyền truy cập
        if (!req.user.isAdmin && !req.user.role_id.includes(4)) {
            return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
        }

        // Cấu hình DataTable
        const config = {
            table: 'uon_van_kpa',
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
                'note' // column 3
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
        //             table: 'uon_van_kpa',
        //             patient_id: req.params.patient_id,
        //             // user: req.user // Thêm thông tin user để áp dụng phân quyền
        //         };

        //     // Apply role-based filtering
        //     // const roleBasedConditions = securityService.applyRoleBasedFiltering(req.user, {});
        //     // const parameter = { ...baseParameter, ...roleBasedConditions };

        //     if(!req.user.role_id.includes(4) && !req.user.isAdmin){
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
    },
    deleteBroading: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            let id = req.params.id;
            let table = 'uon_van_kpa';
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
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
    deleteTime: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            let id = req.params.id;
            let patient_id = req.body.patient_id;
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền xóa danh sách này!';
                return res.json(resultMessage);
            }
            if(id){
                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {id: id, patient_id: patient_id}), 'times').then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                        switch(req.params.type){
                            case 'lam-sang':
                                commonService.updateRecordTable({active: 0}, {time_id: id, patient_id: patient_id}, 'uon_van_ls')
                                break;
                            case 'tinh-trang-tieu-hoa':
                                commonService.updateRecordTable({active: 0}, {time_id: id, patient_id: patient_id}, 'uon_van_ttth')
                                break;
                            case 'sga':
                                commonService.updateRecordTable({active: 0}, {time_id: id, patient_id: patient_id}, 'uon_van_sga')
                                break;
                            default: break;
                        }
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
    editTetanus: function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                data: ''
            };
            // new Date().toLocaleDateString('fr-CA');
            const validateRules = [
            //     { field: "fullname", type: "string", required: true, message: "Vui lòng nhập họ tên!" },
            //     { field: "ma_benh_an", type: "string", required: true, message: "Vui lòng nhập mã bệnh án!" }
            ];
            const parameter = tetanus.getDataBodyTetanus(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền sửa danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                commonService.updateRecordTable(parameter.data, parameter.condition, parameter.table).then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Lưu thành công!';
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
    createTetanus: function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                data: ''
            };
            // new Date().toLocaleDateString('fr-CA');
            const validateRules = [
            //     { field: "fullname", type: "string", required: true, message: "Vui lòng nhập họ tên!" },
            //     { field: "ma_benh_an", type: "string", required: true, message: "Vui lòng nhập mã bệnh án!" }
            ];
            const parameter = tetanus.getDataBodyTetanus(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền tạo danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                parameter.data['patient_id'] = req.params.patient_id;
                parameter.data['created_by'] = req.user.id;
                parameter.data['campaign_id'] = req.user.campaign_id;
                commonService.addRecordTable(parameter.data, parameter.table, true).then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Lưu thành công!';
                        resultData.data = responseData.data;
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
    getDataBodyTetanus: function(body, type){
        switch(type){
            case 'lam-sang':
                return {data: tetanus.lamSang(body), table: 'uon_van_ls', condition: {id: body.id ? body.id : ''}}
            case 'tinh-trang-tieu-hoa':
                return {data: tetanus.tinhTrangTieuHoa(body), table: 'uon_van_ttth', condition: {id: body.id ? body.id : ''}}
            case 'sga':
                return {data: tetanus.sga(body), table: 'uon_van_sga', condition: {id: body.id ? body.id : ''}}
        }   
    },
    lamSang: function(body){
        return {
            cn: body.cn,
            cc: body.cc,
            vong_bap_chan: body.vong_bap_chan,
            albumin: body.albumin,
            hemoglobin: body.hemoglobin,
            protein: body.protein,
            phospho: body.phospho,
            glucose: body.glucose,
            magie: body.magie,
            kali: body.kali,
            ck: body.ck,
            ure: body.ure,
            bilirubin: body.bilirubin,
            creatinin: body.creatinin,
            benh_ly: body.benh_ly,
            thuoc: body.thuoc,
            time_id: body.time_id
        }
    },
    tinhTrangTieuHoa: function(body){
        return {
            chuong_bung: body.chuong_bung,
            trao_nguoc: body.trao_nguoc,
            tao_bon: body.tao_bon,
            phan_long_3_ngay: body.phan_long_3_ngay,
            duong_mau_10: body.duong_mau_10,
            duong_mau_20: body.duong_mau_20,
            so_lan_di_ngoai: body.so_lan_di_ngoai,
            tinh_trang_phan: body.tinh_trang_phan,
            dich_ton_du: body.dich_ton_du,
            time_id: body.time_id
        }
    },
    sga: function(body){
        return {
            cn_6_thang: body.cn_6_thang,
            cn_2_tuan: body.cn_2_tuan,
            khau_phan_an_ht: body.khau_phan_an_ht,
            tieu_chung_th: body.tieu_chung_th,
            giam_chuc_nang: body.giam_chuc_nang,
            nc_chuyen_hoa: body.nc_chuyen_hoa,
            mo_duoi_da: body.mo_duoi_da,
            teo_co: body.teo_co,
            phu: body.phu,
            co_chuong: body.co_chuong,
            phan_loai: body.phan_loai,
            time_id: body.time_id
        }
    },
    khauPhanAn: function(body){
        return {
            time: body.date,
            nd_duong_th: body.nd_duong_th,
            nd_tinh_mac: body.nd_tinh_mac,
            note: body.note
        }
    },
    addTimes: function(req, res){
        try {
             var resultData = {
                success: false,
                message: "",
                insertId: ''
            };
            const validateRules = [
                { field: "time", type: "string", required: true, message: "Vui lòng chọn ngày!" }
            ];
            const parameter = {
                patient_id: req.params.patient_id,
                time: req.body.time,
                type: req.params.type,
                project:'uon-van',
                created_by: req.user.id,
                campaign_id: req.user.campaign_id
            };
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền tạo danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                commonService.addRecordTable(parameter, 'times', true).then(responseData =>{
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
    updateTimes: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            const validateRules = [
                { field: "time", type: "string", required: true, message: "Vui lòng chọn ngày!" },
                { field: "timeActive", type: "string", required: true, message: "Vui lòng chọn ngày được sửa!" },
            ];
            const parameter = {
                time: req.body.time,
                timeActive: req.body.timeActive
            };
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền sửa danh sách này!';
                return res.json(resultMessage);
            }
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                delete parameter.timeActive;
                commonService.updateRecordTable(parameter, {id: req.body.timeActive},'times').then(responseData =>{
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
            const parameter = tetanus.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
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
    getDataBodyBroading: function(body, type){
        return {data: tetanus.khauPhanAn(body), table: 'uon_van_kpa'}
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
            const parameter = tetanus.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            let id = req.body.id;
            if(!id){
                errors.push('Thiếu Id');
            }
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
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
            let table = 'uon_van_kpa';
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }

            // Apply role-based filtering
            // const conditions = securityService.applyRoleBasedFiltering(req.user, {id: req.params.id});

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
    dataTime:function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                data: {}
            };

            let table = '';
            switch(req.params.type){
                case 'lam-sang': table = 'uon_van_ls'
                    break;
                case 'tinh-trang-tieu-hoa': table = 'uon_van_ttth'
                    break;
                case 'sga': table = 'uon_van_sga'
                    break;
                default: break
            }
            if(!req.user.role_id.includes(4) && !req.user.isAdmin){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }

            // Apply role-based filtering
            // const conditions = securityService.applyRoleBasedFiltering(req.user, {
            //     patient_id: req.params.patient_id,
            //     time_id: req.body.time_id
            // });

            commonService.getAllDataTable(table, securityService.applyRoleBasedFiltering(req.user, {patient_id: req.params.patient_id, time_id: req.body.time_id})).then(responseData =>{
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

    // Hàm lấy dữ liệu để export Excel (chuẩn hóa theo viem-gan-mt1)
    getPatientExportData: async function(patientId, path, user) {
        try {
            let exportData = {};

            if (path === 'uon-van') {
                // Times Lâm sàng mapping
                const timeLsIndexMap = new Map();
                const timesLsResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'lam-sang',
                    project: 'uon-van',
                    active: 1
                });
                if (timesLsResponse.success && timesLsResponse.data && timesLsResponse.data.length > 0) {
                    timesLsResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeLsIndexMap.set(time.id, suffix);
                        exportData[`time_ls_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // Lâm sàng
                const lsResponse = await commonService.getAllDataTable('uon_van_ls', {
                    patient_id: patientId,
                    active: 1
                });
                if (lsResponse.success && lsResponse.data && lsResponse.data.length > 0) {
                    lsResponse.data.forEach(ls => {
                        const suffix = timeLsIndexMap.get(ls.time_id);
                        if (!suffix) return;
                        exportData[`ls_cn_${suffix}`] = ls.cn;
                        exportData[`ls_cc_${suffix}`] = ls.cc;
                        exportData[`ls_vong_bap_chan_${suffix}`] = ls.vong_bap_chan;
                        exportData[`ls_albumin_${suffix}`] = ls.albumin;
                        exportData[`ls_pre_albumin_${suffix}`] = ls.pre_albumin;
                        exportData[`ls_hemoglobin_${suffix}`] = ls.hemoglobin;
                        exportData[`ls_protein_${suffix}`] = ls.protein;
                        exportData[`ls_phospho_${suffix}`] = ls.phospho;
                        exportData[`ls_glucose_${suffix}`] = ls.glucose;
                        exportData[`ls_magie_${suffix}`] = ls.magie;
                        exportData[`ls_kali_${suffix}`] = ls.kali;
                        exportData[`ls_ck_${suffix}`] = ls.ck;
                        exportData[`ls_ure_${suffix}`] = ls.ure;
                        exportData[`ls_bilirubin_${suffix}`] = ls.bilirubin;
                        exportData[`ls_creatinin_${suffix}`] = ls.creatinin;
                        exportData[`ls_benh_ly_${suffix}`] = ls.benh_ly;
                    });
                }

                // Times cho SGA theo chuẩn mt1
                const timeIndexMap = new Map();
                const timesResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'sga',
                    project: 'uon-van',
                    active: 1
                });
                if (timesResponse.success && timesResponse.data && timesResponse.data.length > 0) {
                    timesResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeIndexMap.set(time.id, suffix);
                        exportData[`time_sga_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // SGA theo suffix
                const sgaResponse = await commonService.getAllDataTable('uon_van_sga', {
                    patient_id: patientId,
                    active: 1
                });
                if (sgaResponse.success && sgaResponse.data && sgaResponse.data.length > 0) {
                    sgaResponse.data.forEach(sga => {
                        const suffix = timeIndexMap.get(sga.time_id);
                        if (!suffix) return;
                        exportData[`sga_cn6thang_${suffix}`] = sga.cn_6_thang;
                        exportData[`sga_cn2tuan_${suffix}`] = sga.cn_2_tuan;
                        exportData[`sga_khauphananht_${suffix}`] = sga.khau_phan_an_ht;
                        exportData[`sga_trieuchungth_${suffix}`] = sga.tieu_chung_th;
                        exportData[`sga_giamchucnang_${suffix}`] = sga.giam_chuc_nang;
                        exportData[`sga_ncchuyenhoa_${suffix}`] = sga.nc_chuyen_hoa;
                        exportData[`sga_moduoida_${suffix}`] = sga.mo_duoi_da;
                        exportData[`sga_teoco_${suffix}`] = sga.teo_co;
                        exportData[`sga_phu_${suffix}`] = sga.phu;
                        exportData[`sga_cochuong_${suffix}`] = sga.co_chuong;
                        exportData[`sga_phanloai_${suffix}`] = sga.phan_loai;
                    });
                }

                // Times Tình trạng tiêu hóa mapping
                const timeTtthIndexMap = new Map();
                const timesTtthResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'tinh-trang-tieu-hoa',
                    project: 'uon-van',
                    active: 1
                });
                if (timesTtthResponse.success && timesTtthResponse.data && timesTtthResponse.data.length > 0) {
                    timesTtthResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeTtthIndexMap.set(time.id, suffix);
                        exportData[`time_ttth_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // Tình trạng tiêu hóa
                const ttthResponse = await commonService.getAllDataTable('uon_van_ttth', {
                    patient_id: patientId,
                    active: 1
                });
                if (ttthResponse.success && ttthResponse.data && ttthResponse.data.length > 0) {
                    ttthResponse.data.forEach(ttth => {
                        const suffix = timeTtthIndexMap.get(ttth.time_id);
                        if (!suffix) return;
                        exportData[`ttth_chuong_bung_${suffix}`] = ttth.chuong_bung;
                        exportData[`ttth_trao_nguoc_${suffix}`] = ttth.trao_nguoc;
                        exportData[`ttth_tao_bon_${suffix}`] = ttth.tao_bon;
                        exportData[`ttth_phan_long_3_ngay_${suffix}`] = ttth.phan_long_3_ngay;
                        exportData[`ttth_duong_mau_10_${suffix}`] = ttth.duong_mau_10;
                        exportData[`ttth_duong_mau_20_${suffix}`] = ttth.duong_mau_20;
                        exportData[`ttth_so_lan_di_ngoai_${suffix}`] = ttth.so_lan_di_ngoai;
                        exportData[`ttth_tinh_trang_phan_${suffix}`] = ttth.tinh_trang_phan;
                        exportData[`ttth_dich_ton_du_${suffix}`] = ttth.dich_ton_du;
                    });
                }
            }

            return exportData;

        } catch (error) {
            console.error('Error in getPatientExportData:', error);
            return {};
        }
    }
}

module.exports = tetanus;