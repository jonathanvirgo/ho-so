var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { DOMParser } = require("@xmldom/xmldom");

let standard = {
    index: function(req, res){
        try {
            const arrPromise = [];
            const errors = [];
            const patient_id = req.params.patient_id;
            const user = req.user;
            let patient = {};
            let detailStandard = {};
            let times = [];
            let timeActiveId;
            let typeDetail = {view: 'index'};
            const type = req.params.type;
            if(user.isAdmin || user.role_id.includes(8)){
                // lấy thông tin cơ bản bệnh nhân
                arrPromise.push(
                    commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, {id: patient_id})).then(responseData =>{
                        if(responseData.success){
                            if(responseData.data && responseData.data.length > 0){
                                patient = responseData.data[0];
                                patient['tuoi'] = commonService.tinhTuoiChiTiet(patient.birthday);
                            }   
                        }else{
                            errors.push(responseData.message);  
                        }
                    })
                )
                typeDetail = standard.getTypeDetail(type);
                // Lấy thông tin phiếu
                arrPromise.push(
                    standard.getDataStandard(patient_id, typeDetail.isTime, typeDetail.table, req.user).then(responseData =>{
                        detailStandard = responseData.detailStandard; 
                        times = responseData.listTime;
                        timeActiveId = responseData.timeActiveId;
                    })
                );
            }else{
                errors.push('Bạn không có quyền truy cập bệnh nhân này!');
            }

            Promise.all(arrPromise).then(responseData =>{
                return res.render('standard/' + typeDetail.view, {
                    user: req.user,
                    errors: errors,
                    patient: patient,
                    moment: moment,
                    detailStandard: detailStandard,
                    times: times,
                    type: type,
                    timeActiveId: timeActiveId,
                    order: 1,
                    path: 'standard'
                });
            })
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    getDataStandard: function(patient_id, isTime, table, user){
        return new Promise(async (resolve, reject) => {   
            try {
                let detailStandard = {};
                let listTime = [];
                let condition =  securityService.applyRoleBasedFiltering(user, {patient_id: patient_id, active: 1});
                let timeActiveId;
                if(isTime){
                    // Get list time
                    switch(table){
                        case 'phieu_hoi_chan_danh_gia': condition['type'] = 'danh-gia';
                            break;
                        default: break;
                    }
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
                // Get detail hepastitis
                commonService.getAllDataTable(table, condition).then(responseData =>{
                    if(responseData.success){
                        if(responseData.data && responseData.data.length > 0) detailStandard = responseData.data[0];
                    }
                    resolve({detailStandard: detailStandard, listTime: listTime, timeActiveId: timeActiveId});
                })
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                resolve({detailStandard: {}, listTime: [], timeActiveId: null})
            }
        })
    },
    getTypeDetail: function(type){
        let view = 'index';
        let table = '';
        let isTime = false;
        switch(type){
            case 'thong-tin-chung':
                view = 'index';
                table = 'phieu_hoi_chan_ttc';
                break;
            case 'danh-gia':
                view = 'danh-gia';
                table = 'phieu_hoi_chan_danh_gia';
                isTime = true;
                break;
            default: break;
        }
        return {view: view, table: table, isTime: isTime};
    },
    deleteTime: async function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            let id = req.params.id;
            let patient_id = req.body.patient_id;
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {id: id, patient_id: patient_id}), 'times').then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                        switch(req.params.type){
                            case 'lam-sang':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'uon_van_ls')
                                break;
                            case 'tinh-trang-tieu-hoa':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'uon_van_ttth')
                                break;
                            case 'sga':
                                commonService.updateRecordTable({active: 0}, securityService.applyRoleBasedFiltering(req.user, {time_id: id, patient_id: patient_id}), 'uon_van_sga')
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
    editStandard: async function(req, res){
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
            const parameter = standard.getDataBodyStandard(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
                parameter.data['patient_id'] = req.params.patient_id;
                // Không thay đổi created_by khi sửa
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
    createStandard: function(req, res){
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
            const parameter = standard.getDataBodyStandard(req.body, req.params.type);
            const errors = securityService.validateInput(parameter.data, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
    getDataBodyStandard: function(body, type){
        switch(type){
            case 'thong-tin-chung':
                return {data: standard.thongTinChung(body), table: 'phieu_hoi_chan_ttc', condition: {id: body.id ? body.id : ''}}
            case 'danh-gia':
                return {data: standard.danhGia(body), table: 'phieu_hoi_chan_danh_gia', condition: {id: body.id ? body.id : ''}}
            default: break;
        }   
    },
    thongTinChung: function(body){
        return {
            cn: body.cn,
            cc: body.cc,
            ctc: body.ctc,
            chuan_doan_ls: body.chuan_doan_ls,
            ngay_hoi_chan: body.ngay_hoi_chan ? body.ngay_hoi_chan.split("/").reverse().join("/") : '',
            cn_1_thang: body.cn_1_thang,
            khau_phan_an: body.khau_phan_an,
            trieu_chung_th: body.trieu_chung_th,
            giam_chuc_nang_hd: body.giam_chuc_nang_hd,
            nhu_cau_chuyen_hoa: body.nhu_cau_chuyen_hoa,
            kham_lam_sang: body.kham_lam_sang,
            chon_tt_1: body.chon_tt_1,
            tien_su_benh: body.tien_su_benh,
            tinh_trang_nguoi_benh: body.tinh_trang_nguoi_benh,
            khau_phan_an_24h: body.khau_phan_an_24h,
            tieu_hoa: body.tieu_hoa,
            che_do_dinh_duong: body.che_do_dinh_duong,
            che_do_dinh_duong_note: body.che_do_dinh_duong_note,
            duong_nuoi: body.duong_nuoi,
            dich_vao: body.dich_vao,
            dich_ra: body.dich_ra,
            e_nckn: body.e_nckn,
            can_thiep_kcal: body.can_thiep_kcal,
            can_thiep_kg: body.can_thiep_kg,
            can_thiep_note: body.can_thiep_note,
            ket_qua_can_lam_sang: body.ket_qua_can_lam_sang,
            bo_sung: body.bo_sung,
            chu_y: body.chu_y
        }
    },
    danhGia: function(body){
        return {
            tinh_trang_nguoi_benh: body.tinh_trang_nguoi_benh,
            khau_phan_an_24h: body.khau_phan_an_24h,
            tieu_hoa: body.tieu_hoa,
            danh_gia: body.danh_gia,
            ket_qua_can_lam_sang: body.ket_qua_can_lam_sang,
            can_thiep_kcal: body.can_thiep_kcal,
            can_thiep_kg: body.can_thiep_kg,
            can_thiep_note: body.can_thiep_note,
            bo_sung: body.bo_sung,
            chu_y: body.chu_y,
            che_do_dinh_duong: body.che_do_dinh_duong,
            che_do_dinh_duong_note: body.che_do_dinh_duong_note,
            time_id: body.time_id
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
                project:'phieu-hoi-chan',
                created_by: req.user.id,
                campaign_id: req.user.campaign_id
            };
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
                case 'thong-tin-chung': table = 'phieu_hoi_chan_ttc'
                    break;
                case 'danh-gia': table = 'phieu_hoi_chan_danh_gia'
                    break;
                default: break
            }
            if(!req.user.role_id.includes(8) && !req.user.isAdmin){
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
    downloadStandard: async function(req, res) {
        try {
            const patient_id = req.params.patient_id;
            const id = req.params.id;
            const docx = require('docx');
            const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docx;
            
            // Lấy thông tin bệnh nhân
            const patientResult = await commonService.getAllDataTable('patients',  securityService.applyRoleBasedFiltering(req.user, {id: patient_id}));
            if (!patientResult.success || !patientResult.data || patientResult.data.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bệnh nhân' });
            }
            const patient = patientResult.data[0];
            patient['tuoi'] = commonService.tinhTuoiChiTiet(patient.birthday);

            // Lấy thông tin phiếu hội chẩn
            const ttcResult = await commonService.getAllDataTable('phieu_hoi_chan_ttc',  securityService.applyRoleBasedFiltering(req.user, {patient_id: patient_id, active: 1}));
            const ttc = ttcResult.success && ttcResult.data && ttcResult.data.length > 0 ? ttcResult.data[0] : null;

            // Lấy danh sách đánh giá
            const danhGiaResult = await commonService.getAllDataTable('phieu_hoi_chan_danh_gia', securityService.applyRoleBasedFiltering(req.user, {patient_id: patient_id, active: 1}));
            const danhGiaList = danhGiaResult.success && danhGiaResult.data ? danhGiaResult.data : [];

            // Tính cân lý tưởng
            const canLyTuong = ttc && ttc.cc ? ((parseFloat(ttc.cc) / 100) * (parseFloat(ttc.cc) / 100) * 22).toFixed(1) : '';

            // Tạo document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Header
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "BỆNH VIỆN BỆNH NHIỆT ĐỚI TW",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "KHOA DINH DƯỠNG",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "------------------------------------------",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "PHIẾU ĐÁNH GIÁ, CAN THIỆP DINH DƯỠNG",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    text: `Mã BA: ${patient.ma_benh_an || '……………………'}`,
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Thông tin chung
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Thông tin chung:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Bảng thông tin chung
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            width: {
                                                size: 33,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `1. Họ tên NB: ${patient.fullname || ''}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            width: {
                                                size: 33,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `2. Tuổi: ${patient.tuoi?.chuoiMoTa || 'Tuổi'}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            width: {
                                                size: 33,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `3. Giới: ${patient.gender === 1 ? 'Nam' : 'Nữ'}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `4. Cân nặng hiện tại (kg): ${ttc?.cn || ''}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `5. Chiều cao (cm): ${ttc?.cc || ''}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `6. BMI(kg/m2): ${ttc?.ctc || ''}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `7. Cân thường có (kg): ${ttc?.ctc || ''}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            colSpan: 2,
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: `8. Cân lý tưởng (kg) = CC(m)*CC(m)*22 = ${canLyTuong}`,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                })
                            ]
                        }),

                        // Đánh giá tình trạng dinh dưỡng
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "I. Đánh giá tình trạng dinh dưỡng:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `10. Chẩn đoán LS: ${ttc?.chuan_doan_ls || ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `11. Ngày hội chẩn DD (lần 1): ${ttc?.ngay_hoi_chan ? moment(ttc.ngay_hoi_chan).format('DD/MM/YYYY') : '(chọn ngày)'}`,
                                    size: 24
                                })
                            ]
                        }),

                        // Bảng đánh giá
                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            rows: [
                                // Header row
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            width: {
                                                size: 70,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: "Nội dung",
                                                        bold: true,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            width: {
                                                size: 30,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: "Điểm",
                                                        bold: true,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                // Các dòng đánh giá
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "12. Với NB bệnh không phù Thay đổi cân nặng trong 1 tháng qua (%)",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.cn_1_thang || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "13. Khẩu phần ăn",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.khau_phan_an || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "14. Triệu chứng tiêu hóa 2 tuần qua",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.trieu_chung_th || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "15. Giảm chức năng hoạt động",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.giam_chuc_nang_hd || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "16. Nhu cầu chuyển hóa, stress",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.nhu_cau_chuyen_hoa || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "17. Khám lâm sàng",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.kham_lam_sang || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "18. NB ≥ 70 tuổi/ Refeeding/ RL nuốt/ Kém HT/ Albumin <35 g/L",
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: ttc?.chon_tt_1 || '',
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                }),
                                // Tổng điểm
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.RIGHT,
                                                children: [
                                                    new TextRun({
                                                        text: "Tổng điểm",
                                                        bold: true,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [
                                                    new TextRun({
                                                        text: "12",
                                                        bold: true,
                                                        size: 24
                                                    })
                                                ]
                                            })]
                                        })
                                    ]
                                })
                            ]
                        }),

                        // Chẩn đoán dinh dưỡng
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "II. Chẩn đoán dinh dưỡng: SDD nặng",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "A=không nguy cơ (0-3 điểm) B=SDD nhẹ/vừa (4-8 điểm) C= SDD nặng (9-12 điểm)",
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Tham khảo: Delsky et al (1987),Covinsky et al (1999), Sacks GS et al (2000)",
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Kế hoạch và can thiệp DD
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "III. Kế hoạch và can thiệp DD:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "3.1. Hỏi bệnh",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Tiền sử bệnh: ${ttc?.tien_su_benh || ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Tình trạng NB: ${ttc?.tinh_trang_nguoi_benh || ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `KP 24h: ${ttc?.khau_phan_an_24h || ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Tiêu hóa: ${ttc?.tieu_hoa || ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Đường nuôi
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Đường nuôi: ",
                                    size: 24
                                }),
                                new TextRun({
                                    text:  ttc?.che_do_dinh_duong ? standard.getCheDoDinhDuong(ttc.che_do_dinh_duong) : '',
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Dịch vào/ra
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Dịch vào: ${ttc?.dich_vao || ''} (ml)`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Dịch ra: ${ttc?.dich_ra || ''} (ml)`,
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Xác định nhu cầu DD
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "3.2. Xác định nhu cầu DD",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `1. E NCKN = ${ttc?.e_nckn || ''} kcal/kg x ${canLyTuong} kg (cân lý tưởng) = ${ttc?.e_nckn && canLyTuong ? (parseFloat(ttc.e_nckn) * parseFloat(canLyTuong)).toFixed(0) : ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `E can thiệp = ${ttc?.can_thiep_kcal || ''} kcal/kg x ${ttc?.can_thiep_kg || ''} kg (cân HT) = ${ttc?.can_thiep_kcal && ttc?.can_thiep_kg ? (parseFloat(ttc.can_thiep_kcal) * parseFloat(ttc.can_thiep_kg)).toFixed(0) : ''}`,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ttc?.can_thiep_note || '',
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Chế độ DD
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Chế độ DD: ",
                                    size: 24
                                }),
                                new TextRun({
                                    text:  ttc?.che_do_dinh_duong ? standard.getCheDoDinhDuong(ttc.che_do_dinh_duong) : '',
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ttc?.che_do_dinh_duong_note || '',
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Kết quả cận LS
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "3.3. Kết quả cận LS:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ttc?.ket_qua_can_lam_sang || '',
                                    size: 24
                                })
                            ]
                        }),
                        
                        // Bổ sung
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "3.4. Bổ sung:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ttc?.bo_sung || '',
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "3.5. Chuẩn bị cho can thiệp:",
                                    bold: true,
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ttc?.chu_y || '',
                                    size: 24
                                })
                            ]
                        }),
                        new Paragraph({}),

                        // Danh sách đánh giá
                        ...danhGiaList.map((danhGia, index) => [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Lần ${index + 2}: Ngày ${moment(danhGia.created_at).format('DD [tháng] MM [năm] YYYY')} Giờ ${moment(danhGia.created_at).format('HH:mm')}`,
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 1. Tình trạng NB
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "1. Tình trạng NB",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.tinh_trang_nguoi_benh || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // KP 24h
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "KP 24h:",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.khau_phan_an_24h || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // Tiêu hóa
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Tiêu hóa:",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.tieu_hoa || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 2. Đánh giá
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "2. Đánh giá",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.danh_gia || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 3. Kết quả cận LS
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "3. Kết quả cận LS:",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.ket_qua_can_lam_sang || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 4. Can thiệp tiếp
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "4. Can thiệp tiếp",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 4.1. E can thiệp
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `4.1. E can thiệp (kcal/ngày) = ${danhGia.can_thiep_kcal || '      '} kcal/kg x ${danhGia.can_thiep_kg || '       '} kg (cân HT) = ${danhGia.can_thiep_kcal && danhGia.can_thiep_kg ? (parseFloat(danhGia.can_thiep_kcal) * parseFloat(danhGia.can_thiep_kg)).toFixed(0) : '          '}`,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Text: ${danhGia.can_thiep_note || ' tự ghi phần thông tin thêm nếu muốn'}`,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 4.2. Chế độ DD
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `4.2. Chế độ DD: (chọn ${danhGia.che_do_dinh_duong ? standard.getCheDoDinhDuong(danhGia.che_do_dinh_duong) : ' đường miệng  or  đường tiêu hoá or tĩnh mạch toàn phần or kết hợp'} )`,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: ` Text tự ghi (20 dòng): ${danhGia.che_do_dinh_duong_note || ''}`,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line

                            // 4.3. Bổ sung
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "4.3. Bổ sung:",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.bo_sung || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line
                            new Paragraph({}), // Empty line

                            // Chú ý
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Chú ý:",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: danhGia.chu_y || '',
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line
                            new Paragraph({}), // Empty line

                            // Bác sỹ
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Bác sỹ (ghi tên): Nguyễn Thị Hoài Dung",
                                        bold: true,
                                        size: 24
                                    })
                                ]
                            }),
                            new Paragraph({}), // Empty line
                            new Paragraph({}), // Empty line
                        ]).flat()
                    ]
                }]
            });

            // Tạo buffer
            const buffer = await docx.Packer.toBuffer(doc);

            // Gửi file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename=phieu-hoi-chan-${patient.ma_benh_an || patient_id}.docx`);
            res.send(buffer);

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    getCheDoDinhDuong: function(code) {
        switch(code) {
            case '1': return 'Đường miệng';
            case '2': return 'Đường tiêu hoá';
            case '3': return 'Đường tĩnh mạch';
            case '4': return 'Kết hợp';
            default: return '';
        }
    },
    downloadStandardTemplate: async function(req, res) {
        try {
            const patient_id = req.params.patient_id;
            // 1. Load dữ liệu
            const [patientRes, ttcRes, danhGiaRes] = await Promise.all([
                commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, {id: patient_id})),
                commonService.getAllDataTable('phieu_hoi_chan_ttc', securityService.applyRoleBasedFiltering(req.user, {patient_id: patient_id, active: 1})),
                commonService.getListTable(`SELECT hc.*, times.time
                    FROM phieu_hoi_chan_danh_gia hc 
                    INNER JOIN times ON hc.time_id = times.id
                    WHERE hc.patient_id = ? AND hc.active = ?`, [patient_id, 1])
            ]);

            const patient = patientRes.data[0];
            const ttc = ttcRes.data[0];
            if(!ttc) return res.json({success: false, message: 'Không có thông tin phiếu hội chẩn'});
            const danhGiaList = (danhGiaRes.data || []).sort((a, b) => new Date(a.time) - new Date(b.time)).map((item, i) => ({
                index: i + 2,
                ngay_danh_gia: moment(item.time).format('DD/MM/YYYY HH:mm'),
                can_thiep_tiep_total: item.can_thiep_kcal && item.can_thiep_kg ? (parseFloat(item.can_thiep_kcal) * parseFloat(item.can_thiep_kg)).toFixed(0) : '',
                che_do_dinh_duong_text: standard.getCheDoDinhDuong(item.che_do_dinh_duong),
                ...item
            }));
        
            // 2. Chuẩn bị dữ liệu truyền vào template
            const data = {
                fullname: patient.fullname || '',
                tuoi: commonService.tinhTuoiChiTiet(patient.birthday).chuoiMoTaNgan || '',
                gender: patient.gender === 1 ? 'Nam' : (patient.gender === 0 ? 'Nữ' : 'Khác'),
                ma_benh_an: patient.ma_benh_an || '',
                ngay_hoi_chan: moment(ttc.ngay_hoi_chan, "YYYY-MM-DD").format('DD/MM/YYYY'),
                bmi: ttc.ctc ? (parseFloat(ttc.cn) / (parseFloat(ttc.cc) / 100)).toFixed(1) : '',
                can_ly_tuong: ttc.cc ? ((parseFloat(ttc.cc) / 100) ** 2 * 22).toFixed(1) : '',
                cn_1_thang_0: ttc.cn_1_thang === '0' ? '0' : '',
                cn_1_thang_1: ttc.cn_1_thang === '1' ? '1' : '',
                cn_1_thang_2: ttc.cn_1_thang === '2' ? '2' : '',
                khau_phan_an0: ttc.khau_phan_an === '0' ? '0' : '',
                khau_phan_an1: ttc.khau_phan_an === '1' ? '1' : '',
                khau_phan_an2: ttc.khau_phan_an === '2' ? '2' : '',
                trieu_chung_th0: ttc.trieu_chung_th === '0' ? '0' : '',
                trieu_chung_th1: ttc.trieu_chung_th === '1' ? '1' : '',
                trieu_chung_th2: ttc.trieu_chung_th === '2' ? '2' : '',
                giam_chuc_nang_hd0: ttc.giam_chuc_nang_hd === '0' ? '0' : '',
                giam_chuc_nang_hd1: ttc.giam_chuc_nang_hd === '1' ? '1' : '',
                giam_chuc_nang_hd2: ttc.giam_chuc_nang_hd === '2' ? '2' : '',
                nhu_cau_chuyen_hoa0: ttc.nhu_cau_chuyen_hoa === '0' ? '0' : '',
                nhu_cau_chuyen_hoa1: ttc.nhu_cau_chuyen_hoa === '1' ? '1' : '',
                nhu_cau_chuyen_hoa2: ttc.nhu_cau_chuyen_hoa === '2' ? '2' : '',
                kham_lam_sang0: ttc.kham_lam_sang === '0' ? '0' : '',
                kham_lam_sang1: ttc.kham_lam_sang === '1' ? '1' : '',
                kham_lam_sang2: ttc.kham_lam_sang === '2' ? '2' : '',
                chon_tt_10: ttc.chon_tt_1 === '0' ? '0' : '',
                chon_tt_11: ttc.chon_tt_1 === '1' ? '1' : '',
                tong_diem: parseInt(ttc.cn_1_thang ? ttc.cn_1_thang : 0) + parseInt(ttc.khau_phan_an ? ttc.khau_phan_an : 0) + parseInt(ttc.trieu_chung_th ? ttc.trieu_chung_th : 0) + parseInt(ttc.giam_chuc_nang_hd ? ttc.giam_chuc_nang_hd : 0) + parseInt(ttc.nhu_cau_chuyen_hoa ? ttc.nhu_cau_chuyen_hoa : 0) + parseInt(ttc.kham_lam_sang ? ttc.kham_lam_sang : 0) + parseInt(ttc.chon_tt_1 ? ttc.chon_tt_1 : 0),
                che_do_dinh_duong_text: standard.getCheDoDinhDuong(ttc.che_do_dinh_duong),
                duong_nuoi_text: standard.getCheDoDinhDuong(ttc.duong_nuoi),
                e_can_thiep_total: ttc.can_thiep_kcal && ttc.can_thiep_kg ? (parseFloat(ttc.can_thiep_kcal) * parseFloat(ttc.can_thiep_kg)).toFixed(0) : '',
                ...ttc,
                danhGiaList: danhGiaList,
                bac_si: req.user.fullname || ''
            };

            data['chuan_doan_dd'] =data.tong_diem >= 9 ? 'SDD nặng' : (data.tong_diem >= 4 ? 'SDD nhẹ/vừa' : 'Không nguy cơ');
            data['e_nckn_total'] = data.e_nckn && data.can_ly_tuong ? (parseFloat(data.e_nckn) * parseFloat(data.can_ly_tuong)).toFixed(0) : '';
            data['ngay_hoi_chan'] = moment(data.ngay_hoi_chan).format('DD/MM/YYYY');
            // 3. Load template
            const templatePath = path.resolve(__dirname, "../templates/phieu_hoi_chuan.docx");
            const content = fs.readFileSync(templatePath, "binary");
            const zip = new PizZip(content);

            // 4. Tạo docx từ template
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                parser: (tag) => ({ get: (scope) => scope[tag] }) // dùng tên biến thuần
            });

            try {
                doc.render(data);
            } catch (error) {
                console.error("Template error", error);
                return res.status(500).send("Lỗi khi render file Word");
            }

            // 5. Xuất file
            const buffer = doc.getZip().generate({ type: "nodebuffer" });
            const filename = `phieu-hoi-chan-${patient.ma_benh_an || patient_id}.docx`;

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
            res.send(buffer);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    downloadHoichan: async function(req, res) {
        try {
            const patient_id = req.params.patient_id;
            // 1. Load dữ liệu
            const [patientRes, kpaRes] = await Promise.all([
                commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, {id: patient_id})),
                commonService.getAllDataTable('cat_gan_nho_kpa', securityService.applyRoleBasedFiltering(req.user, {patient_id: patient_id, active: 1}))
            ]);

            if (!patientRes.success || !patientRes.data || patientRes.data.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin bệnh nhân' });
            }
            const patient = patientRes.data[0];

            if (!kpaRes.success || !kpaRes.data || kpaRes.data.length === 0) {
                return res.status(404).json({ success: false, message: 'Không có thông tin KPA' });
            }
        
            const danhGiaList = (kpaRes.data || []).sort((a, b) => new Date(a.time) - new Date(b.time)).map((item, i) => ({
                index: i + 1,
                ngay_danh_gia: moment(item.time).format('DD/MM/YYYY'),
                ...item
            }));

            // 2. Chuẩn bị dữ liệu truyền vào template
            const data = {
                fullname: patient.fullname || '',
                tuoi: commonService.tinhTuoiChiTiet(patient.birthday).chuoiMoTaNgan || '',
                gender: patient.gender === 1 ? 'Nam' : (patient.gender === 0 ? 'Nữ' : 'Khác'),
                ma_benh_an: patient.ma_benh_an || '',
                ngay_hoi_chan: patient.ngay_hoi_chan ? moment(patient.ngay_hoi_chan, "YYYY-MM-DD").format('DD/MM/YYYY') : '',
                bmi: patient.cn && patient.cc ? (parseFloat(patient.cn) / ((parseFloat(patient.cc) / 100) * (parseFloat(patient.cc) / 100))).toFixed(1) : '',
                can_ly_tuong: patient.cc ? ((parseFloat(patient.cc) / 100) ** 2 * 22).toFixed(1) : '',
                tien_su_benh: patient.tien_su_benh || '',
                chuan_doan: patient.chuan_doan || '',
                danhGiaList: danhGiaList, // No evaluation list for this version
                bac_si: req.user.fullname || ''
            };

            if(data.ngay_hoi_chan) data['ngay_hoi_chan'] = moment(data.ngay_hoi_chan).format('DD/MM/YYYY');
            
            // 3. Load template
            const templatePath = path.resolve(__dirname, "../templates/hoi_chuan.docx");
            const content = fs.readFileSync(templatePath, "binary");
            const zip = new PizZip(content);

            // 4. Tạo docx từ template
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                parser: (tag) => ({ get: (scope) => scope[tag] }) // dùng tên biến thuần
            });

            try {
                doc.render(data);
            } catch (error) {
                console.error("Template error", error);
                return res.status(500).send("Lỗi khi render file Word");
            }

            // 5. Xuất file
            const buffer = doc.getZip().generate({ type: "nodebuffer" });
            const filename = `hoi-chan-${patient.ma_benh_an || patient_id}.docx`;

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
            res.send(buffer);
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    }
}

module.exports = standard;
