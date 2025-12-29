/**
 * Meal Type Service
 * Quản lý các loại bữa ăn (hardcoded, không lưu database)
 */

// Danh sách loại bữa ăn cố định
const MEAL_TYPES = [
    {
        key: 'sang',
        name: 'Sáng',
        description: 'Bữa sáng',
        order: 1,
        icon: 'fa-sun'
    },
    {
        key: 'trua',
        name: 'Trưa',
        description: 'Bữa trưa',
        order: 2,
        icon: 'fa-cloud-sun'
    },
    {
        key: 'chieu',
        name: 'Chiều',
        description: 'Bữa chiều',
        order: 3,
        icon: 'fa-cloud'
    },
    {
        key: 'toi',
        name: 'Tối',
        description: 'Bữa tối',
        order: 4,
        icon: 'fa-moon'
    },
    {
        key: 'phu',
        name: 'Phụ',
        description: 'Bữa phụ',
        order: 5,
        icon: 'fa-cookie-bite'
    }
];

const mealTypeService = {
    /**
     * Lấy tất cả loại bữa ăn
     */
    getAllMealTypes() {
        return MEAL_TYPES;
    },

    /**
     * Lấy loại bữa ăn theo key
     */
    getMealTypeByKey(key) {
        return MEAL_TYPES.find(meal => meal.key === key) || null;
    },

    /**
     * Lấy tên loại bữa ăn theo key
     */
    getMealTypeName(key) {
        const mealType = this.getMealTypeByKey(key);
        return mealType ? mealType.name : key;
    },

    /**
     * Kiểm tra key có hợp lệ không
     */
    isValidKey(key) {
        return MEAL_TYPES.some(meal => meal.key === key);
    },

    /**
     * Lấy danh sách keys
     */
    getAllKeys() {
        return MEAL_TYPES.map(meal => meal.key);
    },

    /**
     * Lấy loại bữa ăn mặc định (không có - null)
     */
    getDefaultMealTypes() {
        return null; // Mặc định không dùng bữa ăn
    },

    /**
     * Filter loại bữa ăn theo danh sách keys
     */
    filterMealTypes(keys) {
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return [];
        }
        return MEAL_TYPES.filter(meal => keys.includes(meal.key));
    },

    /**
     * Validate danh sách keys
     */
    validateKeys(keys) {
        if (!keys || !Array.isArray(keys)) {
            return { valid: false, message: 'Keys phải là array', invalidKeys: [] };
        }

        const invalidKeys = keys.filter(key => !this.isValidKey(key));
        if (invalidKeys.length > 0) {
            return {
                valid: false,
                message: `Keys không hợp lệ: ${invalidKeys.join(', ')}`,
                invalidKeys: invalidKeys
            };
        }

        return { valid: true, invalidKeys: [] };
    },

    /**
     * Lấy bữa ăn đầu tiên từ danh sách (theo thứ tự order)
     */
    getFirstMealType(keys) {
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return null;
        }
        // Filter và sort theo order
        const filtered = this.filterMealTypes(keys);
        return filtered.length > 0 ? filtered[0] : null;
    }
};

module.exports = mealTypeService;

