var moment          = require('moment'),
    commonService   = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');

    let research = {
        getlist: function(req, res){
            try {
                const errors = [];
                const user = req.user;
                if(!user.isAdmin && !user.role_id.includes(7)){
                    errors.push('Bạn không có quyền truy cập danh sách này!');
                }
                return res.render('research/list', {
                    user: user,
                    errors: errors
                });
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                return res.render("error");
            }
        },
        getListTable: function(req, res, next){
            try {
                // Kiểm tra quyền truy cập
                if (!req.user.isAdmin && !req.user.role_id.includes(7)) {
                    return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
                }

                // Cấu hình DataTable
                const config = {
                    table: 'research',
                    columns: ['id', 'name', 'created_at', 'active', 'note'],
                    primaryKey: 'id',
                    active: 0,
                    activeOperator: '!=',
                    filters: {},
                    searchColumns: ['name'],
                    columnsMapping: [
                        'name', // column 0 - name (từ frontend)
                        'note', // column 1 - note (từ frontend)
                        '' // column 2 - actions (từ frontend)
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
                res.json({
                    "data": [],
                    "error": "Có lỗi xảy ra, vui lòng thử lại sau!",
                    "draw": "1",
                    "recordsFiltered": 0,
                    "recordsTotal": 0
                });
            }
        },
        add: function(req, res){
            try {
                 var resultData = {
                    success: false,
                    message: "",
                    data: ''
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền tạo mới!';
                    return res.json(resultData);
                }
                const validateRules = [
                    { field: "name", type: "string", required: true, message: "Vui lòng nhập tên!" }
                ];
                const parameter = {
                    name: req.body.name,
                    note: req.body.note,
                    created_by: req.user.id,
                    campaign_id: req.user.campaign_id
                };
                const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
                if(errors.length > 0){
                    resultData.message = errors.map(s => s.message).join(', ');
                    return res.json(resultData);
                }else{
                    commonService.addRecordTable(parameter, 'research', true).then(responseData =>{
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
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        update: function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: "",
                    data: ''
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền sửa!';
                    return res.json(resultData);
                }
                const validateRules = [
                    { field: "name", type: "string", required: true, message: "Vui lòng nhập tên!" }
                ];
                const parameter = {         
                    name: req.body.name,
                    note: req.body.note
                };
                const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
                if(errors.length > 0){
                    resultData.message = errors.map(s => s.message).join(', ');
                    return res.json(resultData);
                }else{
                    commonService.updateRecordTable(parameter, {id: req.body.id}, 'research').then(responseData =>{
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
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        active: function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: ""
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền xóa!';
                    return res.json(resultData);
                }
                let id = req.body.id;
                let active = req.body.active;
                if(id){
                    commonService.updateRecordTable({active: active}, securityService.applyRoleBasedFiltering(req.user, {id: id}), 'research').then(responseData =>{
                        if(responseData.success){
                            resultData.success = true;
                            resultData.message = 'Thành công!';
                        }else{
                            resultData.message = responseData.message;
                        }
                        return res.json(resultData);
                    })
                }else{
                    resultData.message = 'Thiếu Id!';
                    return res.json(resultData);
                }   
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        detail: function(req, res){
            try {
                const errors = [];
                const user = req.user;
                if(!user.isAdmin && !user.role_id.includes(7)){
                    errors.push('Bạn không có quyền truy cập danh sách này!');
                }
                
                return res.render('research/listPatient', {
                    user: user,
                    errors: errors,
                    id: req.params.id
                });
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                return res.render("error");
            }
        },
        patientList:function(req, res, next){
            try {
                // Kiểm tra quyền truy cập
                if (!req.user.isAdmin && !req.user.role_id.includes(7)) {
                    return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
                }
                // Cấu hình DataTable
                const config = {
                    table: 'patients_research',
                    primaryKey: 'id',
                    active: 0,
                    activeOperator: '!=',
                    filters: securityService.applyRoleBasedFiltering(req.user, {
                        id_research: parseInt(req.body.id) 
                    }),
                    searchColumns: ['fullname', 'phone', 'chuan_doan'],
                    columnsMapping: [
                        'fullname', // column 1
                        'phone', // column 2
                        'chuan_doan', // column 3
                        'khoa' // column 4
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
                res.json({
                    "data": [],
                    "error": "Có lỗi xảy ra, vui lòng thử lại sau!",
                    "draw": "1",
                    "recordsFiltered": 0,
                    "recordsTotal": 0
                });
            }
        },
        patientAdd: async function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: "",
                    data: ''
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền tạo mới!';
                    return res.json(resultData);
                }
                const validateRules = [
                    { field: "fullname", type: "string", required: true, message: "Vui lòng nhập tên!" }
                ];
                const parameter = {
                    fullname: req.body.fullname,
                    phone: req.body.phone,
                    gender: req.body.gender || null,
                    ma_benh_an: req.body.ma_benh_an,
                    birthday: req.body.birthday || null,
                    ngay_nhap_vien: req.body.ngay_nhap_vien || null,
                    phong_dieu_tri: req.body.phong_dieu_tri,
                    chuan_doan: req.body.chuan_doan,
                    dan_toc: req.body.dan_toc,
                    dan_toc_khac: req.body.dan_toc_khac,
                    trinh_do: req.body.trinh_do || null,
                    nghe_nghiep: req.body.nghe_nghiep || null,
                    nghe_nghiep_khac: req.body.nghe_nghiep_khac,
                    noi_o: req.body.noi_o,
                    xep_loai_kt: req.body.xep_loai_kt || null,
                    khoa: req.body.khoa,
                    que_quan: req.body.que_quan,
                    id_research: req.body.id_research,
                    created_by: req.user.id,
                    campaign_id: req.user.campaign_id
                };
                const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
                if(errors.length > 0){
                    resultData.message = errors.map(s => s.message).join(', ');
                    return res.json(resultData);
                }else{
                    if(parameter.phone){
                        await commonService.getListTable("SELECT * FROM patients_research WHERE phone = ? AND active != 0 AND id_research = ? AND campaign_id = ?", [parameter.phone, parameter.id_research, req.user.campaign_id]).then(responseData =>{
                            if(responseData.success && responseData.data && responseData.data.length > 0){
                                resultData.message = `Số điện thoại ${parameter.phone} đã tồn tại!`;
                                return res.json(resultData);
                            }
                        })
                    }
                    
                    if(parameter.birthday) parameter.birthday = parameter.birthday.split("/").reverse().join("/");
                    if(parameter.ngay_nhap_vien) parameter.ngay_nhap_vien = parameter.ngay_nhap_vien.split("/").reverse().join("/");
                    commonService.addRecordTable(parameter, 'patients_research', true).then(responseData =>{
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
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        patientUpdate: async function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: "",
                    data: ''
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền sửa!';
                    return res.json(resultData);
                }
                const validateRules = [
                    { field: "fullname", type: "string", required: true, message: "Vui lòng nhập tên!" }
                ];
                const parameter = {
                    fullname: req.body.fullname,
                    phone: req.body.phone,
                    gender: req.body.gender || null,
                    ma_benh_an: req.body.ma_benh_an,
                    birthday: req.body.birthday || null,
                    ngay_nhap_vien: req.body.ngay_nhap_vien || null,
                    phong_dieu_tri: req.body.phong_dieu_tri,
                    chuan_doan: req.body.chuan_doan,
                    dan_toc: req.body.dan_toc,
                    dan_toc_khac: req.body.dan_toc_khac,
                    trinh_do: req.body.trinh_do || null,
                    nghe_nghiep: req.body.nghe_nghiep || null,
                    nghe_nghiep_khac: req.body.nghe_nghiep_khac,
                    noi_o: req.body.noi_o,
                    xep_loai_kt: req.body.xep_loai_kt || null,
                    khoa: req.body.khoa,
                    que_quan: req.body.que_quan,
                    id_research: req.body.id_research
                };
                const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
                if(errors.length > 0){
                    resultData.message = errors.map(s => s.message).join(', ');
                    return res.json(resultData);
                }else{
                    if(parameter.phone){
                        await commonService.getListTable("SELECT * FROM patients_research WHERE phone = ? AND active != 0 AND id != ? AND campaign_id = ?", [parameter.phone, req.body.id, req.user.campaign_id]).then(responseData =>{
                            if(responseData.success && responseData.data && responseData.data.length > 0){
                                resultData.message = `Số điện thoại ${parameter.phone} đã tồn tại!`;
                                return res.json(resultData);
                            }
                        })
                    }
                    
                    if(parameter.birthday) parameter.birthday = parameter.birthday.split("/").reverse().join("/");
                    if(parameter.ngay_nhap_vien) parameter.ngay_nhap_vien = parameter.ngay_nhap_vien.split("/").reverse().join("/");
                    commonService.updateRecordTable(parameter, {id: req.body.id}, 'patients_research').then(responseData =>{
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
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        patientActive: function(req, res){
            try {
                var resultData = {
                    success: false,
                    message: ""
                };
                if(!req.user.isAdmin && !req.user.role_id.includes(7)){
                    resultData.message = 'Bạn không có quyền xóa!';
                    return res.json(resultData);
                }
                let id = req.body.id;
                let active = req.body.active;
                if(id){
                    commonService.updateRecordTable({active: active}, securityService.applyRoleBasedFiltering(req.user, {id: id}), 'patients_research').then(responseData =>{
                        if(responseData.success){
                            resultData.success = true;
                            resultData.message = 'Thành công!';
                        }else{
                            resultData.message = responseData.message;
                        }
                        return res.json(resultData);
                    })
                }else{
                    resultData.message = 'Thiếu Id!';
                    return res.json(resultData);
                }   
            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        },
        exportExcel: async function(req, res){
            try {
                if (!req.user.isAdmin && !req.user.role_id.includes(7)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xuất Excel!'
                    });
                }

                const researchId = req.params.research_id;
                if (!researchId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Thiếu ID nghiên cứu!'
                    });
                }

                // Lấy danh sách trường được chọn từ POST request
                let selectedFields = [];
                if (req.body.selectedFields) {
                    try {
                        selectedFields = JSON.parse(req.body.selectedFields);
                    } catch (error) {
                        selectedFields = [];
                    }
                }

                // Nếu không có trường nào được chọn, sử dụng mặc định
                if (selectedFields.length === 0) {
                    selectedFields = ['fullname', 'menu_name', 'energy', 'protein', 'fat', 'carbohydrate', 'fiber', 'calci', 'fe', 'zinc', 'vitamin_c'];
                }

                const ExcelJS = require('exceljs');
                const path = require('path');
                const fs = require('fs');

                // Lấy thông tin nghiên cứu
                const researchData = await commonService.getAllDataTable('research', securityService.applyRoleBasedFiltering(req.user, {id: researchId, active: 1}));
                if (!researchData.success || !researchData.data || researchData.data.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy nghiên cứu!'
                    });
                }
                
                const researchName = researchData.data[0].name;

                // Lấy dữ liệu bệnh nhân từ bảng patients_research
                const query = `
                    SELECT 
                        pr.id as patient_id,
                        pr.fullname,
                        pr.created_at as patient_created_at,
                        pr.menu_example
                    FROM patients_research pr 
                    WHERE pr.active = 1 
                      AND pr.id_research = ?
                      AND pr.menu_example IS NOT NULL 
                      AND pr.menu_example != ''
                    ORDER BY pr.id DESC
                `;
                
                const patientsData = await commonService.getListTable(query, [researchId]);
                
                // Kiểm tra kết quả query
                if (!patientsData.success) {
                    throw new Error('Không thể lấy dữ liệu bệnh nhân: ' + patientsData.message);
                }
                
                const patients = patientsData.data || [];
                
                // Tạo workbook và worksheet
                const workbook = new ExcelJS.Workbook();
                let worksheet;
                
                // Tạo worksheet mới thay vì sử dụng template để tránh lỗi shared formula
                worksheet = workbook.addWorksheet('Nghiên cứu');
                
                // Tạo headers dùng trực tiếp tên trường dữ liệu
                const headers = selectedFields;
                
                // Thiết lập header
                headers.forEach((header, index) => {
                    const cell = worksheet.getCell(1, index + 1);
                    cell.value = header;
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE6E6FA' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                
                // Auto-fit columns
                worksheet.columns.forEach(column => {
                    column.width = 15;
                });
                
                // Đặt width cho cột tên bệnh nhân và tên thực đơn
                if (selectedFields.includes('fullname')) {
                    const fullnameIndex = selectedFields.indexOf('fullname');
                    worksheet.getColumn(fullnameIndex + 1).width = 25;
                }
                if (selectedFields.includes('menu_name')) {
                    const menuNameIndex = selectedFields.indexOf('menu_name');
                    worksheet.getColumn(menuNameIndex + 1).width = 20;
                }
                
                // Xử lý dữ liệu và sắp xếp theo yêu cầu
                let processedData = [];
                
                // Xử lý từng bệnh nhân
                for (let patient of patients) {
                    try {
                        if (!patient.menu_example) continue;
                        
                        // Parse menu_example JSON
                        const menuData = JSON.parse(patient.menu_example);
                        
                        // Nếu menuData là mảng các thực đơn
                        if (Array.isArray(menuData)) {
                            // Sắp xếp thực đơn theo ngày tạo
                            menuData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                            
                            // Xử lý từng thực đơn
                            menuData.forEach((menu, index) => {
                                const nutritionData = calculateNutritionFromMenu(menu);
                                
                                processedData.push({
                                    fullname: `${patient.fullname} ${index + 1}`,
                                    patient_id: patient.patient_id,
                                    menu_name: menu.name || `Thực đơn ${index + 1}`,
                                    created_at: menu.created_at || patient.patient_created_at,
                                    nutrition: nutritionData
                                });
                            });
                        } else {
                            // Nếu chỉ có 1 thực đơn (không phải mảng)
                            const nutritionData = calculateNutritionFromMenu(menuData);
                            
                            processedData.push({
                                fullname: `${patient.fullname} 1`,
                                patient_id: patient.patient_id,
                                menu_name: menuData.name || 'Thực đơn',
                                created_at: menuData.created_at || patient.patient_created_at,
                                nutrition: nutritionData
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing menu for patient:', patient.fullname, error);
                    }
                }

                // Sắp xếp theo pattern: A1, B1, C1, A2, B2, C2...
                let patientGroups = {};
                processedData.forEach(item => {
                    const baseName = item.fullname.replace(/ \d+$/, ''); // Lấy tên gốc (bỏ số cuối)
                    const index = parseInt(item.fullname.match(/ (\d+)$/)[1]); // Lấy số index
                    
                    if (!patientGroups[baseName]) {
                        patientGroups[baseName] = [];
                    }
                    patientGroups[baseName].push({ ...item, index });
                });

                // Sắp xếp lại theo pattern yêu cầu
                let sortedData = [];
                const maxIndex = Math.max(...Object.values(patientGroups).map(arr => arr.length));
                
                for (let i = 1; i <= maxIndex; i++) {
                    Object.keys(patientGroups).forEach(patientName => {
                        const item = patientGroups[patientName].find(p => p.index === i);
                        if (item) {
                            sortedData.push(item);
                        }
                    });
                }

                // Hàm tính toán dinh dưỡng từ menu
                function calculateNutritionFromMenu(menu) {
                    const totalNutrition = {
                        // Năng lượng và chất dinh dưỡng chính
                        energy: 0, protein: 0, animal_protein: 0, fat: 0, unanimal_lipid: 0, carbohydrate: 0,
                        fiber: 0, water: 0, ash: 0, animal_lipid: 0,

                        // Chất béo chi tiết
                        total_saturated_fat: 0, mufa: 0, linoleic: 0, linolenic: 0, arachidonic: 0,
                        trans_fatty_acids: 0, cholesterol: 0, oleic: 0, palmitic: 0, stearic: 0,

                        // Khoáng chất
                        calci: 0, phosphorous: 0, fe: 0, zinc: 0, sodium: 0, potassium: 0, magnesium: 0,
                        manganese: 0, copper: 0, selenium: 0,

                        // Vitamin
                        vitamin_a_rae: 0, vitamin_b6: 0, vitamin_b12: 0,
                        vitamin_c: 0, vitamin_e: 0, vitamin_k: 0, niacin: 0, thiamine: 0, riboflavin: 0,
                        pantothenic_acid: 0, biotin: 0, vitamin_d: 0, vitamin_d_iu: 0, vitamin_a_ui: 0,

                        // Amino acid
                        lysin: 0, methionin: 0, tryptophan: 0, phenylalanin: 0, threonin: 0, isoleucine: 0,
                        leucine: 0, valine: 0, arginine: 0, histidine: 0,

                        // Đường và các chất khác
                        total_sugar: 0, glucose: 0, fructose: 0, sucrose: 0, lactose: 0, maltose: 0, galactose: 0,
                        purine: 0, phytosterol: 0, lycopene: 0, b_carotene: 0, a_carotene: 0, b_cryptoxanthin: 0,
                        lutein_zeaxanthin: 0, total_isoflavone: 0, daidzein: 0, genistein: 0, glycetin: 0,

                        // Các trường bổ sung
                        alanine: 0, aspartic_acid: 0, glutamic_acid: 0, glycine: 0, proline: 0,
                        serine: 0, unanimal_protein: 0, cystine: 0, tyrosine: 0, lignoceric: 0, folic_acid: 0,
                        caroten: 0, edible: 0, fluoride: 0, iodine: 0,
                        margaric: 0, arachidic: 0, behenic: 0, myristoleic: 0, palmitoleic: 0, pufa: 0, dha: 0, epa: 0
                    };

                    // Duyệt qua tất cả detail (bữa ăn)
                    if (menu.detail && Array.isArray(menu.detail)) {
                        menu.detail.forEach(meal => {
                            // Duyệt qua tất cả listFood trong bữa ăn
                            if (meal.listFood && Array.isArray(meal.listFood)) {
                                meal.listFood.forEach(food => {
                                    // Tính tổng các giá trị dinh dưỡng - cộng dồn trực tiếp không theo tỉ lệ weight/100
                                    Object.keys(totalNutrition).forEach(key => {
                                        if (food.hasOwnProperty(key)) {
                                            totalNutrition[key] += (parseFloat(food[key]) || 0);
                                        }
                                    });
                                });
                            }
                        });
                    }

                    return totalNutrition;
                }
                
                // Ghi dữ liệu vào Excel (bắt đầu từ dòng 2)
                let currentRow = 2;
                for (let data of sortedData) {
                    // Tạo array dữ liệu theo thứ tự selectedFields
                    const cellValues = selectedFields.map(field => {
                        if (field === 'fullname') return data.fullname;
                        if (field === 'menu_name') return data.menu_name || 'Thực đơn';
                        
                        // Các trường dinh dưỡng
                        const value = data.nutrition[field] || 0;
                        return Math.round(value * 100) / 100; // Làm tròn 2 chữ số thập phân
                    });
                    
                    // Ghi từng cell và thêm border
                    cellValues.forEach((cellValue, index) => {
                        const cell = worksheet.getCell(currentRow, index + 1);
                        cell.value = cellValue;
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        
                        // Căn giữa cho số (trừ tên bệnh nhân và tên thực đơn)
                        const field = selectedFields[index];
                        if (field !== 'fullname' && field !== 'menu_name') {
                            cell.alignment = { horizontal: 'center' };
                            cell.numFmt = '0.00';
                        }
                    });
                    
                    currentRow++;
                }
                
                // Set headers cho download - sử dụng encodeURIComponent để tránh lỗi invalid character
                const sanitizedResearchName = researchName.replace(/[^a-zA-Z0-9_\-]/g, '_');
                const fileName = `nghien_cuu_${sanitizedResearchName}_${new Date().getTime()}.xlsx`;

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

                // Ghi workbook ra response
                await workbook.xlsx.write(res);
                res.end();

            } catch (error) {
                commonService.saveLog(req, error.message, error.stack);
                res.json(securityService.createErrorResponse(error.message || 'Đã có lỗi trong quá trình xử lý', error, 500))
            }
        }
    }

module.exports = research;