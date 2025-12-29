const commonService = require('./commonService');

const foodService = {
    // Lấy danh sách thực phẩm cho dropdown với filter và search
    getFoodForSelect: async (type = null, type_year = null, search = null) => {
        try {
            let whereClause = '';
            let params = [];
            let conditions = [];
            
            // Filter theo type
            if (type) {
                conditions.push('fi.type = ?');
                params.push(type);
            }
            
            // Filter theo type_year
            if (type_year) {
                conditions.push('fi.type_year = ?');
                params.push(type_year);
            }
            
            // Search theo tên thực phẩm
            if (search && search.trim().length > 0) {
                conditions.push('(fi.name LIKE ? OR fi.ten LIKE ? OR fi.code LIKE ?)');
                const searchTerm = `%${search.trim()}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
            
            const sql = `
                SELECT
                    -- Tất cả các trường từ food_info (đã bao gồm cả thông tin dinh dưỡng)
                    fi.*
                FROM food_info fi
                ${whereClause}
                ORDER BY fi.name ASC
                LIMIT 100
            `;
            
            const result = await commonService.getListTable(sql, params);
            
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data.map(food => ({
                        value: food.id,
                        label: `${food.name}${food.ten ? ' - ' + food.ten : ''} (${foodService.generateTextTypeFood(food.type)} - ${food.type_year})`,
                        customData: food // Dữ liệu đã được gộp vào food_info, không cần mapping lại
                    }))
                };
            } else {
                return {
                    success: false,
                    message: 'Không thể lấy danh sách thực phẩm',
                    data: []
                };
            }
        } catch (error) {
            console.error('Error in getFoodForSelect:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi lấy danh sách thực phẩm',
                data: []
            };
        }
    },
    
    // Lấy thông tin chi tiết thực phẩm
    getFoodDetail: async (id) => {
        try {
            const sql = `
                SELECT fi.*
                FROM food_info fi
                WHERE fi.id = ?
            `;

            const result = await commonService.getListTable(sql, [id]);

            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    data: result.data[0]
                };
            } else {
                return {
                    success: false,
                    message: 'Không tìm thấy thực phẩm',
                    data: null
                };
            }
        } catch (error) {
            console.error('Error in getFoodDetail:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin thực phẩm',
                data: null
            };
        }
    },

    generateTextTypeFood: (type) => {
        switch(type) {
            case 'raw':
                return 'Sống';
            case 'cooked':
                return 'Chín ĐP';
            case 'cooked_vdd':
                return 'Chín VDD';
            case 'milk':
                return 'Sữa';
            case 'ddd':
                return 'Dịch DD';
            case 'cake':
                return 'Bánh/kẹo/đồ uống';
            default:
                return '';
        }
    }
};

module.exports = foodService; 