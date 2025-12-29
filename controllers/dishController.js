const commonService = require('../services/commonService'),
    securityService = require('../services/securityService');
const dataTableService = require('../services/dataTableService');
const dishCategoryService = require('../services/dishCategoryService');

// Hàm tối ưu hóa cập nhật thực phẩm trong món ăn
const updateDishFoods = async (dishId, newDishFoods) => {
    try {
        // Lấy danh sách thực phẩm hiện tại
        const currentFoodsRes = await commonService.getListTable(`
            SELECT * FROM dish_foods 
            WHERE dish_id = ? 
            ORDER BY order_index ASC, id ASC
        `, [dishId]);
        
        const currentFoods = currentFoodsRes.success ? currentFoodsRes.data : [];
        
        // Tạo map để dễ so sánh
        const currentFoodsMap = new Map();
        currentFoods.forEach(food => {
            const key = `${food.food_id}_${food.order_index}`;
            currentFoodsMap.set(key, food);
        });
        
        const newFoodsMap = new Map();
        newDishFoods.forEach((food, index) => {
            const key = `${food.food_id}_${index}`;
            newFoodsMap.set(key, {
                ...food,
                order_index: index,
                weight: parseFloat(food.weight) || 0
            });
        });
        
        // Tìm các thực phẩm cần xóa (có trong current nhưng không có trong new)
        for (const [key, currentFood] of currentFoodsMap) {
            if (!newFoodsMap.has(key)) {
                await commonService.deleteRecordTable(
                    { id: currentFood.id }, 
                    {}, 
                    'dish_foods'
                );
            }
        }
        
        // Xử lý các thực phẩm cần thêm mới hoặc cập nhật
        for (const [key, newFood] of newFoodsMap) {
            if (!newFood.food_id || newFood.weight <= 0) continue;
            
            if (currentFoodsMap.has(key)) {
                // Cập nhật thực phẩm hiện có nếu có thay đổi
                const currentFood = currentFoodsMap.get(key);
                if (currentFood.weight !== newFood.weight || 
                    currentFood.food_id !== newFood.food_id) {
                    await commonService.updateRecordTable(
                        {
                            food_id: newFood.food_id,
                            weight: newFood.weight,
                            order_index: newFood.order_index
                        },
                        { id: currentFood.id },
                        'dish_foods'
                    );
                }
            } else {
                // Thêm thực phẩm mới
                await commonService.addRecordTable({
                    dish_id: dishId,
                    food_id: newFood.food_id,
                    weight: newFood.weight,
                    order_index: newFood.order_index
                }, 'dish_foods');
            }
        }
        
    } catch (error) {
        console.error('Lỗi khi cập nhật thực phẩm món ăn:', error);
        throw error;
    }
};

const dishController = {
    // Hiển thị danh sách món ăn
    list: (req, res) => {
        try {   
            const errors = [];
            const user = req.user;
            if(!user.isAdmin && !user.role_id.includes(7)){
                errors.push('Bạn không có quyền truy cập danh sách này!');
            }
            
            res.render('mon-an/list', {
                user: user,
                errors: errors
            });
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            return res.render("error");
        }
    },
    
    // Hiển thị form tạo/sửa món ăn
    detail: async (req, res) => {
        const errors = [];
        const user = req.user;
        const id = req.params.id;
        let dishData = null;
        let dishFoods = [];
        if(!user.isAdmin && !user.role_id.includes(7)){
            errors.push('Bạn không có quyền truy cập!');
        }
        try {
            if (id && id !== 'new') {
                // Lấy thông tin món ăn hiện tại
                const currentDishRes = await commonService.getAllDataTable('dishes', { id: id });
                if (currentDishRes.success && currentDishRes.data && currentDishRes.data.length > 0) {
                    dishData = currentDishRes.data[0];

                    if(!(dishData.created_by == user.id || dishData.share == 1)){
                        errors.push('Bạn không có quyền truy cập!');
                    }
                  
                    // Lấy danh sách thực phẩm trong món ăn
                    const dishFoodsRes = await commonService.getListTable(`
                        SELECT
                            df.*,
                            fi.*,
                            df.weight as actual_weight
                        FROM dish_foods df
                        LEFT JOIN food_info fi ON df.food_id = fi.id
                        WHERE df.dish_id = ?
                        ORDER BY df.order_index ASC, df.id ASC
                    `, [id]);
                    
                    if (dishFoodsRes.success && dishFoodsRes.data) {
                        // Trả về dữ liệu gốc (trên 100g) để client tính toán theo trọng lượng thực tế
                        dishFoods = dishFoodsRes.data;
                    }
                }
            }
            
        } catch (error) {
            errors.push('Có lỗi xảy ra khi tải dữ liệu: ' + error.message);
            commonService.saveLog(req, error.message, error.stack);
        }
        
        res.render('mon-an/index', {
            user: user,
            errors: errors,
            dishData: dishData,
            dishFoods: dishFoods,
            isEdit: id && id !== 'new',
            dishCategories: dishCategoryService.getAllCategories()
        });
    },
    
    // API lấy danh sách món ăn cho DataTable
    listData: (req, res) => {
        const user = req.user;
        // Cấu hình DataTable
        const config = {
            table: 'dishes',
            columns: ['id', 'name', 'description', 'category', 'share', 'created_at', 'created_by'],
            primaryKey: 'id',
            active: -1,
            activeOperator: '!=',
            filters: {created_by: user.id},
            searchColumns: ['name', 'category'],
            columnsMapping: [
                'name', // column 1
                'description', // column 2
                'category', // column 3
                'food_count', // column 4
                'total_weight', // column 5
                'total_energy', // column 6
                'share', // column 7
                'created_at' // column 8
            ],
            defaultOrder: [
                { column: 'id', dir: 'DESC' }
            ],
            checkRole: false // Sẽ check manual bên dưới
        };
        
        // Kiểm tra quyền truy cập
        if (!user.isAdmin && !user.role_id.includes(7)) {
            return res.json(dataTableService.createErrorResponse(req.body, 'Bạn không có quyền truy cập danh sách này!'));
        }

        // Function xử lý dữ liệu trước khi trả về
        const preprocessData = async (data) => {
            for (let item of data) {
                // Lấy thông tin người tạo
                if (item.created_by) {
                    const userRes = await commonService.getAllDataTable('user', { id: item.created_by });
                    if (userRes.success && userRes.data && userRes.data.length > 0) {
                        item.created_by_name = userRes.data[0].fullname;
                    } else {
                        item.created_by_name = 'N/A';
                    }
                } else {
                    item.created_by_name = 'N/A';
                }

                // Đếm số lượng thực phẩm trong món ăn
                const countRes = await commonService.getListTable('SELECT COUNT(*) as count FROM dish_foods WHERE dish_id = ?', [item.id]);
                if (countRes.success && countRes.data && countRes.data.length > 0) {
                    item.food_count = countRes.data[0].count;
                } else {
                    item.food_count = 0;
                }

                // Tính tổng khối lượng và năng lượng
                const dishTotalsRes = await commonService.getListTable(`
                    SELECT
                        SUM(df.weight) as total_weight,
                        SUM((fi.energy * df.weight / 100)) as total_energy
                    FROM dish_foods df
                    LEFT JOIN food_info fi ON df.food_id = fi.id
                    WHERE df.dish_id = ?
                `, [item.id]);

                if (dishTotalsRes.success && dishTotalsRes.data && dishTotalsRes.data.length > 0) {
                    item.total_weight = parseFloat(dishTotalsRes.data[0].total_weight || 0);
                    item.total_energy = parseFloat(dishTotalsRes.data[0].total_energy || 0);
                } else {
                    item.total_weight = 0;
                    item.total_energy = 0;
                }
            }
            return data;
        };

        // Xử lý request với preprocessData
        dataTableService.handleDataTableRequest(req, res, config, preprocessData);
    },
    
    // API tạo/cập nhật món ăn
    upsert: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null
        };
        const user = req.user;
        if(!user.isAdmin && !user.role_id.includes(7)){
            resultData.message = 'Bạn không có quyền tạo/cập nhật món ăn!';
            return res.json(resultData);
        }
        try {
            const validateRules = [
                { field: "name", type: "string", required: true, message: "Vui lòng nhập tên món ăn!" }
            ];
            
            const parameter = {
                name: req.body.name,
                description: req.body.description || '',
                category: req.body.category || '',
                share: req.body.share ? parseInt(req.body.share) : 0,
                created_by: user.id,
                campaign_id: user.campaign_id
            };
            
            // Validate category nếu có
            if (parameter.category) {
                const validCategories = dishCategoryService.getAllKeys();
                if (!validCategories.includes(parameter.category)) {
                    resultData.message = `Loại món ăn không hợp lệ: ${parameter.category}`;
                    return res.json(resultData);
                }
            }
            
            // Validate input
            const errors = securityService.validateInput(parameter, validateRules, { returnType: 'array' });
            if (errors.length > 0) {
                resultData.message = errors.map(s => s.message).join(', ');
                return res.json(resultData);
            }
            
            // Parse danh sách thực phẩm
            let dishFoods = [];
            if (req.body.dish_foods) {
                try {
                    dishFoods = JSON.parse(req.body.dish_foods);
                } catch (e) {
                    resultData.message = 'Dữ liệu thực phẩm không hợp lệ!';
                    return res.json(resultData);
                }
            }
            
            const isCreate = !req.body.id;
            let responseData;
            let dishId;
            
            if (isCreate) {
                // Thêm mới món ăn
                responseData = await commonService.addRecordTable(parameter, 'dishes', true);
                if (responseData.success && responseData.data) {
                    dishId = responseData.data.insertId;
                    resultData.data = { id: dishId };
                }
            } else {
                dishId = req.body.id;
                delete parameter.created_by; // Không cập nhật created_by khi edit
                delete parameter.campaign_id; // Không cập nhật campaign_id khi edit
                // Kiểm tra quyền truy cập

                const dishDataRes = await commonService.getAllDataTable('dishes', { id: dishId });
                if(dishDataRes.success && dishDataRes.data && dishDataRes.data.length > 0){
                    const dishData = dishDataRes.data[0];
                    if(!(dishData.share == 1 || dishData.created_by == user.id)){
                        resultData.message = 'Bạn không có quyền truy cập!';
                        return res.json(resultData);
                    }
                }else{
                    resultData.message = 'Không tìm thấy dữ liệu để sửa!';
                    return res.json(resultData);
                }
                
                // Cập nhật món ăn
                responseData = await commonService.updateRecordTable(parameter, { id: dishId }, 'dishes');
            }
            
            if (responseData.success) {
                // Tối ưu hóa: Chỉ cập nhật những thay đổi cần thiết
                await updateDishFoods(dishId, dishFoods);
            }
            
            resultData.success = responseData.success;
            resultData.message = responseData.success 
                ? (isCreate ? 'Lưu thành công!' : 'Cập nhật thành công!')
                : responseData.message;
                
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Đã xảy ra lỗi trong quá trình xử lý!';
        }
        
        res.json(resultData);
    },
    
    // API xóa món ăn
    delete: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: null,
            error: null
        };

        try {
            const { id } = req.params;
            const user = req.user;

            // Kiểm tra quyền truy cập
            if (!user.isAdmin && !user.role_id.includes(7)) {
                throw new Error('Bạn không có quyền xóa danh sách này!');
            }

            // Kiểm tra ID
            if (!id) {
                throw new Error('Thiếu ID bản ghi!');
            }

            const recordId = parseInt(id, 10);
            if (isNaN(recordId)) {
                throw new Error('ID bản ghi không hợp lệ!');
            }

            // Xóa bản ghi (soft delete)
            const updateData = { active: -1 };
            const conditions = { id: recordId };
            
            const responseData = await commonService.updateRecordTable(updateData, conditions, 'dishes');

            if (!responseData || !responseData.success) {
                throw new Error('Không thể xóa bản ghi!');
            }

            resultData.success = responseData.success;
            resultData.message = 'Xóa món ăn thành công!';
            resultData.data = responseData.data || null;

            return res.status(200).json(resultData);

        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            res.json(securityService.createErrorResponse(error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu!', error, 500));
        }
    },
    
    // API lấy danh sách món ăn cho select
    getDishesForSelect: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: []
        };
        const user = req.user;
        try {
            if(!user.isAdmin && !user.role_id.includes(7)){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }
            let sql = 'SELECT * FROM dishes WHERE active = 1 AND (share = 1 OR created_by = ?)';
            let paramSql = [user.id];

            // Lọc theo category nếu có
            const { category } = req.query;
            if (category && category !== '') {
                sql += ' AND category = ?';
                paramSql.push(category);
            }

            // Lấy danh sách món ăn
            const dishesRes = await commonService.getListTable(sql, paramSql);
            if (dishesRes.success && dishesRes.data) {
                resultData.success = true;
                resultData.data = dishesRes.data.map(dish => ({
                    value: dish.id,
                    label: dish.name,
                    description: dish.description,
                    category: dish.category
                }));
            } else {
                resultData.message = 'Không có dữ liệu món ăn';
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            resultData.message = 'Có lỗi xảy ra khi lấy danh sách món ăn';
        }
        
        res.json(resultData);
    },

    // API lấy danh sách món ăn cho select theo loại
    getDishesForSelectByCategory: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: []
        };
        const user = req.user;
        try {
            if(!user.isAdmin && !user.role_id.includes(7)){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }
            
            const { category } = req.query;
            let sql = 'SELECT * FROM dishes WHERE active = 1 AND (share = 1 OR created_by = ?)';
            let paramSql = [user.id];

            if (category && category !== '') {
                sql += ' AND category = ?';
                paramSql.push(category);
            } else {
                // Nếu không có category, trả về tất cả món ăn
                sql += '';
            }

            // Lấy danh sách món ăn
            const dishesRes = await commonService.getListTable(sql, paramSql);
            if (dishesRes.success && dishesRes.data) {
                resultData.success = true;
                resultData.data = dishesRes.data.map(dish => ({
                    value: dish.id,
                    label: dish.name,
                    description: dish.description,
                    category: dish.category
                }));
            } else {
                resultData.message = 'Không có dữ liệu món ăn';
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            resultData.message = 'Có lỗi xảy ra khi lấy danh sách món ăn';
        }
        
        res.json(resultData);
    },
    
    // API lấy chi tiết thực phẩm trong món ăn
    getDishFoods: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: []
        };
        
        try {
            const user = req.user;
            if(!user.isAdmin && !user.role_id.includes(7)){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }
            const dishId = req.params.id;
            if (!dishId) {
                resultData.message = 'Thiếu ID món ăn';
                return res.json(resultData);
            }
            const conditions = { active: 1, id: dishId };

            // Kiểm tra món ăn có tồn tại không
            const dishCheckRes = await commonService.getAllDataTable('dishes', conditions);

            if (!dishCheckRes.success || !dishCheckRes.data || dishCheckRes.data.length === 0) {
                resultData.message = 'Món ăn không tồn tại';
                return res.json(resultData);
            }
            
            // Kiểm tra dữ liệu trong dish_foods đơn giản
            const simpleDishFoodsRes = await commonService.getAllDataTable('dish_foods', { dish_id: dishId });
            if (!simpleDishFoodsRes.success || !simpleDishFoodsRes.data || simpleDishFoodsRes.data.length === 0) {
                resultData.message = 'Không có dữ liệu thực phẩm trong món ăn';
                return res.json(resultData);
            }
            
            // Query đơn giản hóa - lấy tất cả trường từ food_info
            const dishFoodsRes = await commonService.getListTable(`
                SELECT
                    df.*,
                    fi.*,
                    fi.id as food_info_id,
                    df.weight as actual_weight
                FROM dish_foods df
                LEFT JOIN food_info fi ON df.food_id = fi.id
                WHERE df.dish_id = ?
                ORDER BY df.order_index ASC, df.id ASC
            `, [dishId]);

            if (dishFoodsRes.success && dishFoodsRes.data && dishFoodsRes.data.length > 0) {
                resultData.success = true;
                resultData.message = `Tìm thấy ${dishFoodsRes.data.length} thực phẩm trong món ăn`;
                // Trả về dữ liệu gốc (trên 100g) để client tính toán theo trọng lượng thực tế
                resultData.data = dishFoodsRes.data;
            } else {
                resultData.message = 'Không tìm thấy thông tin thực phẩm trong món ăn';
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack)
            resultData.message = 'Có lỗi xảy ra khi lấy danh sách thực phẩm';
        }
        
        res.json(resultData);
    },

    // API tìm kiếm món ăn theo tên để gợi ý
    searchDishesByName: async (req, res) => {
        const resultData = {
            success: false,
            message: '',
            data: []
        };
        
        try {
            const user = req.user;
            if(!user.isAdmin && !user.role_id.includes(7)){
                resultData.message = 'Bạn không có quyền truy cập danh sách này!';
                return res.json(resultData);
            }

            const { q } = req.query; // query string
            if (!q || q.trim().length < 2) {
                resultData.message = 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm';
                return res.json(resultData);
            }

            const searchTerm = q.trim();
            let sql = `
                SELECT id, name, category, description, share, created_by, created_at
                FROM dishes 
                WHERE active = 1 
                AND name LIKE ? AND (share = 1 OR created_by = ?)
            `;
            let params = [`${searchTerm}%`, user.id];

            sql += ` ORDER BY name ASC LIMIT 10`;

            const dishesRes = await commonService.getListTable(sql, params);
            
            if (dishesRes.success && dishesRes.data) {
                resultData.success = true;
                resultData.data = dishesRes.data.map(dish => ({
                    id: dish.id,
                    name: dish.name,
                    category: dish.category,
                    description: dish.description,
                    share: dish.share,
                    created_by: dish.created_by,
                    created_at: dish.created_at
                }));
                resultData.message = `Tìm thấy ${dishesRes.data.length} món ăn`;
            } else {
                resultData.message = 'Không tìm thấy món ăn nào';
            }
        } catch (error) {
            commonService.saveLog(req, error.message, error.stack);
            resultData.message = 'Có lỗi xảy ra khi tìm kiếm món ăn';
        }
        
        res.json(resultData);
    },

    // API cho hệ thống khác gọi - có xác thực bằng API key
    getDishFoodsExternal: async (req, res) => {
        try {
            const dishId = req.params.dishId;
            if (!dishId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing dish ID' 
                });
            }
            
            // Kiểm tra món ăn có tồn tại không
            const dishCheckRes = await commonService.getAllDataTable('dishes', { id: dishId, active: 1 });
            if (!dishCheckRes.success || !dishCheckRes.data || dishCheckRes.data.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dish not found' 
                });
            }
            
            // Kiểm tra dữ liệu trong dish_foods
            const simpleDishFoodsRes = await commonService.getAllDataTable('dish_foods', { dish_id: dishId});
            if (!simpleDishFoodsRes.success) {
                return res.status(500).json({ 
                    success: false, 
                    message: simpleDishFoodsRes.message || 'Failed to retrieve dish foods'
                });
            }
            
            // Gọi service để lấy dữ liệu
            const result = await commonService.getListTable(`
                SELECT
                    df.*,
                    fi.*,
                    fi.id as food_info_id,
                    df.weight as actual_weight
                FROM dish_foods df
                LEFT JOIN food_info fi ON df.food_id = fi.id
                WHERE df.dish_id = ? 
                ORDER BY df.order_index ASC, df.id ASC LIMIT 100
            `, [dishId]);
            
            if (result.success) {
                return res.json({ 
                    success: true, 
                    data: result.data,
                    message: 'Successfully retrieved dish foods'
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    message: result.message || 'Failed to retrieve dish foods'
                });
            }
        } catch (error) {
            console.error('Error in getDishFoodsExternal:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Internal server error'
            });
        }
    },

    getDishesForSelectExternal: async (req, res) => {
        try {       
            const search = req.query.search || '';
            
            let sql = 'SELECT * FROM dishes WHERE active = 1 AND created_by IN (2, 3)';
            let paramSql = [];
            
            if (search) {
                sql += ' AND name LIKE ?';
                paramSql.push(`%${search}%`);
            }
            
            sql += ' ORDER BY id DESC LIMIT 100';
            
            const result = await commonService.getListTable(sql, paramSql);
            
            if (result.success) {
                const formattedData = result.data.map(dish => ({
                    value: dish.id,
                    label: dish.name,
                    description: dish.description,
                    category: dish.category
                }));
                
                return res.json({ 
                    success: true, 
                    data: formattedData,
                    message: 'Successfully retrieved dishes'
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    message: result.message || 'Failed to retrieve dishes'
                });
            }
        } catch (error) {
            console.error('Error in getDishesForSelectExternal:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Internal server error: ' + error.message
            });
        }
    },

    getFoodNameExternal: async (req, res) => {
        try {
            const search = req.query.search || '';
            const food_type = req.query.food_type || '';
            const food_year = req.query.food_year || '';
            console.log('Search params:', search, food_type, food_year);
            let sql = 'SELECT * FROM food_info WHERE 1=1';
            let paramSql = [];
            
            if (search) {
                sql += ' AND name LIKE ?';
                paramSql.push(`%${search}%`);
            }
            
            if (food_type) {
                sql += ' AND type = ?';
                paramSql.push(food_type);
            }
            
            if (food_year) {
                sql += ' AND type_year = ?';
                paramSql.push(food_year);
            }
            
            sql += ' ORDER BY id DESC LIMIT 100';
            
            const result = await commonService.getListTable(sql, paramSql);
            
            if (result.success) {
                return res.json({ 
                    success: true, 
                    data: result.data,
                    message: 'Successfully retrieved food names'
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    message: result.message || 'Failed to retrieve food names'
                });
            }
        } catch (error) {
            console.error('Error in getFoodNameExternal:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Internal server error: ' + error.message
            });
        }
    }
};

module.exports = dishController;
