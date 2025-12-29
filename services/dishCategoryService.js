/**
 * Dish Category Service
 * Quản lý các loại món ăn (hardcoded, không lưu database)
 */

// Danh sách loại món ăn cố định
const DISH_CATEGORIES = [
    {
        key: 'mon_chinh',
        name: 'Món chính',
        description: 'Món ăn chính trong bữa',
        order: 1
    },
    {
        key: 'mon_man',
        name: 'Món mặn',
        description: 'Các món mặn đi kèm',
        order: 2
    },
    {
        key: 'mon_canh',
        name: 'Món canh',
        description: 'Các loại canh, súp',
        order: 3
    },
    {
        key: 'mon_xao',
        name: 'Món xào',
        description: 'Các món xào',
        order: 4
    },
    {
        key: 'mon_luoc',
        name: 'Món luộc',
        description: 'Các món luộc, hấp',
        order: 5
    },
    // {
    //     key: 'mon_rau',
    //     name: 'Món rau',
    //     description: 'Các món rau',
    //     order: 6
    // },
    {
        key: 'mon_trang_mieng',
        name: 'Món tráng miệng',
        description: 'Các món tráng miệng',
        order: 7
    }
];

const dishCategoryService = {
    /**
     * Lấy tất cả loại món
     */
    getAllCategories() {
        return DISH_CATEGORIES;
    },

    /**
     * Lấy loại món theo key
     */
    getCategoryByKey(key) {
        return DISH_CATEGORIES.find(cat => cat.key === key);
    },

    /**
     * Lấy tên loại món theo key
     */
    getCategoryName(key) {
        const category = this.getCategoryByKey(key);
        return category ? category.name : key;
    },

    /**
     * Kiểm tra key có hợp lệ không
     */
    isValidKey(key) {
        return DISH_CATEGORIES.some(cat => cat.key === key);
    },

    /**
     * Lấy danh sách keys
     */
    getAllKeys() {
        return DISH_CATEGORIES.map(cat => cat.key);
    },

    /**
     * Lấy loại món mặc định (tất cả)
     */
    getDefaultCategories() {
        return DISH_CATEGORIES.map(cat => cat.key);
    },

    /**
     * Filter loại món theo danh sách keys
     */
    filterCategories(keys) {
        if (!keys || !Array.isArray(keys)) {
            return DISH_CATEGORIES;
        }
        return DISH_CATEGORIES.filter(cat => keys.includes(cat.key));
    },

    /**
     * Validate danh sách keys
     */
    validateKeys(keys) {
        if (!keys || !Array.isArray(keys)) {
            return { valid: false, message: 'Keys phải là array' };
        }

        const invalidKeys = keys.filter(key => !this.isValidKey(key));
        if (invalidKeys.length > 0) {
            return { 
                valid: false, 
                message: `Keys không hợp lệ: ${invalidKeys.join(', ')}` 
            };
        }

        return { valid: true };
    }
};

module.exports = dishCategoryService;

