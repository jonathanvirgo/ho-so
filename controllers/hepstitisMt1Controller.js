var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');

    let hepatitis = {
        index: function(req, res){
            try {
                 const arrPromise = [];
                const errors = [];
                const patient_id = req.params.patient_id;
                const user = req.user;
                let patient = {};
                let detailHepatitis = {};
                let times = [];
                let timeActiveId;
                let typeDetail = {view: 'index', isData: true};
                const type = req.params.type;
                if(user.isAdmin || user.role_id.includes(6)){
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
                    typeDetail = hepatitis.getTypeDetail(type);
                    // Lấy thông tin viêm gan
                    if(typeDetail.isData){
                        arrPromise.push(
                            hepatitis.getDataHepatitis(patient_id, typeDetail.isTime, typeDetail.table, req.user).then(responseData =>{
                                detailHepatitis = responseData.detailHepatitis;
                                times = responseData.listTime;
                                timeActiveId = responseData.timeActiveId;
                            })
                        );
                    }
                }else{
                    errors.push('Bạn không có quyền truy cập bệnh nhân này!');
                }
        
                Promise.all(arrPromise).then(responseData =>{
                    return res.render('viem-gan-mt1/' + typeDetail.view, {
                        user: req.user,
                        errors: errors,
                        patient: patient,
                        moment: moment,
                        detailHepatitis: detailHepatitis,
                        times: times,
                        type: type,
                        timeActiveId: timeActiveId,
                        path: 'viem-gan-mt1'
                    });
                })
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack)
                return res.render("error");
            }
        },
        // Khẩu phần ăn (MT1) - Nội trú, dùng bảng riêng viem_gan_mt1_kpa_not
        getListKPA: function(req, res){
            if (!req.user.isAdmin && !req.user.role_id.includes(6)) {
                return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
            }
            const config = {
                table: 'viem_gan_mt1_kpa_not',
                primaryKey: 'id',
                active: 0,
                activeOperator: '!=',
                filters: { patient_id: req.params.patient_id },
                searchColumns: ['nd_duong_th_sang', 'nd_duong_th_trua', 'nd_duong_th_toi', 'nd_duong_th_bua_phu', 'nd_tinh_mac', 'note'],
                columnsMapping: [
                    'time', // 0
                    'nd_duong_th_sang',   // 1
                    'nd_duong_th_trua',   // 2
                    'nd_duong_th_toi',    // 3
                    'nd_duong_th_bua_phu',// 4
                    'nd_tinh_mac',        // 5
                    'note' // 6
                ],
                defaultOrder: [{ column: 'id', dir: 'DESC' }],
                checkRole: false
            };
            dataTableService.handleDataTableRequest(req, res, config);
        },
        dataBroadingKPA: function(req, res){
            try{
                var resultData = { success: false, message: '', data: {} };
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                    return res.json(resultData);
                }
                commonService.getAllDataTable('viem_gan_mt1_kpa_not', securityService.applyRoleBasedFiltering(req.user, {id: req.params.id}))
                .then(responseData =>{
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
            }catch(error){
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
            }
        },
        addBroadingKPA: function(req, res){
            try{
                var resultData = { success: false, message: '', insertId: '' };
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có quyền tạo danh sách này!';
                    return res.json(resultData);
                }
                const data = {
                    time: req.body.date.split('/').reverse().join('/'),
                    nd_duong_th_sang: req.body.nd_duong_th_sang,
                    nd_duong_th_trua: req.body.nd_duong_th_trua,
                    nd_duong_th_toi: req.body.nd_duong_th_toi,
                    nd_duong_th_bua_phu: req.body.nd_duong_th_bua_phu,
                    nd_tinh_mac: req.body.nd_tinh_mac,
                    note: req.body.note,
                    patient_id: req.params.patient_id,
                    created_by: req.user.id,
                    campaign_id: req.user.campaign_id
                };
                commonService.addRecordTable(data, 'viem_gan_mt1_kpa_not', true).then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Lưu thành công!';
                        resultData.insertId = responseData.data.insertId;
                    }else{
                        resultData.message = responseData.message;
                    }
                    res.json(resultData);
                })
            }catch(error){
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
            }
        },
        updateBroadingKPA: function(req, res){
            try{
                var resultData = { success: false, message: '' };
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có quyền sửa danh sách này!';
                    return res.json(resultData);
                }
                if(!req.body.id){
                    resultData.message = 'Thiếu Id';
                    return res.json(resultData);
                }
                const data = {
                    time: req.body.date.split('/').reverse().join('/'),
                    nd_duong_th_sang: req.body.nd_duong_th_sang,
                    nd_duong_th_trua: req.body.nd_duong_th_trua,
                    nd_duong_th_toi: req.body.nd_duong_th_toi,
                    nd_duong_th_bua_phu: req.body.nd_duong_th_bua_phu,
                    nd_tinh_mac: req.body.nd_tinh_mac,
                    note: req.body.note
                };
                commonService.updateRecordTable(data, {id: req.body.id}, 'viem_gan_mt1_kpa_not').then(responseData =>{
                    if(responseData.success && responseData.data){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                    }else{
                        resultData.message = responseData.message;
                    }
                    res.json(resultData);
                })
            }catch(error){
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
            }
        },
        deleteBroadingKPA: function(req, res){
            try{
                var resultData = { success: false, message: '' };
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có xóa danh sách này!';
                    return res.json(resultData);
                }
                let id = req.params.id;
                if(!id){
                    resultData.message = 'Thiếu Id bệnh nhân!';
                    return res.json(resultData);
                }
                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {id: id}), 'viem_gan_mt1_kpa_not').then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                    }else{
                        resultData.message = responseData.message;
                    }
                    return res.json(resultData);
                })
            }catch(error){
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
            }
        },
        getDataHepatitis: function(patient_id, isTime, table, user){
            return new Promise(async (resolve, reject) => { 
                try {
                    let detailHepatitis = {};
                    let listTime = [];
                    let condition =  securityService.applyRoleBasedFiltering(user, {patient_id: patient_id, active: 1});
                    let timeActiveId;
                    if(isTime){
                        // Get list time
                        switch(table){
                            case 'viem_gan_mt1_sga': condition['type'] = 'sga';
                                break;
                            default: break;
                        }
                        let listTimeResult = await commonService.getAllDataTable('times', condition);
                        if(listTimeResult.success && listTimeResult.data && listTimeResult.data.length > 0){
                            listTime = listTimeResult.data;
                        }
                    }
                    
                    if(isTime && listTime.length > 0){
                        timeActiveId = listTime[0].id;
                        condition['time_id'] = timeActiveId;
                    }
                    if(condition.hasOwnProperty('type')) delete condition.type;
                    // Get detail hepastitis
                    commonService.getAllDataTable(table, condition).then(responseData =>{
                        if(responseData.success){
                            if(responseData.data && responseData.data.length > 0) detailHepatitis = responseData.data[0];
                        }
                        resolve({detailHepatitis: detailHepatitis, listTime: listTime, timeActiveId: timeActiveId});
                    })
                } catch (error) {
                    commonService.saveLog(req, error.message, error.stack);
                    resolve({detailHepatitis: {}, listTime: [], timeActiveId: null})
                }
            })
        },
        getTypeDetail: function(type){
            let view = 'index';
            let table = '';
            let isTime = false;
            let isData = true;
            switch(type){
                case 'dau-hieu-nhap-vien':
                    view = 'index';
                    table = 'viem_gan_mt1_dhnv';
                    break;  
                case 'sga':
                    view = 'sga';
                    table = 'viem_gan_mt1_sga';
                    isTime = true;
                    break;
                case 'khau-phan-an':
                    view = 'khau-phan-an';
                    table = '';
                    isData = false;
                    break;
                case 'so-gan':
                    view = 'so-gan';
                    table = 'viem_gan_mt1_so_gan';
                    break;
                default: break;
            }
            return {view: view, table: table, isTime: isTime, isData: isData};
        },
        deleteTime: async function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: ""
                };
                let id = req.params.id;
                let patient_id = req.body.patient_id;
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có quyền xóa danh sách này!';
                    return res.json(resultData);
                }

                // Kiểm tra quyền sở hữu dữ liệu (user thường chỉ xóa được dữ liệu do họ tạo)
                // if(!req.user.isAdmin && id){
                //     const checkOwnership = await commonService.getAllDataTable('times', {id: id, patient_id: patient_id});
                //     if(checkOwnership.success && checkOwnership.data && checkOwnership.data.length > 0){
                //         const record = checkOwnership.data[0];
                //         if(record.created_by && record.created_by !== req.user.id){
                //             resultData.message = 'Bạn không có quyền xóa dữ liệu này!';
                //             return res.json(resultData);
                //         }
                //     }else{
                //         resultData.message = 'Không tìm thấy dữ liệu để xóa!';
                //         return res.json(resultData);
                //     }
                // }

                if(id){
                    commonService.updateRecordTable({active: 0},  securityService.applyRoleBasedFiltering(req.user, {id: id, patient_id: patient_id}), 'times').then(responseData =>{
                        if(responseData.success){
                            resultData.success = true;
                            resultData.message = 'Thành công!';
                            switch(req.params.type){
                                case 'sga':
                                    commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'viem_gan_mt1_sga')
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
        editHepatitis: async function(req, res){
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
                const parameter = hepatitis.getDataBodyHepatitis(req.body, req.params.type);
                const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultData.message = 'Bạn không có quyền sửa danh sách này!';
                    return res.json(resultData);
                }

                // Kiểm tra quyền sở hữu dữ liệu (user thường chỉ sửa được dữ liệu do họ tạo)
                // if(!req.user.isAdmin && parameter.condition.id){
                //     const checkOwnership = await commonService.getAllDataTable(parameter.table, {id: parameter.condition.id});
                //     if(checkOwnership.success && checkOwnership.data && checkOwnership.data.length > 0){
                //         const record = checkOwnership.data[0];
                //         if(record.created_by && record.created_by !== req.user.id){
                //             resultData.message = 'Bạn không có quyền sửa dữ liệu này!';
                //             return res.json(resultData);
                //         }
                //     }else{
                //         resultData.message = 'Không tìm thấy dữ liệu để sửa!';
                //         return res.json(resultData);
                //     }
                // }

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
        createHepatitis: function(req, res){
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
                const parameter = hepatitis.getDataBodyHepatitis(req.body, req.params.type);
                const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
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
        getDataBodyHepatitis: function(body, type){
            switch(type){
                case 'dau-hieu-nhap-vien':
                    return {data: hepatitis.dauHieuNhapVien(body), table: 'viem_gan_mt1_dhnv', condition: {id: body.id ? body.id : ''}}
                case 'sga':
                    return {data: hepatitis.sga(body), table: 'viem_gan_mt1_sga', condition: {id: body.id ? body.id : ''}}
                case 'so-gan':
                    return {data: hepatitis.soGan(body), table: 'viem_gan_mt1_so_gan', condition: {id: body.id ? body.id : ''}}
                case 'khau-phan-an':
                    return {data: {}, table: 'viem_gan_mt1_kpa', condition: {id: body.id ? body.id : ''}}
            }   
        },
        dauHieuNhapVien: function(body){
            return {
                chan_doan_benh: body.chan_doan_benh,
                nguyen_nhan: body.nguyen_nhan,
                nguyen_nhan_khac: body.nguyen_nhan_khac,
                cn: body.cn,
                cc: body.cc,
                vong_bap_chan: body.vong_bap_chan,
                got: body.got,
                gpt: body.gpt,
                hemoglobin: body.hemoglobin,
                bua_chinh: body.bua_chinh, 
                bua_phu: body.bua_phu,
                bua_phu_an: body.bua_phu_an,
                bua_phu_an_khac: body.bua_phu_an_khac,
                an_kieng: body.an_kieng,
                an_kieng_loai: body.an_kieng_loai,
                an_kieng_loai_khac: body.an_kieng_loai_khac,
                ruou_bia: body.ruou_bia,
                ruou_bia_ts: body.ruou_bia_ts,
                ml_ruou: body.ml_ruou,
                ml_bia: body.ml_bia,
                do_uong_khac: body.do_uong_khac,
                do_uong_khac_ts: body.do_uong_khac_ts,
                loai_do_uong: body.loai_do_uong,
                loai_do_uong_khac: body.loai_do_uong_khac,
                su_dung_la_cay: body.su_dung_la_cay,
                loai_la_cay: body.loai_la_cay,
                note: body.note
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
        soGan: function(body){
            return {
                tinh_trang_gan: body.tinh_trang_gan,
                muc_do_xo_gan: body.muc_do_xo_gan,
                albumin: body.albumin,
                tu_van_dd: body.tu_van_dd,
                so_bua_moi_ngay: body.so_bua_moi_ngay,
                bua_dem: body.bua_dem,
                benh_ly_kem_theo: body.benh_ly_kem_theo,
                benh_ly_kem_theo_khac: body.benh_ly_kem_theo_khac
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
                    project:'viem-gan-mt1',
                    created_by: req.user.id,
                    campaign_id: req.user.campaign_id
                };
                const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
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
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
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
        dataTime:function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: "",
                    data: {}
                };
        
                let table = '';
                switch(req.params.type){
                    case 'sga': table = 'viem_gan_mt1_sga'
                        break;
                    default: break
                }
                if(!req.user.role_id.includes(6) && !req.user.isAdmin){
                    resultMessage.error = 'Bạn không có quyền truy cập danh sách này!';
                    return res.json(resultMessage);
                }
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

        // Hàm lấy dữ liệu để export Excel
        getPatientExportData: async function(patientId, path, user) {
            try {
                let exportData = {};

                // Lấy dữ liệu chi tiết dựa trên path
                if (path === 'viem-gan-mt1') {
                    // Lấy dữ liệu từ bảng viem_gan_mt1_dhnv (dấu hiệu nhập viện)
                    const dhnvResponse = await commonService.getAllDataTable('viem_gan_mt1_dhnv', {
                        patient_id: patientId,
                        active: 1
                    });

                    if (dhnvResponse.success && dhnvResponse.data && dhnvResponse.data.length > 0) {
                        const dhnv = dhnvResponse.data[0];
                        
                        // Map dữ liệu theo tên trường database
                        exportData.chan_doan_benh = dhnv.chan_doan_benh;
                        exportData.nguyen_nhan = dhnv.nguyen_nhan;
                        exportData.nguyen_nhan_khac = dhnv.nguyen_nhan_khac;
                        exportData.cn = dhnv.cn;
                        exportData.cc = dhnv.cc;
                        exportData.vong_bap_chan = dhnv.vong_bap_chan;
                        exportData.got = dhnv.got;
                        exportData.gpt = dhnv.gpt;
                        exportData.hemoglobin = dhnv.hemoglobin;
                        exportData.bua_phu = dhnv.bua_phu;
                        exportData.bua_phu_an_khac = dhnv.bua_phu_an_khac;
                        exportData.bua_chinh = dhnv.bua_chinh;
                        exportData.an_kieng = dhnv.an_kieng;
                        exportData.an_kieng_loai_khac = dhnv.an_kieng_loai_khac;
                        exportData.ruou_bia = dhnv.ruou_bia;
                        exportData.ruou_bia_ts = dhnv.ruou_bia_ts;
                        exportData.ml_ruou = dhnv.ml_ruou;
                        exportData.ml_bia = dhnv.ml_bia;
                        exportData.do_uong_khac = dhnv.do_uong_khac;
                        exportData.do_uong_khac_ts = dhnv.do_uong_khac_ts;
                        exportData.loai_do_uong_khac = dhnv.loai_do_uong_khac;
                        exportData.su_dung_la_cay = dhnv.su_dung_la_cay;
                        exportData.loai_la_cay = dhnv.loai_la_cay;
                        exportData.note = dhnv.note;
                        exportData.bua_phu_an = dhnv.bua_phu_an;
                        
                        // Xử lý multiple choice - giữ nguyên format để tương thích với headers cũ
                        if (dhnv.an_kieng_loai) {
                            const anKiengArray = commonService.isJSON(dhnv.an_kieng_loai) ? JSON.parse(dhnv.an_kieng_loai) : [];

                            exportData.ankiengloai_1 = anKiengArray.includes('1') ? 1 : 0;
                            exportData.ankiengloai_2 = anKiengArray.includes('2') ? 1 : 0;
                            exportData.ankiengloai_3 = anKiengArray.includes('3') ? 1 : 0;
                            exportData.ankiengloai_4 = anKiengArray.includes('4') ? 1 : 0;
                            exportData.ankiengloai_5 = anKiengArray.includes('5') ? 1 : 0;
                        }

                        // loại đồ uống
                        if (dhnv.loai_do_uong) {
                            const loaiDoUongArray = commonService.isJSON(dhnv.loai_do_uong) ? JSON.parse(dhnv.loai_do_uong) : [];
  
                            exportData.loaidouong_1 = loaiDoUongArray.includes('1') ? 1 : 0;
                            exportData.loaidouong_2 = loaiDoUongArray.includes('2') ? 1 : 0;
                            exportData.loaidouong_3 = loaiDoUongArray.includes('3') ? 1 : 0;
                            exportData.loaidouong_4 = loaiDoUongArray.includes('4') ? 1 : 0;
                        }
                    }

                    var timesList = [];
                    // Tạo Map để lưu time -> index
                    const timeIndexMap = new Map();
                    // Lấy dữ liệu từ bảng times (nếu có)
                    const timesResponse = await commonService.getAllDataTable('times', {
                        patient_id: patientId,
                        type: 'sga',
                        project: 'viem-gan-mt1',
                        active: 1
                    });

                    if (timesResponse.success && timesResponse.data && timesResponse.data.length > 0) {
                        timesList = timesResponse.data;
                        
                        // Xử lý multiple dates cho times
                        if (timesList.length > 0) {
                            timesList.forEach((time, index) => {
                                const suffix = index + 1;
                                time.index = index;
                                timeIndexMap.set(time.id, suffix);
                                exportData[`time_sga_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                            });
                        }
                    }
                    // Lấy dữ liệu từ bảng viem_gan_mt1_sga
                    const sgaResponse = await commonService.getAllDataTable('viem_gan_mt1_sga', {
                        patient_id: patientId,
                        active: 1
                    });

                    if (sgaResponse.success && sgaResponse.data && sgaResponse.data.length > 0) {
                        // Xử lý multiple dates cho SGA
                        const sgaList = sgaResponse.data;
                        // Nếu cần xử lý multiple dates, có thể tạo thêm các cột
                        // Ví dụ: C1_cannang6thang_1, C1_cannang6thang_2, etc.
                        // Map SGA data theo tên trường database
                        if (sgaList.length > 0) {
                            sgaList.forEach((sga, index) => {
                                const timeIndex = timeIndexMap.get(sga.time_id);
                                const suffix = timeIndex;
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
                                exportData[`sga_totalpoint_${suffix}`] = sga.total_point;
                            });
                        }
                    }

                    // Lấy dữ liệu từ bảng viem_gan_mt1_so_gan
                    const soGanResponse = await commonService.getAllDataTable('viem_gan_mt1_so_gan', {
                        patient_id: patientId,
                        active: 1
                    });

                    if (soGanResponse.success && soGanResponse.data && soGanResponse.data.length > 0) {
                        const soGan = soGanResponse.data[0];
                        exportData.tinh_trang_gan = soGan.tinh_trang_gan;
                        exportData.muc_do_xo_gan = soGan.muc_do_xo_gan;
                        exportData.albumin = soGan.albumin;
                        exportData.tu_van_dd = soGan.tu_van_dd;
                        exportData.so_bua_moi_ngay = soGan.so_bua_moi_ngay;
                        exportData.bua_dem = soGan.bua_dem;
                        exportData.benh_ly_kem_theo_khac = soGan.benh_ly_kem_theo_khac;
                        // m
                        if (soGan.benh_ly_kem_theo) {
                            const benhLyKemTheoArray = commonService.isJSON(soGan.benh_ly_kem_theo) ? JSON.parse(soGan.benh_ly_kem_theo) : [];
                            exportData.benhlykemtheo_1 = benhLyKemTheoArray.includes('1') ? 1 : 0;
                            exportData.benhlykemtheo_2 = benhLyKemTheoArray.includes('2') ? 1 : 0;
                            exportData.benhlykemtheo_3 = benhLyKemTheoArray.includes('3') ? 1 : 0;
                            exportData.benhlykemtheo_4 = benhLyKemTheoArray.includes('4') ? 1 : 0;
                            exportData.benhlykemtheo_5 = benhLyKemTheoArray.includes('5') ? 1 : 0;
                            exportData.benhlykemtheo_6 = benhLyKemTheoArray.includes('6') ? 1 : 0;
                            exportData.benhlykemtheo_7 = benhLyKemTheoArray.includes('7') ? 1 : 0;
                        }
                    }

                    // // Lấy dữ liệu từ bảng viem_gan_mt1_kpa_not (khẩu phần ăn nội trú)
                    // const kpaResponse = await commonService.getAllDataTable('viem_gan_mt1_kpa_not', {
                    //     patient_id: patientId,
                    //     active: 1
                    // });

                    // if (kpaResponse.success && kpaResponse.data && kpaResponse.data.length > 0) {
                    //     // Xử lý multiple dates cho KPA
                    //     const kpaList = kpaResponse.data;
                        
                    //     // Lấy dữ liệu KPA mới nhất
                    //     const latestKpa = kpaList.sort((a, b) => new Date(b.time) - new Date(a.time))[0];
                        
                    //     // Nếu cần xử lý multiple dates, tạo thêm các cột
                    //     if (kpaList.length > 1) {
                    //         kpaList.forEach((kpa, index) => {
                    //             const suffix = index + 1;
                    //             exportData[`nd_duong_th_sang_${suffix}`] = kpa.nd_duong_th_sang;
                    //             exportData[`nd_duong_th_trua_${suffix}`] = kpa.nd_duong_th_trua;
                    //             exportData[`nd_duong_th_toi_${suffix}`] = kpa.nd_duong_th_toi;
                    //             exportData[`nd_duong_th_bua_phu_${suffix}`] = kpa.nd_duong_th_bua_phu;
                    //             exportData[`nd_tinh_mac_${suffix}`] = kpa.nd_tinh_mac;
                    //             exportData[`note_kpa_${suffix}`] = kpa.note;
                    //         });
                    //     }
                    // }
                }

                return exportData;

            } catch (error) {
                console.error('Error in getPatientExportData:', error);
                return {};
            }
        }
    }

module.exports = hepatitis;