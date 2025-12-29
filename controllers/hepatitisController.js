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
            let typeDetail = {view: 'index'};
            const type = req.params.type;
            if(user.isAdmin || user.role_id.includes(3)){
                // lấy thông tin cơ bản
                arrPromise.push(
                    commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, { id: patient_id })).then(responseData =>{
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
                return res.render('viem-gan/' + typeDetail.view, {
                    user: req.user,
                    errors: errors,
                    patient: patient,
                    moment: moment,
                    detailHepatitis: detailHepatitis,
                    times: times,
                    type: type,
                    path: 'viem-gan',
                    timeActiveId: timeActiveId
                });
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            return res.render("error");
        }
    },
    getDataHepatitis: function(patient_id, isTime, table, user){
        return new Promise(async (resolve, reject) => {
            try {
                let detailHepatitis = {};
                let listTime = [];
                let condition = securityService.applyRoleBasedFiltering(user, {patient_id: patient_id, active: 1});
                let order = { column: 'id', type: 'asc' };
                let timeActiveId;
                if(isTime){
                    // Get list time
                    switch(table){
                        case 'viem_gan_ttdd': 
                            condition['type'] = 'tinh-trang-dinh-duong';
                            break;
                        case 'viem_gan_ctdd': condition['type'] = 'can-thiep-dinh-duong';
                            break;
                        case 'viem_gan_sga': condition['type'] = 'sga';
                            break;
                        default: break;
                    }
                    let listTimeResult = await commonService.getAllDataTable('times', condition, order);
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
                // Note: req is not available in this context, need to handle differently
                commonService.saveLog({}, error.message, error.stack);
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
                table = 'viem_gan_dhnv';
                break;
            case 'thoi-quen-an-uong':
                view = 'thoi-quen-an-uong';
                table = 'viem_gan_tqau';
                break;
            case 'tinh-trang-dinh-duong':
                view = 'tinh-trang-dinh-duong';
                table = 'viem_gan_ttdd';
                isTime = true;
                break;
            case 'can-thiep-dinh-duong':
                view = 'can-thiep-dinh-duong';
                table = 'viem_gan_ctdd';
                isTime = true;
                break;
            case 'sga':
                view = 'sga';
                table = 'viem_gan_sga';
                isTime = true;
                break;
            case 'che-do-an-noi-tru':
                view = 'an-noi-tru';
                table = 'viem_gan_td_not';
                isData = false;
                break;
            case 'che-do-an-ngoai-tru':
                view = 'an-ngoai-tru';
                table = 'viem_gan_td_ngt';
                isData = false;
                break;
            default: break;
        }
        return {view: view, table: table, isTime: isTime, isData: isData};
    },
    getListTable: function(req, res, next){
        // Kiểm tra quyền truy cập
        if (!req.user.isAdmin && !req.user.role_id.includes(3)) {
            return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
        }

        // Cấu hình DataTable
        const isNOT = req.params.type == 'che-do-an-noi-tru';
        const config = {
            table: isNOT ? 'viem_gan_td_not' : 'viem_gan_td_ngt',
            primaryKey: 'id',
            active: 0,
            activeOperator: '!=',
            filters: {
                patient_id: req.params.patient_id
            },
            searchColumns: isNOT ? ['nd_duong_th', 'nd_tinh_mac'] : ['bat_thuong', 'tu_van'],
            columnsMapping: isNOT ? [
                'time', // column 0
                'nd_duong_th', // column 1
                'nd_tinh_mac', // column 2
                'note' // column 3
            ] : [
                'time', // column 0
                'cn', // column 1
                'bat_thuong', // column 2
                'tu_van', // column 3
                'note' // column 4
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
        //             table: req.params.type == 'che-do-an-noi-tru' ? 'viem_gan_td_not' : 'viem_gan_td_ngt',
        //             patient_id: req.params.patient_id,
        //             campaign_id: req.user.campaign_id
        //             // user: req.user // Thêm thông tin user để áp dụng phân quyền
        //         };

        //     // Apply role-based filtering
        //     // const roleBasedConditions = securityService.applyRoleBasedFiltering(req.user, {});
        //     // const parameter = { ...baseParameter, ...roleBasedConditions };

        //     if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            let table = req.params.type == 'che-do-an-noi-tru' ? 'viem_gan_td_not' : 'viem_gan_td_ngt';
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
                resultMessage.error = 'Bạn không có quyền xóa danh sách này!';
                return res.json(resultMessage);
            }
            if(id){
                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {id: id, patient_id: patient_id}), 'times').then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                        switch(req.params.type){
                            case 'tinh-trang-dinh-duong':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'viem_gan_ttdd')
                                break;
                            case 'can-thiep-dinh-duong':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'viem_gan_ctdd')
                                break;
                            case 'sga':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'viem_gan_sga')
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
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
                return {data: hepatitis.dauHieuNhapVien(body), table: 'viem_gan_dhnv', condition: {id: body.id ? body.id : ''}}
            case 'thoi-quen-an-uong':
                return {data: hepatitis.thoiQuenAnUong(body), table: 'viem_gan_tqau', condition: {id: body.id ? body.id : ''}}
            case 'tinh-trang-dinh-duong':
                return {data: hepatitis.tinhTrangDinhDuong(body), table: 'viem_gan_ttdd', condition: {id: body.id ? body.id : ''}}
            case 'can-thiep-dinh-duong':
                return {data: hepatitis.canThiepDinhDuong(body), table: 'viem_gan_ctdd', condition: {id: body.id ? body.id : ''}}
            case 'sga':
                return {data: hepatitis.sga(body), table: 'viem_gan_sga', condition: {id: body.id ? body.id : ''}}
        }   
    },
    dauHieuNhapVien: function(body){
        return {
            chan_an_met_moi: body.chan_an_met_moi,
            bieu_hien_tieu_hoa: body.bieu_hien_tieu_hoa,
            dau_tuc_hsp: body.dau_tuc_hsp,
            dau_tuc_hsp_khi: body.dau_tuc_hsp_khi,
            vang_da_vang_mat: body.vang_da_vang_mat,
            bieu_hien_phu: body.bieu_hien_phu,
            bieu_hien_co_chuong: body.bieu_hien_co_chuong,
            ngua_da: body.ngua_da,
            ngua_da_khac: body.ngua_da_khac,
            xuat_huyet_tieu_hoa: body.xuat_huyet_tieu_hoa
        }
    },
    thoiQuenAnUong: function(body){
        return {
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
            loai_la_cay: body.loai_la_cay,
            cham_soc_dd: body.cham_soc_dd,
            cham_soc_dd_khac: body.cham_soc_dd_khac
        }
    },
    tinhTrangDinhDuong: function(body){
        return {
            cn: body.cn,
            cc: body.cc,
            vong_bap_chan: body.vong_bap_chan,
            glucose: body.glucose,
            ure: body.ure,
            creatinin: body.creatinin,
            got: body.got,
            gpt: body.gpt,
            ggt: body.ggt,
            hong_cau: body.hong_cau,
            hemoglobin: body.hemoglobin,
            pre_albumin: body.pre_albumin,
            albumin: body.albumin,
            protein_tp: body.protein_tp,
            sat_huyet_thanh: body.sat_huyet_thanh,
            ferritin: body.ferritin,
            time_id: body.time_id
        }
    },
    canThiepDinhDuong: function(body){
        return {
            chan_an: body.chan_an,
            chan_an_note: body.chan_an_note,
            an_khong_ngon: body.an_khong_ngon,
            an_khong_ngon_note: body.an_khong_ngon_note,
            buon_non: body.buon_non,
            buon_non_note: body.buon_non_note,
            non: body.non,
            non_note: body.non_note,
            tao_bon: body.tao_bon,
            tao_bon_note: body.tao_bon_note,
            tieu_chay: body.tieu_chay,
            tieu_chay_note: body.tieu_chay_note,
            song_phan: body.song_phan,
            song_phan_note: body.song_phan_note,
            nhiet_mieng: body.nhiet_mieng,
            nhiet_mieng_note: body.nhiet_mieng_note,
            thay_doi_vi_giac: body.thay_doi_vi_giac,
            thay_doi_vi_giac_note: body.thay_doi_vi_giac_note,
            khac: body.khac,
            khac_note: body.khac_note,
            co_chuong: body.co_chuong,
            co_chuong_note: body.co_chuong_note,
            met_moi: body.met_moi,
            met_moi_note: body.met_moi_note,
            dau: body.dau,
            dau_note: body.dau_note,
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
    anNoiTru: function(body){
        return {
            time: body.date,
            nd_duong_th: body.nd_duong_th,
            nd_tinh_mac: body.nd_tinh_mac,
            note: body.note
        }
    },
    anNgoaiTru: function(body){
        return {
            time: body.date,
            cn: body.cn,
            bat_thuong: body.bat_thuong,
            tu_van: body.tu_van,
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
                project:'viem-gan',
                created_by: req.user.id,
                campaign_id: req.user.campaign_id
            };
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            const parameter = hepatitis.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
        switch(type){
            case 'che-do-an-noi-tru':
                return {data: hepatitis.anNoiTru(body), table: 'viem_gan_td_not'}
            case 'che-do-an-ngoai-tru':
                return {data: hepatitis.anNgoaiTru(body), table: 'viem_gan_td_ngt'}
            default: break;
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
            const parameter = hepatitis.getDataBodyBroading(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            let id = req.body.id;
            if(!id){
                errors.push('Thiếu Id');
            }
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
            let table = 'viem_gan_td_not';
            if(req.params.type == 'che-do-an-ngoai-tru') table = 'viem_gan_td_ngt';
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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
                case 'tinh-trang-dinh-duong': table = 'viem_gan_ttdd'
                    break;
                case 'can-thiep-dinh-duong': table = 'viem_gan_ctdd'
                    break;
                case 'sga': table = 'viem_gan_sga'
                    break;
                default: break
            }
            if(!req.user.role_id.includes(3) && !req.user.isAdmin){
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

            if (path === 'viem-gan') {
                // Dấu hiệu nhập viện
                const dhnvResponse = await commonService.getAllDataTable('viem_gan_dhnv', {
                    patient_id: patientId,
                    active: 1
                });
                if (dhnvResponse.success && dhnvResponse.data && dhnvResponse.data.length > 0) {
                    const dhnv = dhnvResponse.data[0];
                    exportData.chan_an_met_moi = dhnv.chan_an_met_moi;
                    exportData.bieu_hien_tieu_hoa = dhnv.bieu_hien_tieu_hoa;
                    exportData.bieu_hien_tieu_hoa_khac = dhnv.bieu_hien_tieu_hoa_khac;
                    exportData.dau_tuc_hsp = dhnv.dau_tuc_hsp;
                    exportData.dau_tuc_hsp_khi = dhnv.dau_tuc_hsp_khi;
                    exportData.dau_tuc_hsp_khac = dhnv.dau_tuc_hsp_khac;
                    exportData.vang_da_vang_mat = dhnv.vang_da_vang_mat;
                    exportData.bieu_hien_phu = dhnv.bieu_hien_phu;
                    exportData.bieu_hien_co_chuong = dhnv.bieu_hien_co_chuong;
                    exportData.ngua_da = dhnv.ngua_da;
                    exportData.ngua_da_khac = dhnv.ngua_da_khac;
                    exportData.xuat_huyet_tieu_hoa = dhnv.xuat_huyet_tieu_hoa;
                }

                // Thói quen ăn uống
                const tqauResponse = await commonService.getAllDataTable('viem_gan_tqau', {
                    patient_id: patientId,
                    active: 1
                });
                if (tqauResponse.success && tqauResponse.data && tqauResponse.data.length > 0) {
                    const tqau = tqauResponse.data[0];
                    exportData.bua_chinh = tqau.bua_chinh;
                    exportData.bua_phu = tqau.bua_phu;
                    exportData.bua_phu_an = tqau.bua_phu_an;
                    exportData.bua_phu_an_khac = tqau.bua_phu_an_khac;
                    exportData.an_kieng = tqau.an_kieng;
                    exportData.an_kieng_loai_khac = tqau.an_kieng_loai_khac;
                    exportData.ruou_bia = tqau.ruou_bia;
                    exportData.ruou_bia_ts = tqau.ruou_bia_ts;
                    exportData.ml_ruou = tqau.ml_ruou;
                    exportData.ml_bia = tqau.ml_bia;
                    exportData.do_uong_khac = tqau.do_uong_khac;
                    exportData.do_uong_khac_ts = tqau.do_uong_khac_ts;
                    exportData.loai_do_uong_khac = tqau.loai_do_uong_khac;
                    exportData.su_dung_la_cay = tqau.su_dung_la_cay;
                    exportData.loai_la_cay = tqau.loai_la_cay;
                    exportData.cham_soc_dd = tqau.cham_soc_dd;
                    exportData.cham_soc_dd_khac = tqau.cham_soc_dd_khac;
                    
                    // Xử lý multiselect cho an_kieng_loai
                    if (tqau.an_kieng_loai) {
                        const anKiengArray = commonService.isJSON(tqau.an_kieng_loai) ? JSON.parse(tqau.an_kieng_loai) : [];
                        exportData.ankiengloai_1 = anKiengArray.includes('1') ? 1 : 0;
                        exportData.ankiengloai_2 = anKiengArray.includes('2') ? 1 : 0;
                        exportData.ankiengloai_3 = anKiengArray.includes('3') ? 1 : 0;
                        exportData.ankiengloai_4 = anKiengArray.includes('4') ? 1 : 0;
                        exportData.ankiengloai_5 = anKiengArray.includes('5') ? 1 : 0;
                    }
                    
                    // Xử lý multiselect cho loai_do_uong
                    if (tqau.loai_do_uong) {
                        const loaiDoUongArray = commonService.isJSON(tqau.loai_do_uong) ? JSON.parse(tqau.loai_do_uong) : [];
                        exportData.loaidouong_1 = loaiDoUongArray.includes('1') ? 1 : 0;
                        exportData.loaidouong_2 = loaiDoUongArray.includes('2') ? 1 : 0;
                        exportData.loaidouong_3 = loaiDoUongArray.includes('3') ? 1 : 0;
                        exportData.loaidouong_4 = loaiDoUongArray.includes('4') ? 1 : 0;
                    }
                    // Xử lý multiselect cho bua_phu_an
                    if (tqau.bua_phu_an) {
                        const buaPhuAnArray = commonService.isJSON(tqau.bua_phu_an) ? JSON.parse(tqau.bua_phu_an) : [];
                        exportData.buaphu_1 = buaPhuAnArray.includes('1') ? 1 : 0;
                        exportData.buaphu_2 = buaPhuAnArray.includes('2') ? 1 : 0;
                        exportData.buaphu_3 = buaPhuAnArray.includes('3') ? 1 : 0;
                        exportData.buaphu_4 = buaPhuAnArray.includes('4') ? 1 : 0;
                        exportData.buaphu_5 = buaPhuAnArray.includes('5') ? 1 : 0;
                    }
                }

                // Times Tình trạng dinh dưỡng mapping
                const timeTtddIndexMap = new Map();
                const timesTtddResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'tinh-trang-dinh-duong',
                    project: 'viem-gan',
                    active: 1
                });
                if (timesTtddResponse.success && timesTtddResponse.data && timesTtddResponse.data.length > 0) {
                    timesTtddResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeTtddIndexMap.set(time.id, suffix);
                        exportData[`time_ttdd_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // Tình trạng dinh dưỡng
                const ttddResponse = await commonService.getAllDataTable('viem_gan_ttdd', {
                    patient_id: patientId,
                    active: 1
                });
                if (ttddResponse.success && ttddResponse.data && ttddResponse.data.length > 0) {
                    ttddResponse.data.forEach(ttdd => {
                        const suffix = timeTtddIndexMap.get(ttdd.time_id);
                        if (!suffix) return;
                        exportData[`ttdd_cn_${suffix}`] = ttdd.cn;
                        exportData[`ttdd_cc_${suffix}`] = ttdd.cc;
                        exportData[`ttdd_vong_bap_chan_${suffix}`] = ttdd.vong_bap_chan;
                        exportData[`ttdd_glucose_${suffix}`] = ttdd.glucose;
                        exportData[`ttdd_ure_${suffix}`] = ttdd.ure;
                        exportData[`ttdd_creatinin_${suffix}`] = ttdd.creatinin;
                        exportData[`ttdd_got_${suffix}`] = ttdd.got;
                        exportData[`ttdd_gpt_${suffix}`] = ttdd.gpt;
                        exportData[`ttdd_ggt_${suffix}`] = ttdd.ggt;
                        exportData[`ttdd_hong_cau_${suffix}`] = ttdd.hong_cau;
                        exportData[`ttdd_hemoglobin_${suffix}`] = ttdd.hemoglobin;
                        exportData[`ttdd_pre_albumin_${suffix}`] = ttdd.pre_albumin;
                        exportData[`ttdd_albumin_${suffix}`] = ttdd.albumin;
                        exportData[`ttdd_protein_tp_${suffix}`] = ttdd.protein_tp;
                        exportData[`ttdd_sat_huyet_thanh_${suffix}`] = ttdd.sat_huyet_thanh;
                        exportData[`ttdd_ferritin_${suffix}`] = ttdd.ferritin;
                    });
                }

                // Times Can thiệp dinh dưỡng mapping
                const timeCtddIndexMap = new Map();
                const timesCtddResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'can-thiep-dinh-duong',
                    project: 'viem-gan',
                    active: 1
                });
                if (timesCtddResponse.success && timesCtddResponse.data && timesCtddResponse.data.length > 0) {
                    timesCtddResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeCtddIndexMap.set(time.id, suffix);
                        exportData[`time_ctdd_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // Can thiệp dinh dưỡng
                const ctddResponse = await commonService.getAllDataTable('viem_gan_ctdd', {
                    patient_id: patientId,
                    active: 1
                });
                if (ctddResponse.success && ctddResponse.data && ctddResponse.data.length > 0) {
                    ctddResponse.data.forEach(ctdd => {
                        const suffix = timeCtddIndexMap.get(ctdd.time_id);
                        if (!suffix) return;
                        exportData[`ctdd_chan_an_${suffix}`] = ctdd.chan_an;
                        exportData[`ctdd_chan_an_note_${suffix}`] = ctdd.chan_an_note;
                        exportData[`ctdd_an_khong_ngon_${suffix}`] = ctdd.an_khong_ngon;
                        exportData[`ctdd_an_khong_ngon_note_${suffix}`] = ctdd.an_khong_ngon_note;
                        exportData[`ctdd_buon_non_${suffix}`] = ctdd.buon_non;
                        exportData[`ctdd_buon_non_note_${suffix}`] = ctdd.buon_non_note;
                        exportData[`ctdd_non_${suffix}`] = ctdd.non;
                        exportData[`ctdd_non_note_${suffix}`] = ctdd.non_note;
                        exportData[`ctdd_tao_bon_${suffix}`] = ctdd.tao_bon;
                        exportData[`ctdd_tao_bon_note_${suffix}`] = ctdd.tao_bon_note;
                        exportData[`ctdd_tieu_chay_${suffix}`] = ctdd.tieu_chay;
                        exportData[`ctdd_tieu_chay_note_${suffix}`] = ctdd.tieu_chay_note;
                        exportData[`ctdd_song_phan_${suffix}`] = ctdd.song_phan;
                        exportData[`ctdd_song_phan_note_${suffix}`] = ctdd.song_phan_note;
                        exportData[`ctdd_nhiet_mieng_${suffix}`] = ctdd.nhiet_mieng;
                        exportData[`ctdd_nhiet_mieng_note_${suffix}`] = ctdd.nhiet_mieng_note;
                        exportData[`ctdd_thay_doi_vi_giac_${suffix}`] = ctdd.thay_doi_vi_giac;
                        exportData[`ctdd_thay_doi_vi_giac_note_${suffix}`] = ctdd.thay_doi_vi_giac_note;
                        exportData[`ctdd_khac_${suffix}`] = ctdd.khac;
                        exportData[`ctdd_khac_note_${suffix}`] = ctdd.khac_note;
                        exportData[`ctdd_co_chuong_${suffix}`] = ctdd.co_chuong;
                        exportData[`ctdd_co_chuong_note_${suffix}`] = ctdd.co_chuong_note;
                        exportData[`ctdd_met_moi_${suffix}`] = ctdd.met_moi;
                        exportData[`ctdd_met_moi_note_${suffix}`] = ctdd.met_moi_note;
                        exportData[`ctdd_dau_${suffix}`] = ctdd.dau;
                        exportData[`ctdd_dau_note_${suffix}`] = ctdd.dau_note;
                    });
                }

                // Times SGA mapping theo mt1
                const timeIndexMap = new Map();
                const timesResponse = await commonService.getAllDataTable('times', {
                    patient_id: patientId,
                    type: 'sga',
                    project: 'viem-gan',
                    active: 1
                });
                if (timesResponse.success && timesResponse.data && timesResponse.data.length > 0) {
                    timesResponse.data.forEach((time, index) => {
                        const suffix = index + 1;
                        timeIndexMap.set(time.id, suffix);
                        exportData[`time_sga_${suffix}`] = time.time ? moment(time.time).format('DD/MM/YYYY') : '';
                    });
                }

                // SGA data
                const sgaResponse = await commonService.getAllDataTable('viem_gan_sga', {
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
                        if (sga.total_point !== undefined) exportData[`sga_totalpoint_${suffix}`] = sga.total_point;
                    });
                }

                // // Chế độ ăn nội trú
                // const tdNotResponse = await commonService.getAllDataTable('viem_gan_td_not', {
                //     patient_id: patientId,
                //     active: 1
                // });
                // if (tdNotResponse.success && tdNotResponse.data && tdNotResponse.data.length > 0) {
                //     const tdNot = tdNotResponse.data[0];
                //     exportData.nd_duong_th = tdNot.nd_duong_th;
                //     exportData.nd_tinh_mac = tdNot.nd_tinh_mac;
                //     exportData.note_not = tdNot.note;
                // }

                // // Chế độ ăn ngoại trú
                // const tdNgtResponse = await commonService.getAllDataTable('viem_gan_td_ngt', {
                //     patient_id: patientId,
                //     active: 1
                // });
                // if (tdNgtResponse.success && tdNgtResponse.data && tdNgtResponse.data.length > 0) {
                //     const tdNgt = tdNgtResponse.data[0];
                //     exportData.cn_ngt = tdNgt.cn;
                //     exportData.bat_thuong = tdNgt.bat_thuong;
                //     exportData.tu_van = tdNgt.tu_van;
                //     exportData.note_ngt = tdNgt.note;
                // }

                // Tình trạng cơ bản viêm gan
                const ttcbResponse = await commonService.getAllDataTable('viem_gam_ttcb', {
                    patient_id: patientId,
                    active: 1
                });
                if (ttcbResponse.success && ttcbResponse.data && ttcbResponse.data.length > 0) {
                    const ttcb = ttcbResponse.data[0];
                    exportData.so_lan_vgc = ttcb.so_lan_vgc;
                    exportData.thoi_gian_vgm = ttcb.thoi_gian_vgm;
                    exportData.thoi_gian_vg_ruou = ttcb.thoi_gian_vg_ruou;
                    exportData.thoi_gian_vg_virus = ttcb.thoi_gian_vg_virus;
                    exportData.benh_gan_mat_khac = ttcb.benh_gan_mat_khac;
                    exportData.thoi_gian_gm_khac = ttcb.thoi_gian_gm_khac;
                    exportData.ts_benh_khac_1 = ttcb.ts_benh_khac_1;
                    exportData.ts_benh_1_so_nam = ttcb.ts_benh_1_so_nam;
                    exportData.ts_benh_khac_2 = ttcb.ts_benh_khac_2;
                    exportData.ts_benh_2_so_nam = ttcb.ts_benh_2_so_nam;
                    exportData.ts_benh_khac_3 = ttcb.ts_benh_khac_3;
                    exportData.ts_benh_3_so_nam = ttcb.ts_benh_3_so_nam;
                    exportData.ts_benh_khac_4 = ttcb.ts_benh_khac_4;
                    exportData.ts_benh_4_so_nam = ttcb.ts_benh_4_so_nam;
                    exportData.ts_benh_khac_5 = ttcb.ts_benh_khac_5;
                    exportData.ts_benh_5_so_nam = ttcb.ts_benh_5_so_nam;
                }
            }

            return exportData;

        } catch (error) {
            console.error('Error in getPatientExportData:', error);
            return {};
        }
    }
}

module.exports = hepatitis;