const commonService = require('./commonService');

const inventoryService = {
    /**
     * Lấy danh sách kho theo campaign
     */
    getWarehousesByCampaign: async (campaignId) => {
        try {
            const sql = `
                SELECT w.*, u.fullname as created_by_name
                FROM inventory_warehouses w
                LEFT JOIN user u ON w.created_by = u.id
                WHERE w.campaign_id = ? AND w.active = 1
                ORDER BY w.id DESC
            `;
            return await commonService.getListTable(sql, [campaignId]);
        } catch (error) {
            console.error('Error in getWarehousesByCampaign:', error);
            return { success: false, message: error.message, data: [] };
        }
    },

    /**
     * Lấy tồn kho theo kho và thực phẩm
     */
    getStockByWarehouse: async (warehouseId, foodId = null) => {
        try {
            let sql = `
                SELECT 
                    s.*,
                    f.name as food_name,
                    f.code as food_code,
                    f.edible,
                    DATEDIFF(s.expiry_date, CURDATE()) as days_to_expiry,
                    CASE 
                        WHEN s.expiry_date < CURDATE() THEN 'expired'
                        WHEN DATEDIFF(s.expiry_date, CURDATE()) <= 7 THEN 'warning'
                        ELSE 'ok'
                    END as expiry_status
                FROM inventory_stock s
                INNER JOIN food_info f ON s.food_id = f.id
                WHERE s.warehouse_id = ? AND s.quantity_available > 0
            `;
            const params = [warehouseId];
            
            if (foodId) {
                sql += ` AND s.food_id = ?`;
                params.push(foodId);
            }
            
            sql += ` ORDER BY s.expiry_date ASC, s.receipt_date ASC`;
            
            return await commonService.getListTable(sql, params);
        } catch (error) {
            console.error('Error in getStockByWarehouse:', error);
            return { success: false, message: error.message, data: [] };
        }
    },

    /**
     * Lấy tổng hợp tồn kho theo thực phẩm
     */
    getStockSummary: async (warehouseId) => {
        try {
            const sql = `
                SELECT 
                    s.food_id,
                    f.name as food_name,
                    f.code as food_code,
                    f.edible,
                    f.price,
                    SUM(s.quantity_available) as total_quantity,
                    s.unit,
                    AVG(s.unit_price) as avg_unit_price,
                    SUM(s.quantity_available * s.unit_price) as total_value,
                    MIN(s.expiry_date) as nearest_expiry,
                    COUNT(DISTINCT s.batch_code) as batch_count,
                    CASE 
                        WHEN MIN(s.expiry_date) < CURDATE() THEN 'expired'
                        WHEN DATEDIFF(MIN(s.expiry_date), CURDATE()) <= 7 THEN 'warning'
                        ELSE 'ok'
                    END as expiry_status
                FROM inventory_stock s
                INNER JOIN food_info f ON s.food_id = f.id
                WHERE s.warehouse_id = ? AND s.quantity_available > 0
                GROUP BY s.food_id, f.name, f.code, f.edible, f.price, s.unit
                ORDER BY f.name ASC
            `;
            return await commonService.getListTable(sql, [warehouseId]);
        } catch (error) {
            console.error('Error in getStockSummary:', error);
            return { success: false, message: error.message, data: [] };
        }
    },

    /**
     * Tạo mã phiếu nhập tự động
     */
    generateReceiptCode: async () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const sql = `SELECT COUNT(*) as count FROM inventory_receipts WHERE receipt_code LIKE 'PN${dateStr}%'`;
        const result = await commonService.getListTable(sql, []);
        const count = result.success && result.data.length > 0 ? result.data[0].count : 0;
        return `PN${dateStr}${String(count + 1).padStart(3, '0')}`;
    },

    /**
     * Tạo mã phiếu xuất tự động
     */
    generateIssueCode: async () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const sql = `SELECT COUNT(*) as count FROM inventory_issues WHERE issue_code LIKE 'PX${dateStr}%'`;
        const result = await commonService.getListTable(sql, []);
        const count = result.success && result.data.length > 0 ? result.data[0].count : 0;
        return `PX${dateStr}${String(count + 1).padStart(3, '0')}`;
    },

    /**
     * Tạo phiếu nhập kho
     */
    createReceipt: async (receiptData, items, userId) => {
        try {
            // Tạo phiếu nhập
            const receiptParams = {
                warehouse_id: receiptData.warehouse_id,
                receipt_code: receiptData.receipt_code || await inventoryService.generateReceiptCode(),
                receipt_date: receiptData.receipt_date,
                supplier: receiptData.supplier || null,
                total_amount: receiptData.total_amount || 0,
                note: receiptData.note || null,
                status: receiptData.status || 'confirmed',
                created_by: userId
            };

            const receiptResult = await commonService.addRecordTable(receiptParams, 'inventory_receipts', true);
            
            if (!receiptResult.success) {
                throw new Error('Không thể tạo phiếu nhập kho');
            }

            const receiptId = receiptResult.data.insertId;

            // Thêm chi tiết phiếu nhập
            for (const item of items) {
                const itemParams = {
                    receipt_id: receiptId,
                    food_id: item.food_id,
                    quantity: item.quantity,
                    unit: item.unit || 'kg',
                    unit_price: item.unit_price || 0,
                    total_price: (item.quantity || 0) * (item.unit_price || 0),
                    expiry_date: item.expiry_date || null,
                    batch_code: item.batch_code || null,
                    note: item.note || null
                };

                await commonService.addRecordTable(itemParams, 'inventory_receipt_items', false);
            }

            return { success: true, data: { id: receiptId }, message: 'Tạo phiếu nhập kho thành công' };
        } catch (error) {
            console.error('Error in createReceipt:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Tạo phiếu xuất kho
     */
    createIssue: async (issueData, items, userId) => {
        try {
            // Tạo phiếu xuất
            const issueParams = {
                warehouse_id: issueData.warehouse_id,
                issue_code: issueData.issue_code || await inventoryService.generateIssueCode(),
                issue_date: issueData.issue_date,
                issue_type: issueData.issue_type || 'manual',
                menu_build_id: issueData.menu_build_id || null,
                menu_week: issueData.menu_week || null,
                menu_day: issueData.menu_day || null,
                receiver: issueData.receiver || null,
                note: issueData.note || null,
                status: issueData.status || 'confirmed',
                created_by: userId
            };

            const issueResult = await commonService.addRecordTable(issueParams, 'inventory_issues', true);
            
            if (!issueResult.success) {
                throw new Error('Không thể tạo phiếu xuất kho');
            }

            const issueId = issueResult.data.insertId;

            // Thêm chi tiết phiếu xuất (trigger sẽ tự động cập nhật stock theo FIFO)
            for (const item of items) {
                const itemParams = {
                    issue_id: issueId,
                    food_id: item.food_id,
                    quantity: item.quantity,
                    unit: item.unit || 'kg',
                    note: item.note || null
                };

                await commonService.addRecordTable(itemParams, 'inventory_issue_items', false);
            }

            return { success: true, data: { id: issueId }, message: 'Tạo phiếu xuất kho thành công' };
        } catch (error) {
            console.error('Error in createIssue:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Kiểm tra tồn kho có đủ không
     */
    checkStockAvailability: async (warehouseId, foodId, requiredQuantity) => {
        try {
            const sql = `
                SELECT SUM(quantity_available) as total_available
                FROM inventory_stock
                WHERE warehouse_id = ? AND food_id = ? AND quantity_available > 0
            `;
            const result = await commonService.getListTable(sql, [warehouseId, foodId]);
            
            if (result.success && result.data.length > 0) {
                const available = result.data[0].total_available || 0;
                return {
                    success: true,
                    available: available,
                    sufficient: available >= requiredQuantity
                };
            }
            
            return { success: false, available: 0, sufficient: false };
        } catch (error) {
            console.error('Error in checkStockAvailability:', error);
            return { success: false, available: 0, sufficient: false };
        }
    },

    /**
     * Lấy danh sách thực phẩm sắp hết hạn
     */
    getExpiringItems: async (warehouseId, daysThreshold = 7) => {
        try {
            const sql = `
                SELECT
                    s.*,
                    f.name as food_name,
                    f.code as food_code,
                    DATEDIFF(s.expiry_date, CURDATE()) as days_to_expiry
                FROM inventory_stock s
                INNER JOIN food_info f ON s.food_id = f.id
                WHERE s.warehouse_id = ?
                AND s.quantity_available > 0
                AND s.expiry_date IS NOT NULL
                AND DATEDIFF(s.expiry_date, CURDATE()) <= ?
                ORDER BY s.expiry_date ASC
            `;
            return await commonService.getListTable(sql, [warehouseId, daysThreshold]);
        } catch (error) {
            console.error('Error in getExpiringItems:', error);
            return { success: false, message: error.message, data: [] };
        }
    },

    /**
     * Tính chi phí dựa trên giá nhập kho FIFO
     * @param {number} warehouseId - ID kho
     * @param {number} foodId - ID thực phẩm
     * @param {number} quantity - Số lượng cần tính (kg)
     * @returns {object} { success, total_cost, avg_price, details }
     */
    calculateCostByFIFO: async (warehouseId, foodId, quantity) => {
        try {
            // Lấy stock theo FIFO
            const sql = `
                SELECT
                    id,
                    quantity_available,
                    unit_price,
                    receipt_date,
                    batch_code
                FROM inventory_stock
                WHERE warehouse_id = ?
                AND food_id = ?
                AND quantity_available > 0
                ORDER BY receipt_date ASC, id ASC
            `;

            const result = await commonService.getListTable(sql, [warehouseId, foodId]);

            if (!result.success || result.data.length === 0) {
                // Không có tồn kho, dùng giá tham khảo từ food_info
                const foodResult = await commonService.getAllDataTable('food_info', { id: foodId });
                const referencePrice = foodResult.success && foodResult.data.length > 0
                    ? parseFloat(foodResult.data[0].price || 0)
                    : 0;

                return {
                    success: true,
                    total_cost: quantity * referencePrice,
                    avg_price: referencePrice,
                    details: [],
                    is_reference: true,
                    message: 'Sử dụng giá tham khảo (chưa có nhập kho)'
                };
            }

            let remaining = quantity;
            let totalCost = 0;
            const details = [];

            for (const stock of result.data) {
                if (remaining <= 0) break;

                const available = parseFloat(stock.quantity_available);
                const unitPrice = parseFloat(stock.unit_price || 0);
                const toDeduct = Math.min(available, remaining);

                totalCost += toDeduct * unitPrice;
                details.push({
                    batch_code: stock.batch_code,
                    receipt_date: stock.receipt_date,
                    quantity: toDeduct,
                    unit_price: unitPrice,
                    subtotal: toDeduct * unitPrice
                });

                remaining -= toDeduct;
            }

            // Nếu còn thiếu, dùng giá trung bình của lô cuối
            if (remaining > 0 && details.length > 0) {
                const lastPrice = details[details.length - 1].unit_price;
                totalCost += remaining * lastPrice;
                details.push({
                    batch_code: 'Dự kiến',
                    receipt_date: null,
                    quantity: remaining,
                    unit_price: lastPrice,
                    subtotal: remaining * lastPrice
                });
            }

            const avgPrice = quantity > 0 ? totalCost / quantity : 0;

            return {
                success: true,
                total_cost: Math.round(totalCost),
                avg_price: Math.round(avgPrice),
                details: details,
                is_reference: false
            };

        } catch (error) {
            console.error('Error in calculateCostByFIFO:', error);
            return {
                success: false,
                total_cost: 0,
                avg_price: 0,
                details: [],
                message: error.message
            };
        }
    },

    /**
     * Tính chi phí cho danh sách nguyên liệu
     * @param {number} warehouseId - ID kho
     * @param {array} ingredients - Danh sách nguyên liệu [{ food_id, quantity_kg }]
     * @returns {object} { success, total_cost, items }
     */
    calculateMenuCost: async (warehouseId, ingredients) => {
        try {
            const items = [];
            let totalCost = 0;

            for (const ingredient of ingredients) {
                const costResult = await inventoryService.calculateCostByFIFO(
                    warehouseId,
                    ingredient.food_id,
                    ingredient.quantity_kg
                );

                items.push({
                    food_id: ingredient.food_id,
                    food_name: ingredient.food_name,
                    quantity: ingredient.quantity_kg,
                    total_cost: costResult.total_cost,
                    avg_price: costResult.avg_price,
                    is_reference: costResult.is_reference,
                    details: costResult.details
                });

                totalCost += costResult.total_cost;
            }

            return {
                success: true,
                total_cost: Math.round(totalCost),
                items: items
            };

        } catch (error) {
            console.error('Error in calculateMenuCost:', error);
            return {
                success: false,
                total_cost: 0,
                items: [],
                message: error.message
            };
        }
    }
};

module.exports = inventoryService;

