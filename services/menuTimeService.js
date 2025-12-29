/**
 * Menu Time Service
 * Service quản lý giờ ăn (meal times) cho Menu Build
 * Map giữa bữa ăn và menu_time_id từ database
 */

// Danh sách giờ ăn từ database menu_time
// ID này phải khớp với database
const MENU_TIMES = [
    {
        id: 3,
        key: 'sang',
        name: '6h - 6h30',
        label: 'Bữa Sáng',
        icon: 'fa-sun',
        order: 1,
        color: '#FFD700' // Gold
    },
    {
        id: 4,
        key: 'phu_sang',
        name: '9h',
        label: 'Bữa Phụ Sáng',
        icon: 'fa-coffee',
        order: 2,
        color: '#FFA500' // Orange
    },
    {
        id: 5,
        key: 'trua',
        name: '11h30 - 12h',
        label: 'Bữa Trưa',
        icon: 'fa-cloud-sun',
        order: 3,
        color: '#FF6347', // Tomato
        isDefault: true // Mặc định
    },
    {
        id: 6,
        key: 'chieu',
        name: '15h',
        label: 'Bữa Chiều',
        icon: 'fa-cloud',
        order: 4,
        color: '#87CEEB' // Sky Blue
    },
    {
        id: 7,
        key: 'toi',
        name: '17h30 - 18h',
        label: 'Bữa Tối',
        icon: 'fa-moon',
        order: 5,
        color: '#4169E1' // Royal Blue
    },
    {
        id: 8,
        key: 'phu_toi',
        name: '21h',
        label: 'Bữa Phụ Tối',
        icon: 'fa-cookie-bite',
        order: 6,
        color: '#8B4513' // Saddle Brown
    }
];

/**
 * Lấy tất cả giờ ăn
 * @returns {Array} Danh sách giờ ăn
 */
function getAllMenuTimes() {
    return MENU_TIMES;
}

/**
 * Lấy giờ ăn theo ID
 * @param {number} id - ID giờ ăn
 * @returns {Object|null} Thông tin giờ ăn hoặc null nếu không tìm thấy
 */
function getMenuTimeById(id) {
    return MENU_TIMES.find(mt => mt.id === parseInt(id)) || null;
}

/**
 * Lấy giờ ăn theo key
 * @param {string} key - Key giờ ăn (sang, trua, toi, ...)
 * @returns {Object|null} Thông tin giờ ăn hoặc null nếu không tìm thấy
 */
function getMenuTimeByKey(key) {
    return MENU_TIMES.find(mt => mt.key === key) || null;
}

/**
 * Lấy giờ ăn mặc định (Bữa Trưa)
 * @returns {Object} Thông tin giờ ăn mặc định
 */
function getDefaultMenuTime() {
    return MENU_TIMES.find(mt => mt.isDefault) || MENU_TIMES[2]; // Fallback to Trưa
}

/**
 * Lấy danh sách ID giờ ăn từ array keys
 * @param {Array} keys - Danh sách key giờ ăn ['sang', 'trua', 'toi']
 * @returns {Array} Danh sách ID [3, 5, 7]
 */
function getMenuTimeIdsByKeys(keys) {
    if (!Array.isArray(keys)) return [];
    return keys.map(key => {
        const menuTime = getMenuTimeByKey(key);
        return menuTime ? menuTime.id : null;
    }).filter(id => id !== null);
}

/**
 * Lấy danh sách keys từ array IDs
 * @param {Array} ids - Danh sách ID [3, 5, 7]
 * @returns {Array} Danh sách key ['sang', 'trua', 'toi']
 */
function getMenuTimeKeysByIds(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => {
        const menuTime = getMenuTimeById(id);
        return menuTime ? menuTime.key : null;
    }).filter(key => key !== null);
}

/**
 * Validate danh sách ID giờ ăn
 * @param {Array} ids - Danh sách ID cần validate
 * @returns {Object} {valid: boolean, invalidIds: Array}
 */
function validateMenuTimeIds(ids) {
    if (!Array.isArray(ids)) {
        return { valid: false, invalidIds: [], message: 'IDs must be an array' };
    }
    
    const validIds = MENU_TIMES.map(mt => mt.id);
    const invalidIds = ids.filter(id => !validIds.includes(parseInt(id)));
    
    return {
        valid: invalidIds.length === 0,
        invalidIds: invalidIds,
        message: invalidIds.length > 0 ? `Invalid menu time IDs: ${invalidIds.join(', ')}` : 'Valid'
    };
}

/**
 * Lấy danh sách giờ ăn cho dropdown/select
 * @returns {Array} [{value: 3, label: 'Bữa Sáng (6h - 6h30)'}, ...]
 */
function getMenuTimesForSelect() {
    return MENU_TIMES.map(mt => ({
        value: mt.id,
        label: `${mt.label} (${mt.name})`,
        icon: mt.icon,
        color: mt.color
    }));
}

/**
 * Lấy danh sách giờ ăn theo IDs (để hiển thị)
 * @param {Array} ids - Danh sách ID [3, 5, 7]
 * @returns {Array} Danh sách giờ ăn đã filter
 */
function getMenuTimesByIds(ids) {
    if (!Array.isArray(ids)) return [];
    return MENU_TIMES.filter(mt => ids.includes(mt.id));
}

/**
 * Parse visible_meal_times từ JSON string
 * @param {string} jsonString - JSON string từ database
 * @returns {Array} Danh sách ID hoặc mảng rỗng nếu lỗi
 */
function parseVisibleMealTimes(jsonString) {
    if (!jsonString) return [getDefaultMenuTime().id]; // Mặc định là Trưa
    
    try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
            return parsed.map(id => parseInt(id));
        }
        return [getDefaultMenuTime().id];
    } catch (error) {
        console.error('Error parsing visible_meal_times:', error);
        return [getDefaultMenuTime().id];
    }
}

/**
 * Convert visible_meal_times thành JSON string
 * @param {Array} ids - Danh sách ID
 * @returns {string} JSON string
 */
function stringifyVisibleMealTimes(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return JSON.stringify([getDefaultMenuTime().id]);
    }
    return JSON.stringify(ids.map(id => parseInt(id)));
}

module.exports = {
    MENU_TIMES,
    getAllMenuTimes,
    getMenuTimeById,
    getMenuTimeByKey,
    getDefaultMenuTime,
    getMenuTimeIdsByKeys,
    getMenuTimeKeysByIds,
    validateMenuTimeIds,
    getMenuTimesForSelect,
    getMenuTimesByIds,
    parseVisibleMealTimes,
    stringifyVisibleMealTimes
};

