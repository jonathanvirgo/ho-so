const commonService = require('./commonService');

class DishService {

    // Lấy tất cả món ăn với thông tin dinh dưỡng
    async getAllDishesWithNutrition() {
        try {
            // Lấy danh sách món ăn
            const dishesResult = await commonService.getAllDataTable('dishes', { active: 1 });
            
            if (!dishesResult.success || !dishesResult.data) {
                return { success: false, message: 'Không thể lấy danh sách món ăn' };
            }

            const dishesWithNutrition = [];

            for (const dish of dishesResult.data) {
                const dishWithNutrition = await this.calculateDishNutrition(dish);
                if (dishWithNutrition) {
                    dishesWithNutrition.push(dishWithNutrition);
                }
            }

            return {
                success: true,
                data: dishesWithNutrition
            };
        } catch (error) {
            console.error('Error getting dishes with nutrition:', error);
            return { success: false, message: error.message };
        }
    }

    // Tính toán dinh dưỡng cho một món ăn
    async calculateDishNutrition(dish) {
        try {
            // Lấy danh sách thực phẩm trong món ăn
            const dishFoodsResult = await commonService.getAllDataTable('dish_foods', { dish_id: dish.id });
            
            if (!dishFoodsResult.success || !dishFoodsResult.data || dishFoodsResult.data.length === 0) {
                // Món ăn không có thực phẩm thành phần
                return {
                    ...dish,
                    total_energy: 0,
                    total_protein: 0,
                    total_carbohydrate: 0,
                    total_fat: 0,
                    total_fiber: 0,
                    ingredients: []
                };
            }

            let totalNutrition = {
                total_energy: 0,
                total_protein: 0,
                total_carbohydrate: 0,
                total_fat: 0,
                total_fiber: 0
            };

            const ingredients = [];

            // Tính toán dinh dưỡng từ từng thực phẩm thành phần
            for (const dishFood of dishFoodsResult.data) {
                // Lấy thông tin thực phẩm
                const foodResult = await commonService.getAllDataTable('food_info', { id: dishFood.food_id });
                
                if (foodResult.success && foodResult.data && foodResult.data.length > 0) {
                    const food = foodResult.data[0];
                    const weight = parseFloat(dishFood.weight) || 0;
                    const ratio = weight / 100; // Tính tỷ lệ từ 100g

                    // Tính dinh dưỡng theo khối lượng
                    const foodNutrition = {
                        energy: (parseFloat(food.energy) || 0) * ratio,
                        protein: (parseFloat(food.protein) || 0) * ratio,
                        carbohydrate: (parseFloat(food.carbohydrate) || 0) * ratio,
                        fat: (parseFloat(food.fat) || 0) * ratio,
                        fiber: (parseFloat(food.fiber) || 0) * ratio
                    };

                    // Cộng vào tổng
                    totalNutrition.total_energy += foodNutrition.energy;
                    totalNutrition.total_protein += foodNutrition.protein;
                    totalNutrition.total_carbohydrate += foodNutrition.carbohydrate;
                    totalNutrition.total_fat += foodNutrition.fat;
                    totalNutrition.total_fiber += foodNutrition.fiber;

                    // Thêm vào danh sách thành phần
                    ingredients.push({
                        food_id: food.id,
                        name: food.name,
                        ten: food.ten,
                        type: food.type,
                        weight: weight,
                        ...foodNutrition
                    });
                }
            }

            // Làm tròn các giá trị dinh dưỡng
            Object.keys(totalNutrition).forEach(key => {
                totalNutrition[key] = Math.round(totalNutrition[key] * 10) / 10;
            });

            return {
                ...dish,
                ...totalNutrition,
                ingredients: ingredients
            };
        } catch (error) {
            console.error('Error calculating dish nutrition:', error);
            return null;
        }
    }

    // Lấy món ăn theo ID với thông tin dinh dưỡng
    async getDishWithNutrition(dishId) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const dishResult = await commonService.getAllDataTable('dishes', { id: dishId });

            if (!dishResult.success || !dishResult.data || dishResult.data.length === 0) {
                return { success: false, message: 'Không tìm thấy món ăn' };
            }

            const dishWithNutrition = await this.calculateDishNutrition(dishResult.data[0]);
            
            if (!dishWithNutrition) {
                return { success: false, message: 'Không thể tính toán dinh dưỡng cho món ăn' };
            }

            return {
                success: true,
                data: dishWithNutrition
            };
        } catch (error) {
            console.error('Error getting dish with nutrition:', error);
            return { success: false, message: error.message };
        }
    }

    // Tìm kiếm món ăn theo tên
    async searchDishesByName(searchTerm, limit = 20) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const sql = `
                SELECT * FROM dishes 
                WHERE active = 1 AND (
                    name LIKE ? OR 
                    description LIKE ? OR 
                    category LIKE ?
                )
                ORDER BY name
                LIMIT ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const params = [searchPattern, searchPattern, searchPattern, limit];
            
            const result = await commonService.getListTable(sql, params);
            
            if (!result.success) {
                return { success: false, message: 'Lỗi tìm kiếm món ăn' };
            }

            const dishesWithNutrition = [];
            
            for (const dish of result.data || []) {
                const dishWithNutrition = await this.calculateDishNutrition(dish);
                if (dishWithNutrition) {
                    dishesWithNutrition.push(dishWithNutrition);
                }
            }

            return {
                success: true,
                data: dishesWithNutrition
            };
        } catch (error) {
            console.error('Error searching dishes:', error);
            return { success: false, message: error.message };
        }
    }

    // Sync món ăn lên Pinecone
    async syncDishesToPinecone() {
        try {
            const pineconeService = require('./pineconeService');
            
            console.log('Starting dish sync to Pinecone...');
            
            const dishesResult = await this.getAllDishesWithNutrition();
            
            if (!dishesResult.success || !dishesResult.data) {
                return { success: false, message: 'Không thể lấy dữ liệu món ăn' };
            }

            console.log(`Found ${dishesResult.data.length} dishes to sync`);
            
            // Upload lên Pinecone
            const uploadResult = await pineconeService.upsertDishes(dishesResult.data);
            
            if (uploadResult.success) {
                console.log('Dish sync completed successfully');
            }
            
            return uploadResult;
        } catch (error) {
            console.error('Error syncing dishes:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new DishService();
