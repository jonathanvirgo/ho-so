var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');

let patient = {
    getlist: function(req, res, next){
        try {
            let path = req.path.slice(1);
            let errors = [];
            let user = req.user;
            errors = [...commonService.checkRoleUser(path, user), ...errors];
            return res.render("patient/list", {
                user: user,
                path: path,
                errors: errors
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    list: function(req, res, next){
        try {
            let type;
            switch(req.body.path){
                case 'viem-gan': type = 3; break;
                case 'uon-van': type = 4; break;
                case 'hoi-chan': type = 5; break;
                case 'viem-gan-mt1': type = 6; break;
                case 'standard': type = 8; break;
                default: break;
            }

            let checkRole = commonService.checkRoleUser(req.body.path, req.user);
            if(checkRole.length > 0){
                return res.json({
                    draw: req.body.draw || 1,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                    error: checkRole.join(', ')
                });
            }

            // Định nghĩa columns mapping cho DataTables
            const columnsMapping = [
                '', // column 0 - actions column (không sort được)
                'fullname', // column 1
                'phone', // column 2
                'phong_dieu_tri', // column 3
                'ngay_hoi_chan', // column 4
                'chuan_doan' // column 5
            ];

            // Order mặc định
            const defaultOrder = [
                {
                    column: 'khan_cap', // khẩn cấp đầu tiên
                    dir: 'DESC'
                },
                {
                    column: 'ngay_hoi_chan', // ngày hội chẩn thứ hai
                    dir: 'DESC'
                },
                {
                    column: 'id', // id cuối cùng
                    dir: 'DESC'
                }
            ];

            // Cấu hình DataTable
            const config = {
                table: 'patients',
                columns: ['id', 'fullname', 'phone', 'ma_benh_an', 'phong_dieu_tri', 'khoa', 'chuan_doan', 'ngay_hoi_chan', 'khan_cap', 'dieu_tra_vien', 'active', 'bien_ban','ngay_dieu_tra'],
                primaryKey: 'id',
                active: 0,
                activeOperator: '!=',
                filters: securityService.applyRoleBasedFiltering(req.user, {
                    type: type
                }),
                searchColumns: ['fullname', 'phone', 'ma_benh_an', 'phong_dieu_tri', 'khoa'],
                columnsMapping: columnsMapping,
                defaultOrder: defaultOrder,
                checkRole: false
            };

            // Function xử lý dữ liệu trước khi trả về
            const preprocessData = async (data) => {
                return data.map(patient => {
                    if(patient.khan_cap == 1) {
                        // Thêm biểu tượng cờ trước tên bệnh nhân
                        patient.fullname = '🚩 ' + patient.fullname;
                    }
                    return patient;
                });
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
        // try {
        //     var resultMessage = {
        //         "data": [],
        //         "error": "",
        //         "draw": "1",
        //         "recordsFiltered": 0,
        //         "recordsTotal": 0
        //     };
    
        //     let type;
        //     switch(req.body.path){
        //         case 'viem-gan': type = 3; break;
        //         case 'uon-van': type = 4; break;
        //         case 'hoi-chan': type = 5; break;
        //         case 'viem-gan-mt1': type = 6; break;
        //         case 'standard': type = 8; break;
        //         default: break;
        //     }
        //     let checkRole = commonService.checkRoleUser(req.body.path, req.user);
        //     if(checkRole.length > 0){
        //         resultMessage.error = checkRole.join(', ');
        //         return res.json(resultMessage);
        //     }
        //     var arrPromise = [],
        //         errors     = [],
        //         parameter  = {
        //             skip: isNaN(parseInt(req.body.start)) ? 0 : parseInt(req.body.start),
        //             take: isNaN(parseInt(req.body.length)) ? 15 : parseInt(req.body.length),
        //             search_value: req.body['search[value]'],
        //             type: type
        //         };
        //     arrPromise.push(commonService.countAllPatients(parameter).then(responseData =>{
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
    
        //     arrPromise.push(commonService.getAllPatients(parameter).then(responseData =>{
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
        //         res.json(resultMessage);
        //     });
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
    getCreate: function(req, res, next){
        try {
            let errors = commonService.checkRoleUser(req.params.path, req.user);
            return res.render("patient/create", {
                user: req.user, 
                path: req.params.path,
                detailPatient: {},
                moment: moment,
                errors: errors
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    getEdit: function(req, res){
        try {
            let arrPromise = [];
            let errors = commonService.checkRoleUser(req.params.path, req.user);
            let detailPatient = {}; 
            let patientDt = {};
            let ortherDt = {};
            const id = req.params.id;
            arrPromise.push(commonService.getAllDataTable('patients', securityService.applyRoleBasedFiltering(req.user, {id: id, active: { op: '!=', value: 0 }})).then(responseData =>{
                if(responseData.success){
                    if(responseData.data && responseData.data.length > 0){
                        patientDt = responseData.data[0];
                    }
                }else{
                    errors.push(responseData.message);
                }
            }));
            if(req.params.path == 'viem-gan'){
                arrPromise.push(commonService.getAllDataTable('viem_gam_ttcb', securityService.applyRoleBasedFiltering(req.user, {patient_id: id})).then(responseData =>{
                    if(responseData.success){
                        if(responseData.data && responseData.data.length > 0){
                            ortherDt = responseData.data[0];
                        }
                    }else{
                        errors.push(responseData.message);
                    }
                }));
            }
            Promise.all(arrPromise).then(()=>{
                delete ortherDt.id;
                delete ortherDt.created_at;
                delete ortherDt.updated_at;
                detailPatient = commonService.extendObject({}, patientDt, ortherDt);
                return res.render("patient/create", {
                    user: req.user, 
                    path: req.params.path,
                    detailPatient: detailPatient,
                    moment: moment,
                    errors: errors
                });
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    create: async function(req, res){
        try {
            var resultData = securityService.createErrorResponse("Tạo bệnh nhân thất bại");
            let checkUpdate = true;
            const validateRules = [
                { field: "fullname", type: "string", required: true, message: "Vui lòng nhập họ tên!" },
                { field: "phone", type: "string", required: true, message: "Vui lòng nhập số điện thoại!" }
            ];
            let path = req.body.path;
            const parameter = {
                fullname: req.body.fullname,
                ma_benh_an: req.body.ma_benh_an,
                ngay_nhap_vien: req.body.ngay_nhap_vien || null,
                phong_dieu_tri: req.body.phong_dieu_tri,
                phone: req.body.phone,
                gender: req.body.gender || null,
                birthday: req.body.birthday || null,
                dan_toc: req.body.dan_toc,
                dan_toc_khac: req.body.dan_toc_khac,
                trinh_do: req.body.trinh_do || null,
                nghe_nghiep: req.body.nghe_nghiep || null,
                nghe_nghiep_khac: req.body.nghe_nghiep_khac,
                noi_o: req.body.noi_o,
                xep_loai_kt: req.body.xep_loai_kt || null,
                chuan_doan: req.body.chuan_doan,
                khoa: req.body.khoa,
                que_quan: req.body.que_quan,
                dieu_tra_vien: req.body.dieu_tra_vien,
                moi_quan_he: req.body.moi_quan_he,
                tien_su_benh: req.body.tien_su_benh,
                cn: req.body.cn,
                cc: req.body.cc,
                ngay_hoi_chan: req.body.ngay_hoi_chan || null,
                ngay_dieu_tra: req.body.ngay_dieu_tra,
                created_by: req.user.id,
                campaign_id: req.user.campaign_id
            };
            switch(path){
                case 'viem-gan':
                    parameter['type'] = 3; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(3)) checkUpdate = false;
                    break;
                case 'uon-van':
                    parameter['type'] = 4; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(4)) checkUpdate = false;
                    break
                case 'hoi-chan':
                    parameter['type'] = 5; 
                    validateRules.pop();
                    if(!req.user.isAdmin && !req.user.role_id.includes(5)) checkUpdate = false;
                    break
                case 'viem-gan-mt1':
                    parameter['type'] = 6; 
                    validateRules.pop();
                    if(!req.user.isAdmin && !req.user.role_id.includes(6)) checkUpdate = false;
                    break
                case 'standard':
                    parameter['type'] = 8; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(8)) checkUpdate = false;
                    break
                default: break;
            }
            
            if(!checkUpdate){
                resultData.message = 'Bạn không có quyền tạo bệnh nhân này';
                return res.json(resultData);
            }
            var parameter2 = {};
            if(path == 'viem-gan'){
                parameter2 = {
                    so_lan_vgc: req.body.so_lan_vgc,
                    thoi_gian_vgm: req.body.thoi_gian_vgm,
                    thoi_gian_vg_ruou: req.body.thoi_gian_vg_ruou,
                    thoi_gian_vg_virus: req.body.thoi_gian_vg_virus,
                    benh_gan_mat_khac: req.body.benh_gan_mat_khac,
                    thoi_gian_gm_khac: req.body.thoi_gian_gm_khac,
                    ts_benh_khac_1: req.body.ts_benh_khac_1,
                    ts_benh_1_so_nam: req.body.ts_benh_1_so_nam,
                    ts_benh_khac_2: req.body.ts_benh_khac_2,
                    ts_benh_2_so_nam: req.body.ts_benh_2_so_nam,
                    ts_benh_khac_3: req.body.ts_benh_khac_3,
                    ts_benh_3_so_nam: req.body.ts_benh_3_so_nam,
                    ts_benh_khac_4: req.body.ts_benh_khac_4,
                    ts_benh_4_so_nam: req.body.ts_benh_4_so_nam,
                    ts_benh_khac_5: req.body.ts_benh_khac_5,
                    ts_benh_5_so_nam: req.body.ts_benh_5_so_nam,
                    created_by: req.user.id     
                }
            }
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                if(parameter.ngay_nhap_vien) parameter.ngay_nhap_vien = parameter.ngay_nhap_vien.split("/").reverse().join("/");
                if(parameter.ngay_hoi_chan) parameter.ngay_hoi_chan = parameter.ngay_hoi_chan.split("/").reverse().join("/");
                if(parameter.birthday) parameter.birthday = parameter.birthday.split("/").reverse().join("/");
                if(parameter.ngay_dieu_tra) parameter.ngay_dieu_tra = parameter.ngay_dieu_tra.split("/").reverse().join("/");
                
                let checkExist = false;
                if((!['hoi-chan', 'viem-gan-mt1'].includes(path) && !parameter.phone)){
                    // kiểm tra tồn tại bệnh nhân theo số điện thoại
                    const responseData1 = await commonService.getAllDataTable('patients', {phone: parameter.phone, type: parameter.type, active: { op: 'IN', value: [1, 3] }, campaign_id: req.user.campaign_id})
                    if(responseData1.success && responseData1.data && responseData1.data.length > 0){
                        checkExist = true;
                    }
                }
                if(checkExist){
                    resultData.message = `Bệnh nhân có số điện thoại ${parameter.phone} đã tồn tại!`;
                    res.json(resultData);
                }else{
                    commonService.addRecordTable(parameter, 'patients', true).then(responseData =>{
                        if(responseData.success && responseData.data){
                            resultData.success = true;
                            resultData.message = 'Tạo mới bệnh nhân thành công!';
                            parameter2['patient_id'] = responseData.data.insertId;
                            if(path == 'viem-gan'){
                                commonService.addRecordTable(parameter2, 'viem_gam_ttcb', true);
                            } 
                        }else{
                            resultData.message = responseData.message;
                        }
                        res.json(resultData);
                    });
                }
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    update: async function(req, res){
        try {
            var resultData = {
                success: false,
                message: "",
                data: ''
            };
            let checkUpdate = true;
            let path = req.body.path;
            // new Date().toLocaleDateString('fr-CA');
            const validateRules = [
                { field: "fullname", type: "string", required: true, message: "Vui lòng nhập họ tên!" },
                { field: "phone", type: "string", required: true, message: "Vui lòng nhập số điện thoại!" }
            ];
    
            const parameter = {
                fullname: req.body.fullname,
                ma_benh_an: req.body.ma_benh_an,
                ngay_nhap_vien: req.body.ngay_nhap_vien || null,
                phong_dieu_tri: req.body.phong_dieu_tri,
                phone: req.body.phone,
                gender: req.body.gender || null,
                birthday: req.body.birthday || null,
                dan_toc: req.body.dan_toc,
                dan_toc_khac: req.body.dan_toc_khac,
                trinh_do: req.body.trinh_do || null,
                nghe_nghiep: req.body.nghe_nghiep || null,
                nghe_nghiep_khac: req.body.nghe_nghiep_khac,
                noi_o: req.body.noi_o,
                xep_loai_kt: req.body.xep_loai_kt || null,
                chuan_doan: req.body.chuan_doan,
                khoa: req.body.khoa,
                que_quan: req.body.que_quan,
                dieu_tra_vien: req.body.dieu_tra_vien,
                moi_quan_he: req.body.moi_quan_he,
                tien_su_benh: req.body.tien_su_benh,
                cn: req.body.cn,
                cc: req.body.cc,
                ngay_hoi_chan: req.body.ngay_hoi_chan || null,
                ngay_dieu_tra: req.body.ngay_dieu_tra
            };
            switch(path){
                case 'viem-gan':
                    parameter['type'] = 3; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(3)) checkUpdate = false;
                    break;
                case 'uon-van':
                    parameter['type'] = 4; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(4)) checkUpdate = false;
                    break
                case 'hoi-chan':
                    parameter['type'] = 5; 
                    validateRules.pop();
                    if(!req.user.isAdmin && !req.user.role_id.includes(5)) checkUpdate = false;
                    break
                case 'viem-gan-mt1':
                    parameter['type'] = 6; 
                    validateRules.pop();
                    if(!req.user.isAdmin && !req.user.role_id.includes(6)) checkUpdate = false;
                    break
                case 'standard':
                    parameter['type'] = 8; 
                    if(!req.user.isAdmin && !req.user.role_id.includes(8)) checkUpdate = false;
                    break
                default: break;
            }
            if(!checkUpdate){
                resultData.message = 'Bạn không có quyền sửa bệnh nhân này';
                return res.json(resultData);
            }
            var parameter2 = {};
            if(path == 'viem-gan'){
                parameter2 = {
                    so_lan_vgc: req.body.so_lan_vgc,
                    thoi_gian_vgm: req.body.thoi_gian_vgm,
                    thoi_gian_vg_ruou: req.body.thoi_gian_vg_ruou,
                    thoi_gian_vg_virus: req.body.thoi_gian_vg_virus,
                    benh_gan_mat_khac: req.body.benh_gan_mat_khac,
                    thoi_gian_gm_khac: req.body.thoi_gian_gm_khac,
                    ts_benh_khac_1: req.body.ts_benh_khac_1,
                    ts_benh_1_so_nam: req.body.ts_benh_1_so_nam,
                    ts_benh_khac_2: req.body.ts_benh_khac_2,
                    ts_benh_2_so_nam: req.body.ts_benh_2_so_nam,
                    ts_benh_khac_3: req.body.ts_benh_khac_3,
                    ts_benh_3_so_nam: req.body.ts_benh_3_so_nam,
                    ts_benh_khac_4: req.body.ts_benh_khac_4,
                    ts_benh_4_so_nam: req.body.ts_benh_4_so_nam,
                    ts_benh_khac_5: req.body.ts_benh_khac_5,
                    ts_benh_5_so_nam: req.body.ts_benh_5_so_nam   
                }
            }
            const id = req.body.id ? req.body.id : '';
            
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if(!id) errors.push('Thiếu Id bệnh nhân');
            if(errors.length > 0){
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }else{
                let checkExist = false;
                if((!['hoi-chan', 'viem-gan-mt1'].includes(path) && !parameter.phone)){
                    // kiểm tra tồn tại bệnh nhân theo số điện thoại
                    const responseData1 = await commonService.getAllDataTable('patients', {phone: parameter.phone, type: parameter.type, active: { op: 'IN', value: [1, 3] }, campaign_id: req.user.campaign_id})
                    if(responseData1.success && responseData1.data && responseData1.data.length > 0){
                        if(responseData1.data[0].id != parseInt(id)){
                            checkExist = true;
                        }
                    }
                }
                
                if(checkExist){
                    resultData.message = `Bệnh nhân có số điện thoại ${parameter.phone} đã tồn tại!`;
                    res.json(resultData);
                }else{
                    if(parameter.ngay_nhap_vien) parameter.ngay_nhap_vien = parameter.ngay_nhap_vien.split("/").reverse().join("/");
                    if(parameter.birthday) parameter.birthday = parameter.birthday.split("/").reverse().join("/");
                    if(parameter.ngay_hoi_chan) parameter.ngay_hoi_chan = parameter.ngay_hoi_chan.split("/").reverse().join("/");
                    if(parameter.ngay_dieu_tra) parameter.ngay_dieu_tra = parameter.ngay_dieu_tra.split("/").reverse().join("/");
                    commonService.updateRecordTable(parameter, {id: id}, 'patients').then(responseData =>{
                        if(responseData.success && responseData.data){
                            resultData.success = true;
                            resultData.message = 'Cập nhật thành công!';
                            if(parameter.type == 3){
                                commonService.updateRecordTable(parameter2, {patient_id: id},'viem_gam_ttcb');
                            } 
                        }else{
                            resultData.message = responseData.message;
                        }
                        res.json(resultData);
                    });
                }
            }
        } catch (error) {
            console.log("error update", error);
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    active: function(req, res){
        try {
            var resultData = {
                success: false,
                message: ""
            };
            let id = req.body.id;
            let path = req.body.path;
            let active = req.body.active;
            let bien_ban = req.body.bien_ban;
            let khan_cap = req.body.khan_cap;
            let type = req.body.type;
            let checkRole = commonService.checkRoleUser(path, req.user);
            if(checkRole.length > 0){
                resultData.message = checkRole.join(', ');
                return res.json(resultData);
            }
            if(id){
                let data = {active: active};
                if(type == 'bien_ban') {
                    data['bien_ban'] = bien_ban;
                    delete data.active;
                }
                if(type == 'khan_cap') {
                    data['khan_cap'] = khan_cap;
                    delete data.active;
                }
                commonService.updateRecordTable(data, {id: id}, 'patients').then(responseData =>{
                    if(responseData.success){
                        resultData.success = true;
                        resultData.message = 'Thành công!';
                    }else{
                        resultData.message = responseData.message;
                    }
                    return res.json(resultData);
                });
            }else{
                resultData.message = 'Thiếu Id bệnh nhân!';
                return res.json(resultData);
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            res.json(securityService.createErrorResponse("Có lỗi xảy ra, vui lòng thử lại sau!"));
        }
    },
    detail: function(req, res){
        try {
            let user = req.user;
            // Nếu admin hoặc role viem gan chuyển viêm gan
            if(req.params.path == 'viem-gan' && (user.isAdmin || user.role_id.includes(3))){
                res.redirect('/viem-gan/' + req.params.id + '/dau-hieu-nhap-vien');
            }else if(req.params.path == 'uon-van' && (user.isAdmin || user.role_id.includes(4))){
                res.redirect('/uon-van/' + req.params.id + '/lam-sang');
            }else if(req.params.path == 'hoi-chan' && (user.isAdmin || user.role_id.includes(5))){
                res.redirect('/hoi-chan/' + req.params.id + '/khau-phan-an');
            }else if(req.params.path == 'viem-gan-mt1' && (user.isAdmin || user.role_id.includes(6))){
                res.redirect('/viem-gan-mt1/' + req.params.id + '/dau-hieu-nhap-vien');
            }else if(req.params.path == 'standard' && (user.isAdmin || user.role_id.includes(8))){
                res.redirect('/standard/' + req.params.id + '/thong-tin-chung');
            }else{
                res.render('error');
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    // Lưu cấu hình hiển thị bảng
    saveTableDisplayConfig: async function(req, res) {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const { patient_id, config } = req.body;
            
            if (!patient_id || !config) {
                resultData.message = 'Thiếu thông tin cần thiết!';
                return res.json(resultData);
            }
            
            // Cập nhật cấu hình cho bệnh nhân
            const updateData = {
                table_display_config: config
            };
            
            const responseData = await commonService.updateRecordTable(updateData, { id: patient_id }, 'patients_research');
            
            resultData.success = responseData.success;
            resultData.message = responseData.success ? 'Lưu cấu hình thành công!' : responseData.message;
            
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Có lỗi xảy ra khi lưu cấu hình!';
        }
        
        res.json(resultData);
    },
    
    // Lấy cấu hình hiển thị bảng
    getTableDisplayConfig: async function(req, res) {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            const { patient_id } = req.query;
            
            if (!patient_id) {
                resultData.message = 'Thiếu ID bệnh nhân!';
                return res.json(resultData);
            }
            
            // Lấy thông tin bệnh nhân
            const responseData = await commonService.getAllDataTable('patients_research', { id: patient_id });
            
            if (responseData.success && responseData.data && responseData.data.length > 0) {
                resultData.success = true;
                resultData.data = responseData.data[0];
            } else {
                resultData.message = 'Không tìm thấy thông tin bệnh nhân!';
            }
            
        } catch (error) {
             commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Có lỗi xảy ra khi lấy cấu hình!';
        }
        
        res.json(resultData);
    },

    // Export patient data to Excel
    exportToExcel: async function(req, res) {
        try {
            const path = req.params.path;
            const user = req.user;
            
            // Kiểm tra quyền truy cập
            const checkRole = commonService.checkRoleUser(path, user);
            if (checkRole.length > 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: checkRole.join(', ') 
                });
            }

            // Xác định type dựa trên path
            let type;
            switch(path) {
                case 'viem-gan': type = 3; break;
                case 'uon-van': type = 4; break;
                case 'viem-gan-mt1': type = 6; break;
                default: 
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Path không hợp lệ!' 
                    });
            }

            // Lấy danh sách bệnh nhân theo campaign_id và type
            const patientsResponse = await commonService.getAllDataTable('patients', {
                type: type,
                campaign_id: user.campaign_id,
                active: { op: '!=', value: 0 }
            });

            if (!patientsResponse.success) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Không thể lấy dữ liệu bệnh nhân!' 
                });
            }

            const patients = patientsResponse.data || [];
            
            if (patients.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không có dữ liệu bệnh nhân để xuất!' 
                });
            }

            // Tạo exportData từ tất cả bệnh nhân
            const exportData = [];
            let i = 0;
            for (const patientItem of patients) {
                let patientData = commonService.getBasicPatientData(patientItem);
                
                // Lấy dữ liệu chi tiết từ controller tương ứng
                let detailController;
                switch(path) {
                    case 'viem-gan-mt1':
                        detailController = require('../controllers/hepstitisMt1Controller');
                        break;
                    case 'viem-gan':
                        detailController = require('../controllers/hepatitisController');
                        break;
                    case 'uon-van':
                        detailController = require('../controllers/tetanusController');
                        break;
                    default: break;
                }
                
                if (detailController && detailController.getPatientExportData) {
                    try {
                        const detailData = await detailController.getPatientExportData(patientItem.id, path, user);
                        
                        patientData = { ...patientData, ...detailData };
                    } catch (error) {
                        console.error('Error getting detail data:', error);
                    }
                }
                exportData.push(patientData);
            }
            // Lấy headers từ tất cả các key unique trong exportData
            const headers = patient.getAllUniqueKeys(exportData);
            return await patient.createExcelFile(res, exportData, headers, path);

        } catch (error) {
            console.log('error exportToExcel', error);
            commonService.saveLog(req, error.message, error.stack);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi xuất dữ liệu!' 
            });
        }
    },

    // Helper function để lấy tất cả các key unique từ array các object
    getAllUniqueKeys: function(exportData) {
        const allKeys = new Set();
        
        // Duyệt qua tất cả các object trong exportData
        exportData.forEach(obj => {
            if (obj && typeof obj === 'object') {
                // Lấy tất cả keys của object hiện tại
                Object.keys(obj).forEach(key => {
                    allKeys.add(key);
                });
            }
        });
        
        // Chuyển Set thành Array và sắp xếp để có thứ tự nhất quán
        return Array.from(allKeys);
    },
    
    // Helper function để tạo file Excel
    createExcelFile: async function(res, exportData, headers, path) {
        try {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Dữ liệu bệnh nhân');

            // Thêm header row (chỉ 1 hàng)
            worksheet.addRow(headers);

            // Style header row
            const headerRowStyle = worksheet.getRow(1);
            headerRowStyle.font = { bold: true, size: 12 };
            headerRowStyle.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD0D0D0' }
            };

            // Thêm dữ liệu
            exportData.forEach(rowData => {
                const row = [];
                
                // Map dữ liệu theo đúng thứ tự headers
                headers.forEach(header => {
                    row.push(rowData[header] || '');
                });
                
                worksheet.addRow(row);
            });

            // Tự động điều chỉnh độ rộng cột dựa trên header
            worksheet.columns.forEach((column, index) => {
                if (column && headers[index]) {
                    const headerLength = headers[index].length;
                    column.width = Math.max(12, Math.min(25, headerLength + 2));
                } else {
                    column.width = 15; // Độ rộng mặc định
                }
            });

            // Tạo tên file
            const timestamp = moment().format('DD-MM-YYYY');
            const fileName = `Du_lieu_benh_nhan_${path}_${timestamp}.xlsx`;

            // Set headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            // Gửi file
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            throw error;
        }
    },

    // Helper function để xóa các key không cần thiết
    deletePatient: function(patientData, path) {
        switch(path) {
            case 'viem-gan-mt1':
                delete patientData.que_quan;
                delete patientData.xeploai_kinhte;
                delete patientData.chuandoan;
                delete patientData.khoa;
                delete patientData.moi_quan_he;
                delete patientData.tien_su_benh;
                delete patientData.cannang;
                delete patientData.chieucao;
                delete patientData.bienban;
                delete patientData.khancap;
                delete patientData.ngayhoichan;
                delete patientData.ngaynhapvien;
                break;
            case 'uon-van':
            case 'viem-gan':
                delete patientData.ngaydieutra;
                delete patientData.ngayhoichan;
                delete patientData.tiensubenh;
                delete patientData.cannang;
                delete patientData.chieucao;
                delete patientData.bienban;
                delete patientData.khancap;
                break;
            case 'standard':
                delete patientData.ngaydieutra;
                delete patientData.ngayhoichan;
                delete patientData.tiensubenh;
                delete patientData.cannang;
                delete patientData.chieucao;
                delete patientData.bienban;
                delete patientData.khancap;
                break;
            default: break;
        }
    }
}

module.exports = patient;
