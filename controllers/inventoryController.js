const commonService = require('../services/commonService');
const inventoryService = require('../services/inventoryService');
const securityService = require('../services/securityService');

const inventoryController = {
    /**
     * Danh sách kho
     */
    warehouseList: async (req, res) => {
        try {
            const user = req.user;
            const errors = [];

            if (!user.campaign_id) {
                errors.push('Bạn chưa được gán vào campaign nào!');
            }

            const result = await inventoryService.getWarehousesByCampaign(user.campaign_id);

            res.render('inventory/warehouse-list', {
                user: user,
                errors: errors,
                warehouses: result.success ? result.data : []
            });
        } catch (error) {
            console.error('Error in warehouseList:', error);
            res.render('inventory/warehouse-list', {
                user: req.user,
                errors: [error.message],
                warehouses: []
            });
        }
    },

    /**
     * Tạo/sửa kho
     */
    warehouseUpsert: async (req, res) => {
        try {
            const user = req.user;
            const isCreate = !req.body.id;

            const params = {
                name: req.body.name,
                campaign_id: user.campaign_id,
                location: req.body.location || null,
                description: req.body.description || null,
                active: req.body.active ? parseInt(req.body.active) : 1
            };

            if (isCreate) {
                params.created_by = user.id;
                const result = await commonService.addRecordTable(params, 'inventory_warehouses', true);
                res.json(result);
            } else {
                const result = await commonService.updateRecordTable(params, { id: req.body.id }, 'inventory_warehouses');
                res.json(result);
            }
        } catch (error) {
            console.error('Error in warehouseUpsert:', error);
            res.json({ success: false, message: error.message });
        }
    },

    /**
     * Tồn kho - Tổng hợp
     */
    stockSummary: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            // Lấy tổng hợp tồn kho
            const stockResult = await inventoryService.getStockSummary(warehouseId);

            // Lấy danh sách sắp hết hạn
            const expiringResult = await inventoryService.getExpiringItems(warehouseId, 7);

            res.render('inventory/stock-summary', {
                user: user,
                errors: errors,
                warehouse: warehouse,
                stockList: stockResult.success ? stockResult.data : [],
                expiringList: expiringResult.success ? expiringResult.data : []
            });
        } catch (error) {
            console.error('Error in stockSummary:', error);
            res.render('inventory/stock-summary', {
                user: req.user,
                errors: [error.message],
                warehouse: null,
                stockList: [],
                expiringList: []
            });
        }
    },

    /**
     * Tồn kho - Chi tiết theo lô
     */
    stockDetail: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const foodId = req.query.foodId || null;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            // Lấy chi tiết tồn kho theo lô
            const stockResult = await inventoryService.getStockByWarehouse(warehouseId, foodId);

            res.render('inventory/stock-detail', {
                user: user,
                errors: errors,
                warehouse: warehouse,
                stockList: stockResult.success ? stockResult.data : [],
                selectedFoodId: foodId
            });
        } catch (error) {
            console.error('Error in stockDetail:', error);
            res.render('inventory/stock-detail', {
                user: req.user,
                errors: [error.message],
                warehouse: null,
                stockList: [],
                selectedFoodId: null
            });
        }
    },

    /**
     * Tạo phiếu nhập kho - Form
     */
    receiptCreate: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            // Tạo mã phiếu nhập
            const receiptCode = await inventoryService.generateReceiptCode();

            res.render('inventory/receipt-create', {
                user: user,
                errors: errors,
                warehouse: warehouse,
                receiptCode: receiptCode
            });
        } catch (error) {
            console.error('Error in receiptCreate:', error);
            res.render('inventory/receipt-create', {
                user: req.user,
                errors: [error.message],
                warehouse: null,
                receiptCode: ''
            });
        }
    },

    /**
     * Lưu phiếu nhập kho
     */
    receiptSave: async (req, res) => {
        try {
            const user = req.user;
            const { warehouse_id, receipt_code, receipt_date, supplier, note, items } = req.body;

            if (!warehouse_id || !receipt_date || !items || items.length === 0) {
                return res.json({ success: false, message: 'Thiếu thông tin bắt buộc' });
            }

            // Tính tổng tiền
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

            const receiptData = {
                warehouse_id,
                receipt_code,
                receipt_date,
                supplier,
                note,
                total_amount: totalAmount,
                status: 'confirmed'
            };

            const result = await inventoryService.createReceipt(receiptData, items, user.id);
            res.json(result);
        } catch (error) {
            console.error('Error in receiptSave:', error);
            res.json({ success: false, message: error.message });
        }
    },

    /**
     * Tạo phiếu xuất kho - Form
     */
    issueCreate: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            // Tạo mã phiếu xuất
            const issueCode = await inventoryService.generateIssueCode();

            res.render('inventory/issue-create', {
                user: user,
                errors: errors,
                warehouse: warehouse,
                issueCode: issueCode
            });
        } catch (error) {
            console.error('Error in issueCreate:', error);
            res.render('inventory/issue-create', {
                user: req.user,
                errors: [error.message],
                warehouse: null,
                issueCode: ''
            });
        }
    },

    /**
     * Lưu phiếu xuất kho
     */
    issueSave: async (req, res) => {
        try {
            const user = req.user;
            const { warehouse_id, issue_code, issue_date, issue_type, receiver, note, items } = req.body;

            if (!warehouse_id || !issue_date || !items || items.length === 0) {
                return res.json({ success: false, message: 'Thiếu thông tin bắt buộc' });
            }

            const issueData = {
                warehouse_id,
                issue_code,
                issue_date,
                issue_type: issue_type || 'manual',
                receiver,
                note,
                status: 'confirmed'
            };

            const result = await inventoryService.createIssue(issueData, items, user.id);
            res.json(result);
        } catch (error) {
            console.error('Error in issueSave:', error);
            res.json({ success: false, message: error.message });
        }
    },

    /**
     * Danh sách phiếu nhập kho
     */
    receiptList: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            res.render('inventory/receipt-list', {
                user: user,
                errors: errors,
                warehouse: warehouse
            });
        } catch (error) {
            console.error('Error in receiptList:', error);
            res.render('inventory/receipt-list', {
                user: req.user,
                errors: [error.message],
                warehouse: null
            });
        }
    },

    /**
     * API: Lấy danh sách phiếu nhập kho
     */
    getReceiptListApi: async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const sql = `
                SELECT 
                    r.*,
                    u.fullname as created_by_name,
                    COUNT(ri.id) as item_count
                FROM inventory_receipts r
                LEFT JOIN user u ON r.created_by = u.id
                LEFT JOIN inventory_receipt_items ri ON r.id = ri.receipt_id
                WHERE r.warehouse_id = ?
                GROUP BY r.id
                ORDER BY r.receipt_date DESC, r.id DESC
            `;
            const result = await commonService.getListTable(sql, [warehouseId]);
            res.json(result);
        } catch (error) {
            console.error('Error in getReceiptListApi:', error);
            res.json({ success: false, message: error.message, data: [] });
        }
    },

    /**
     * Danh sách phiếu xuất kho
     */
    issueList: async (req, res) => {
        try {
            const user = req.user;
            const warehouseId = req.params.warehouseId;
            const errors = [];

            // Lấy thông tin kho
            const warehouseResult = await commonService.getAllDataTable('inventory_warehouses', {
                id: warehouseId,
                campaign_id: user.campaign_id,
                active: 1
            });

            if (!warehouseResult.success || warehouseResult.data.length === 0) {
                errors.push('Không tìm thấy kho hoặc bạn không có quyền truy cập');
            }

            const warehouse = warehouseResult.success && warehouseResult.data.length > 0 ? warehouseResult.data[0] : null;

            res.render('inventory/issue-list', {
                user: user,
                errors: errors,
                warehouse: warehouse
            });
        } catch (error) {
            console.error('Error in issueList:', error);
            res.render('inventory/issue-list', {
                user: req.user,
                errors: [error.message],
                warehouse: null
            });
        }
    },

    /**
     * API: Lấy danh sách phiếu xuất kho
     */
    getIssueListApi: async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const sql = `
                SELECT 
                    i.*,
                    u.fullname as created_by_name,
                    COUNT(ii.id) as item_count
                FROM inventory_issues i
                LEFT JOIN user u ON i.created_by = u.id
                LEFT JOIN inventory_issue_items ii ON i.id = ii.issue_id
                WHERE i.warehouse_id = ?
                GROUP BY i.id
                ORDER BY i.issue_date DESC, i.id DESC
            `;
            const result = await commonService.getListTable(sql, [warehouseId]);
            res.json(result);
        } catch (error) {
            console.error('Error in getIssueListApi:', error);
            res.json({ success: false, message: error.message, data: [] });
        }
    },

    /**
     * Export phiếu nhập kho ra Excel
     */
    exportReceiptExcel: async (req, res) => {
        try {
            const receiptId = req.params.receiptId;

            // Lấy thông tin phiếu nhập
            const receiptSql = `
                SELECT r.*, w.name as warehouse_name, u.fullname as created_by_name
                FROM inventory_receipts r
                LEFT JOIN inventory_warehouses w ON r.warehouse_id = w.id
                LEFT JOIN user u ON r.created_by = u.id
                WHERE r.id = ?
            `;
            const receiptResult = await commonService.getListTable(receiptSql, [receiptId]);

            if (!receiptResult.success || receiptResult.data.length === 0) {
                return res.status(404).send('Không tìm thấy phiếu nhập kho');
            }

            const receipt = receiptResult.data[0];

            // Lấy chi tiết phiếu nhập
            const itemsSql = `
                SELECT ri.*, f.name as food_name, f.code as food_code
                FROM inventory_receipt_items ri
                LEFT JOIN food_info f ON ri.food_id = f.id
                WHERE ri.receipt_id = ?
                ORDER BY ri.id
            `;
            const itemsResult = await commonService.getListTable(itemsSql, [receiptId]);
            const items = itemsResult.success ? itemsResult.data : [];

            // Tạo Excel
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Phiếu nhập kho');

            // Header
            worksheet.mergeCells('A1:F1');
            worksheet.getCell('A1').value = 'PHIẾU NHẬP KHO';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            worksheet.getCell('A2').value = `Mã phiếu: ${receipt.receipt_code}`;
            worksheet.getCell('A3').value = `Kho: ${receipt.warehouse_name}`;
            worksheet.getCell('A4').value = `Ngày nhập: ${new Date(receipt.receipt_date).toLocaleDateString('vi-VN')}`;
            worksheet.getCell('A5').value = `Nhà cung cấp: ${receipt.supplier || 'N/A'}`;

            // Table header
            worksheet.getRow(7).values = ['STT', 'Mã TP', 'Tên thực phẩm', 'Số lượng', 'Đơn vị', 'Đơn giá', 'Thành tiền'];
            worksheet.getRow(7).font = { bold: true };

            // Data
            let row = 8;
            items.forEach((item, index) => {
                worksheet.getRow(row).values = [
                    index + 1,
                    item.food_code,
                    item.food_name,
                    item.quantity,
                    item.unit,
                    item.unit_price,
                    item.total_price
                ];
                row++;
            });

            // Total
            worksheet.getCell(`F${row}`).value = 'Tổng cộng:';
            worksheet.getCell(`F${row}`).font = { bold: true };
            worksheet.getCell(`G${row}`).value = receipt.total_amount;
            worksheet.getCell(`G${row}`).font = { bold: true };

            // Set column widths
            worksheet.columns = [
                { width: 5 },
                { width: 10 },
                { width: 30 },
                { width: 12 },
                { width: 10 },
                { width: 15 },
                { width: 15 }
            ];

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=PhieuNhap_${receipt.receipt_code}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error in exportReceiptExcel:', error);
            res.status(500).send('Lỗi khi xuất file Excel');
        }
    },

    /**
     * Export phiếu xuất kho ra Excel
     */
    exportIssueExcel: async (req, res) => {
        try {
            const issueId = req.params.issueId;

            // Lấy thông tin phiếu xuất
            const issueSql = `
                SELECT i.*, w.name as warehouse_name, u.fullname as created_by_name
                FROM inventory_issues i
                LEFT JOIN inventory_warehouses w ON i.warehouse_id = w.id
                LEFT JOIN user u ON i.created_by = u.id
                WHERE i.id = ?
            `;
            const issueResult = await commonService.getListTable(issueSql, [issueId]);

            if (!issueResult.success || issueResult.data.length === 0) {
                return res.status(404).send('Không tìm thấy phiếu xuất kho');
            }

            const issue = issueResult.data[0];

            // Lấy chi tiết phiếu xuất
            const itemsSql = `
                SELECT ii.*, f.name as food_name, f.code as food_code
                FROM inventory_issue_items ii
                LEFT JOIN food_info f ON ii.food_id = f.id
                WHERE ii.issue_id = ?
                ORDER BY ii.id
            `;
            const itemsResult = await commonService.getListTable(itemsSql, [issueId]);
            const items = itemsResult.success ? itemsResult.data : [];

            // Tạo Excel
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Phiếu xuất kho');

            // Header
            worksheet.mergeCells('A1:E1');
            worksheet.getCell('A1').value = 'PHIẾU XUẤT KHO';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            worksheet.getCell('A2').value = `Mã phiếu: ${issue.issue_code}`;
            worksheet.getCell('A3').value = `Kho: ${issue.warehouse_name}`;
            worksheet.getCell('A4').value = `Ngày xuất: ${new Date(issue.issue_date).toLocaleDateString('vi-VN')}`;
            worksheet.getCell('A5').value = `Người nhận: ${issue.receiver || 'N/A'}`;
            worksheet.getCell('A6').value = `Ghi chú: ${issue.note || 'N/A'}`;

            // Table header
            worksheet.getRow(8).values = ['STT', 'Mã TP', 'Tên thực phẩm', 'Số lượng', 'Đơn vị'];
            worksheet.getRow(8).font = { bold: true };

            // Data
            let row = 9;
            items.forEach((item, index) => {
                worksheet.getRow(row).values = [
                    index + 1,
                    item.food_code,
                    item.food_name,
                    item.quantity,
                    item.unit
                ];
                row++;
            });

            // Set column widths
            worksheet.columns = [
                { width: 5 },
                { width: 10 },
                { width: 30 },
                { width: 12 },
                { width: 10 }
            ];

            // Send file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=PhieuXuat_${issue.issue_code}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error in exportIssueExcel:', error);
            res.status(500).send('Lỗi khi xuất file Excel');
        }
    },

    /**
     * API: Lấy tổng hợp tồn kho (cho issue form)
     */
    getStockSummaryApi: async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const result = await inventoryService.getStockSummary(warehouseId);
            res.json(result);
        } catch (error) {
            console.error('Error in getStockSummaryApi:', error);
            res.json({ success: false, message: error.message, data: [] });
        }
    },

    /**
     * API: Lấy danh sách kho
     */
    getWarehousesApi: async (req, res) => {
        try {
            const user = req.user;
            if (!user.campaign_id) {
                return res.json({ success: false, message: 'Bạn chưa được gán vào campaign nào!' });
            }

            const result = await inventoryService.getWarehousesByCampaign(user.campaign_id);
            res.json(result);
        } catch (error) {
            console.error('Error in getWarehousesApi:', error);
            res.json({ success: false, message: error.message, data: [] });
        }
    },

    /**
     * Tạo phiếu xuất kho tự động từ thực đơn
     */
    createIssueFromMenu: async (req, res) => {
        try {
            const user = req.user;
            const { menu_build_id, week, day, warehouse_id, serving_count } = req.body;
            const count = serving_count ? parseInt(serving_count) : 1;

            if (!menu_build_id || !week || !day || !warehouse_id) {
                return res.json({ success: false, message: 'Thiếu thông tin bắt buộc' });
            }
            console.log(menu_build_id, week, day, warehouse_id, req.body);
            // Lấy chi tiết thực đơn
            const detailsResult = await commonService.getAllDataTable('menu_build_details', {
                menu_build_id: menu_build_id,
                week_number: week,
                day_of_week: day
            });
            console.log("detailsResult", detailsResult);
            if (!detailsResult.success || detailsResult.data.length === 0) {
                return res.json({ success: false, message: 'Không tìm thấy chi tiết thực đơn' });
            }

            // Tổng hợp foods từ tất cả giờ ăn
            const foodsMap = new Map();

            for (const detail of detailsResult.data) {
                let detailData = null;
                try {
                    detailData = JSON.parse(detail.detail || '{}');
                } catch (e) {
                    console.error('Error parsing detail JSON:', e);
                    continue;
                }

                if (detailData && detailData.listFood && Array.isArray(detailData.listFood)) {
                    detailData.listFood.forEach(food => {
                        const foodId = food.food_id || food.id_food;
                        if (!foodId) return;

                        const weightKg = (parseFloat(food.weight || 0) / 1000); // Convert g to kg
                        const ediblePercent = parseFloat(food.edible || 100) / 100;
                        const purchaseWeightKg = ediblePercent > 0 ? weightKg / ediblePercent : weightKg;

                        // Multiply by serving count
                        const totalPurchaseWeight = purchaseWeightKg * count;

                        if (foodsMap.has(foodId)) {
                            const existing = foodsMap.get(foodId);
                            existing.quantity += totalPurchaseWeight;
                        } else {
                            foodsMap.set(foodId, {
                                food_id: foodId,
                                quantity: totalPurchaseWeight
                            });
                        }
                    });
                }
            }

            if (foodsMap.size === 0) {
                return res.json({ success: false, message: 'Không có thực phẩm nào trong thực đơn' });
            }

            // --- Start Stock Availability Check ---
            const stockSummaryResult = await inventoryService.getStockSummary(warehouse_id);
            if (!stockSummaryResult.success) {
                return res.json({ success: false, message: 'Không thể lấy thông tin tồn kho: ' + stockSummaryResult.message });
            }

            const currentStockMap = new Map();
            stockSummaryResult.data.forEach(item => {
                currentStockMap.set(item.food_id, item.total_quantity);
            });

            const insufficientStockItems = [];
            const foodIdsToFetchNames = new Set();

            for (const [foodId, requiredItem] of foodsMap.entries()) {
                const requiredQuantity = requiredItem.quantity;
                const availableQuantity = currentStockMap.get(foodId) || 0;

                if (requiredQuantity > availableQuantity) {
                    insufficientStockItems.push({
                        food_id: foodId,
                        required: requiredQuantity,
                        available: availableQuantity
                    });
                    foodIdsToFetchNames.add(foodId);
                }
            }

            if (insufficientStockItems.length > 0) {
                // Fetch food names for better error message
                const foodNamesResult = await commonService.getAllDataTable('foods', {
                    id: Array.from(foodIdsToFetchNames)
                });

                const foodNameMap = new Map();
                if (foodNamesResult.success) {
                    foodNamesResult.data.forEach(food => {
                        foodNameMap.set(food.id, food.name);
                    });
                }

                const errorMessage = insufficientStockItems.map(item => {
                    const foodName = foodNameMap.get(item.food_id) || `ID: ${item.food_id}`;
                    return `${foodName} (cần: ${item.required.toFixed(2)} kg, có: ${item.available.toFixed(2)} kg)`;
                }).join('; ');

                return res.json({
                    success: false,
                    message: `Không đủ tồn kho cho các mặt hàng sau: ${errorMessage}`
                });
            }
            // --- End Stock Availability Check ---

            // Tạo phiếu xuất
            const issueCode = await inventoryService.generateIssueCode();
            const dayLabels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const dayLabel = dayLabels[day] || `Ngày ${day}`;

            const issueData = {
                warehouse_id: warehouse_id,
                issue_code: issueCode,
                issue_date: new Date().toISOString().split('T')[0],
                issue_type: 'menu',
                menu_build_id: menu_build_id,
                menu_week: week,
                menu_day: day,
                receiver: 'Bếp ăn',
                note: `Xuất kho tự động cho thực đơn - Tuần ${week}, ${dayLabel}`,
                status: 'confirmed'
            };

            const items = Array.from(foodsMap.values());
            const result = await inventoryService.createIssue(issueData, items, user.id);

            res.json(result);
        } catch (error) {
            console.error('Error in createIssueFromMenu:', error);
            res.json({ success: false, message: error.message });
        }
    }
};

module.exports = inventoryController;
