var commonService = require('../services/commonService');
const securityService = require('../services/securityService');

let importFood = {
    importFood: async function (req, res) {
        const result = { success: false, message: '', data: null };
        const user = req.user;
        if (!user || (!user.isAdmin && !user.role_id.includes(6))) {
            result.message = 'Bạn không có quyền thực hiện chức năng này!';
            return res.json(result);
        }
        const { rows, type_year, type } = req.body;
        if (!Array.isArray(rows)) {
            result.message = 'Dữ liệu không hợp lệ hoặc thiếu dữ liệu!';
            return res.json(result);
        }
        const existingFoods = await commonService.getAllDataTable('food_info', { 
            type: type, 
            type_year: String(type_year),
            active: 1
        });
        if (!existingFoods.success) {
            result.message = 'Lỗi khi kiểm tra dữ liệu trùng lặp!';
            return res.json(result);
        }
        const existingNames = existingFoods.data.map(food => food.name);
        const uniqueRecords = rows.filter(record => !existingNames.includes(record.name));
        if (uniqueRecords.length === 0) {
            result.message = 'Không có bản ghi mới để thêm (tất cả đều bị trùng)!';
            return res.json(result);
        }
        const insertResult = await commonService.addMutilRecordTable(uniqueRecords, 'food_info', true);
        if (!insertResult.success) {
            result.message = 'Lỗi khi lưu dữ liệu: ' + insertResult.message;
            return res.json(result);
        }
        result.success = true;
        result.message = `Đã import thành công ${uniqueRecords.length} thực phẩm!`;
        result.data = insertResult.data;
        return res.json(result);
    },
    updateFood: async function (req, res) {
        const result = { success: false, message: '', data: null };
        const user = req.user;
        if (!user || (!user.isAdmin && !user.role_id.includes(6))) {
            result.message = 'Bạn không có quyền thực hiện chức năng này!';
            return res.json(result);
        }
        const { rows, type_year, type } = req.body;
        if (!Array.isArray(rows)) {
            result.message = 'Dữ liệu không hợp lệ hoặc thiếu dữ liệu!';
            return res.json(result);
        }
        let updatedCount = 0;
        let duplicates = [];
        console.log('rows', rows.map(s=>{return {code:s.code,edible: s.edible, water:s.water}}))
        for (const record of rows) {
            const { code, edible, water } = record;
            console.log('record', code, edible, water);
            // return res.json(result);
            if (code) {
                const existingRecords = await commonService.getAllDataTable('food_info', {
                    type_year: type_year,
                    type: type,
                    code: code
                });

                if (existingRecords.success && existingRecords.data.length === 1) {
                    const updateResult = await commonService.updateRecordTable({edible: edible, water: water}, {
                        id: existingRecords.data[0].id
                    }, 'food_info');
                    if (updateResult.success && updateResult.data > 0) {
                        updatedCount++;
                    }
                } else if (existingRecords.success && existingRecords.data.length > 1) {
                    duplicates.push(record);
                }
            }
        }

        let message = '';
        if (updatedCount > 0) {
            message += `Đã cập nhật thành công ${updatedCount} thực phẩm. `;
        }
        if (duplicates.length > 0) {
            message += `Phát hiện ${duplicates.length} bản ghi bị trùng lặp và không được cập nhật.`;
            result.data = duplicates;
        }

        if (updatedCount === 0 && duplicates.length === 0) {
            result.message = 'Không có thực phẩm nào được cập nhật hoặc tìm thấy.';
            return res.json(result);
        }

        result.success = true;
        result.message = message;
        return res.json(result);
    }
};
module.exports = importFood;
