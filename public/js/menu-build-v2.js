/**
 * Menu Build V2 - Refactored
 * Cấu trúc: Ngày → Giờ ăn → Loại món (select)
 * Detail JSON: { courses: [...], listFood: [...] }
 */

// Global variables
let menuTimes = [];
let dishCategories = [];
let visibleMealTimes = [5]; // Default: Trưa
let visibleCategories = [];
let existingDetails = []; // Array of {week_number, day_of_week, menu_time_id, detail: {courses, listFood}}
let detailIdRemove = [];
let allDishes = [];
let hasUnsavedChanges = false; // Track unsaved changes

const daysOfWeek = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
];

/**
 * Initialize
 */
async function initMenuBuild(times, details, visibleTimes) {
    menuTimes = times || [];
    existingDetails = details || [];
    visibleMealTimes = visibleTimes || [5];

    // Parse detail JSON if needed
    existingDetails.forEach(d => {
        if (d.detail && typeof d.detail === 'string') {
            try {
                d.detail = JSON.parse(d.detail);
            } catch (e) {
                console.error('Error parsing detail JSON:', e);
                d.detail = { courses: [], listFood: [] };
            }
        }
        if (!d.detail) {
            d.detail = { courses: [], listFood: [] };
        }
        if (!d.detail.courses) d.detail.courses = [];
        if (!d.detail.listFood) d.detail.listFood = [];
    });

    await loadDishCategories();
    await loadDishes();
    setupViewTypeToggle();
    renderMealTimeToggles();
    renderCategoryToggles();
    renderMenuGrid();

    $('#saveMenuBtn').on('click', saveMenu);
    updateSaveButtonState();
}

/**
 * Load dish categories
 */
function loadDishCategories() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/menu-build/dish-categories',
            type: 'GET',
            async: false,
            success: function (response) {
                if (response.success) {
                    dishCategories = response.data;
                    visibleCategories = dishCategories.map(c => c.key);
                }
                resolve();
            }
        });
    })
}

/**
 * Load dishes
 */
function loadDishes() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/dishes-for-select-by-category',
            type: 'GET',
            success: function (response) {
                if (response.success) {
                    allDishes = response.data;
                }
                resolve();
            }
        });

    })
}

/**
 * Setup view type toggle
 */
function setupViewTypeToggle() {
    const viewType = $('#viewType').val();
    toggleWeekSelect(viewType);

    $('#viewType').on('change', function () {
        toggleWeekSelect($(this).val());
        renderMenuGrid();
    });

    $('#selectedWeek').on('change', function () {
        renderMenuGrid();
    });
}

function toggleWeekSelect(viewType) {
    if (viewType === 'week') {
        $('#weekSelectDiv').show();
    } else {
        $('#weekSelectDiv').hide();
    }
}

/**
 * Render meal time toggles
 */
function renderMealTimeToggles() {
    const container = $('#mealTimeToggles');
    container.empty();

    menuTimes.forEach(mt => {
        const isChecked = visibleMealTimes.includes(mt.id);
        container.append(`
            <div class="custom-control custom-switch mr-3 mb-2">
                <input type="checkbox" class="custom-control-input meal-time-toggle"
                       id="mealTime_${mt.id}" value="${mt.id}" ${isChecked ? 'checked' : ''}>
                <label class="custom-control-label" for="mealTime_${mt.id}">
                    <i class="fas ${mt.icon}"></i> ${mt.label} (${mt.name})
                </label>
            </div>
        `);
    });

    $('.meal-time-toggle').on('change', function () {
        const id = parseInt($(this).val());
        if ($(this).is(':checked')) {
            if (!visibleMealTimes.includes(id)) visibleMealTimes.push(id);
        } else {
            if (visibleMealTimes.length === 1) {
                Swal.fire('Cảnh báo', 'Phải có ít nhất 1 giờ ăn', 'warning');
                $(this).prop('checked', true);
                return;
            }
            visibleMealTimes = visibleMealTimes.filter(x => x !== id);
        }
        renderMenuGrid();
    });
}

/**
 * Render category toggles
 */
function renderCategoryToggles() {
    const container = $('#categoryToggles');
    container.empty();

    dishCategories.forEach(cat => {
        const isChecked = visibleCategories.includes(cat.key);
        container.append(`
            <div class="custom-control custom-switch mr-3 mb-2">
                <input type="checkbox" class="custom-control-input category-toggle"
                       id="category_${cat.key}" value="${cat.key}" ${isChecked ? 'checked' : ''}>
                <label class="custom-control-label" for="category_${cat.key}">
                    ${cat.name}
                </label>
            </div>
        `);
    });

    $('.category-toggle').on('change', function () {
        const key = $(this).val();
        if ($(this).is(':checked')) {
            if (!visibleCategories.includes(key)) visibleCategories.push(key);
        } else {
            if (visibleCategories.length === 1) {
                Swal.fire('Cảnh báo', 'Phải có ít nhất 1 loại món', 'warning');
                $(this).prop('checked', true);
                return;
            }
            visibleCategories = visibleCategories.filter(x => x !== key);
        }
        renderMenuGrid();
    });
}

/**
 * Render menu grid
 */
function renderMenuGrid() {
    const viewType = $('#viewType').val();
    const container = $('#menuGrid');
    container.empty();

    if (viewType === 'week') {
        const week = parseInt($('#selectedWeek').val()) || 1;
        renderWeekTable(week);
    } else {
        for (let week = 1; week <= 4; week++) {
            renderWeekTable(week);
        }
    }
}

/**
 * Render week table
 */
function renderWeekTable(weekNumber) {
    const container = $('#menuGrid');
    const card = $('<div>').addClass('card mb-3');
    const header = $('<div>').addClass('card-header bg-primary text-white')
        .html(`<h6 class="mb-0"><i class="fas fa-calendar-week"></i> Tuần ${weekNumber}</h6>`);
    const body = $('<div>').addClass('card-body p-0');
    const table = $('<table>').addClass('table table-bordered table-sm mb-0');

    // Header
    const thead = $('<thead>');
    const headerRow = $('<tr>').addClass('bg-light');
    headerRow.append($('<th>').text('Ngày').css('width', '80px'));
    headerRow.append($('<th>').text('Giờ ăn').css('width', '100px'));

    const visibleCats = dishCategories.filter(c => visibleCategories.includes(c.key));
    visibleCats.forEach(cat => {
        headerRow.append($('<th>').text(cat.name));
    });

    headerRow.append($('<th>').text('Thao tác').css('width', '100px'));
    thead.append(headerRow);
    table.append(thead);

    // Body
    const tbody = $('<tbody>');
    daysOfWeek.forEach(day => {
        const visibleMTs = menuTimes.filter(mt => visibleMealTimes.includes(mt.id));

        visibleMTs.forEach((mt, mtIndex) => {
            const row = $('<tr>');

            // Cột ngày (rowspan)
            if (mtIndex === 0) {
                row.append($('<td>').attr('rowspan', visibleMTs.length)
                    .html(`<strong>${day.label}</strong>`));
            }

            // Cột giờ ăn với button tính nguyên liệu
            const mealTimeCell = $('<td>');
            mealTimeCell.html(`
                <div class="d-flex justify-content-between align-items-center">
                    <small><i class="fas ${mt.icon}"></i> ${mt.name}</small>
                    <button class="btn btn-xs btn-success ml-1" onclick="calculateIngredientsByMealTime(${weekNumber}, ${day.value}, ${mt.id}, '${day.label}', '${mt.name}')" title="Tính nguyên liệu giờ ăn này">
                        <i class="fas fa-clock"></i>
                    </button>
                </div>
            `);
            row.append(mealTimeCell);

            // Cột loại món
            visibleCats.forEach(cat => {
                const cell = $('<td>');
                renderDishCell(cell, weekNumber, day.value, mt.id, cat.key);
                row.append(cell);
            });

            // Cột thao tác (rowspan cho ngày)
            if (mtIndex === 0) {
                const actionCell = $('<td>').attr('rowspan', visibleMTs.length).addClass('text-center');
                actionCell.html(`
                    <div class="btn-group-vertical btn-group-sm" role="group">
                        <button class="btn btn-warning mb-1" onclick="editDayDetail(${weekNumber}, ${day.value}, '${day.label}')" title="Sửa chi tiết ngày">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-info mb-1" onclick="calculateIngredients(${weekNumber}, ${day.value}, '${day.label}')" title="Tính nguyên liệu cả ngày">
                            <i class="fas fa-calculator"></i>
                        </button>
                        <button class="btn btn-success mb-1" onclick="createIssueFromDay(${weekNumber}, ${day.value}, '${day.label}')" title="Tạo phiếu xuất kho ngày">
                            <i class="fas fa-file-export"></i>
                        </button>
                    </div>
                `);
                row.append(actionCell);
            }

            tbody.append(row);
        });
    });

    table.append(tbody);
    body.append(table);

    // Footer với các button tổng hợp
    const footer = $('<div>').addClass('card-footer');
    footer.html(`
        <div class="d-flex justify-content-end flex-wrap gap-2">
            <button class="btn btn-info btn-sm" onclick="calculateWeekIngredients(${weekNumber})" title="Tính nguyên liệu cả tuần">
                <i class="fas fa-calculator"></i> Tính nguyên liệu tuần ${weekNumber}
            </button>
            <button class="btn btn-success btn-sm" onclick="createIssueFromWeek(${weekNumber})" title="Tạo phiếu xuất kho cho tuần">
                <i class="fas fa-box"></i> Tạo phiếu xuất kho tuần ${weekNumber}
            </button>
            <button class="btn btn-info btn-sm" onclick="exportMenuExcel()" title="Xuất Excel">
                <i class="fas fa-file-excel"></i> Xuất Excel
            </button>
            <button class="btn btn-warning btn-sm" onclick="exportMenuExcelWithPurchase()" title="Xuất Excel với cột % ăn được và khối lượng cần mua">
                <i class="fas fa-file-excel"></i> Xuất Excel Mua Hàng
            </button>
            <button class="btn btn-info btn-sm" onclick="exportMenuTableExcel()" title="Xuất Excel Table">
                <i class="fas fa-file-excel"></i> Xuất Excel Table
            </button>
        </div>
    `);

    card.append(header).append(body).append(footer);
    container.append(card);
}

/**
 * Render dish cell (select hoặc hiển thị tên món + icon edit)
 * Hỗ trợ nhiều món cùng loại
 */
function renderDishCell(cell, week, day, mealTimeId, categoryKey) {
    const detail = getDetail(week, day, mealTimeId);
    const courses = detail.courses ? detail.courses.filter(c => c.category_key === categoryKey) : [];

    if (courses.length > 0) {
        // Đã có món - hiển thị danh sách
        const dishesHtml = courses.map((course, index) => `
            <div class="d-flex justify-content-between align-items-center mb-1 ${index > 0 ? 'border-top pt-1' : ''}">
                <span class="text-truncate" title="${course.name}">${course.name}</span>
                <button class="btn btn-xs btn-info ml-1" onclick="changeDish(${week}, ${day}, ${mealTimeId}, '${categoryKey}', ${course.id})" title="Chọn lại món">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `).join('');

        // Thêm button "Thêm món"
        cell.html(`
            <div>
                ${dishesHtml}
                <button class="btn btn-xs btn-success btn-block mt-1" onclick="addDishToCategory(${week}, ${day}, ${mealTimeId}, '${categoryKey}')" title="Thêm món">
                    <i class="fas fa-plus"></i> Thêm món
                </button>
            </div>
        `);
    } else {
        // Chưa có món - hiển thị select
        const selectId = `dish_${week}_${day}_${mealTimeId}_${categoryKey}`;
        cell.html(`<div id="${selectId}" class=""></div>`);

        setTimeout(() => {
            const options = allDishes
                .filter(d => d.category === categoryKey);
            VirtualSelect.init({
                ele: `#${selectId}`,
                options: options,
                placeholder: 'Chọn món...',
                search: true
            });

            document.querySelector(`#${selectId}`).addEventListener('change', function () {
                if (this.value) {
                    onDishSelected(week, day, mealTimeId, categoryKey, this.value);
                }
            });
        }, 100);
    }
}

/**
 * Tính toán lại các giá trị dinh dưỡng theo weight mới (giống menuExample.js)
 */
function caculateFoodInfo(originalFood, newWeight) {
    // Kiểm tra dữ liệu đầu vào
    if (!originalFood || isNaN(parseFloat(newWeight))) {
        console.error('Invalid input data for caculateFoodInfo');
        return originalFood;
    }

    if (typeof newWeight !== 'number') {
        newWeight = parseFloat(newWeight);
    }

    // Tỉ lệ = weight mới / weight gốc
    const originalWeight = parseFloat(originalFood.weight) || 0;
    const ratio = originalWeight > 0 ? newWeight / originalWeight : 0;

    // Tạo object mới từ object gốc
    const newFood = { ...originalFood };

    // Cập nhật weight mới
    newFood.weight = newWeight;

    // Danh sách các trường KHÔNG cần tính lại (các trường metadata, id, etc.)
    const fieldsToSkip = new Set([
        'id', 'id_food', 'name', 'ten', 'code', 'type', 'type_year', 'active',
        'weight', 'created_by', 'note', 'created_at', 'updated_at', 'course_id',
        'food_id', 'dish_id', 'food_name', 'unit', 'order_index', 'category_key'
    ]);

    // Duyệt qua tất cả các key và tính lại nếu là số
    Object.keys(originalFood).forEach(key => {
        // Bỏ qua các trường không cần tính
        if (fieldsToSkip.has(key)) {
            return;
        }

        const value = originalFood[key];

        // Chỉ tính lại nếu giá trị là số và không null/undefined
        if (typeof value === 'number' && value !== null && value !== undefined) {
            if (ratio > 0) {
                newFood[key] = Math.round((value * ratio) * 100) / 100; // Làm tròn 2 chữ số thập phân
            } else {
                // Nếu weight gốc = 0, giữ nguyên giá trị gốc
                newFood[key] = value;
            }
        }
    });

    return newFood;
}

/**
 * Tạo object food từ dishFood với tính toán dinh dưỡng động (giống menuExample.js)
 */
function createFoodFromDishFood(dishFood, courseId, detailRecord) {
    const foodId = detailRecord.detail.listFood.length === 0 ? 1 :
        Math.max(...detailRecord.detail.listFood.map(f => f.id)) + 1;
    const actualWeight = dishFood.actual_weight || dishFood.weight || 0;

    // Tính toán dinh dưỡng theo tỉ lệ khối lượng
    const calculatedNutrition = caculateFoodInfo(dishFood, actualWeight);

    return {
        "id": foodId,
        id_food: dishFood.food_id || dishFood.food_info_id || dishFood.id,
        course_id: courseId,
        // Tất cả giá trị dinh dưỡng được tính toán động
        ...calculatedNutrition
    };
}

/**
 * Change dish (chọn lại món - update course hiện có)
 */
function changeDish(week, day, mealTimeId, categoryKey, courseId) {
    Swal.fire({
        title: 'Chọn món mới',
        html: '<div id="swalDishSelect" class=""></div>',
        showCancelButton: true,
        confirmButtonText: 'Chọn',
        cancelButtonText: 'Hủy',
        didOpen: () => {
            const options = allDishes
                .filter(d => d.category === categoryKey);
            console.log('options', options, categoryKey);
            VirtualSelect.init({
                ele: '#swalDishSelect',
                options: [...options],
                placeholder: 'Chọn món...',
                search: true
            });
        },
        preConfirm: () => {
            const value = document.querySelector('#swalDishSelect').value;
            if (!value) {
                Swal.showValidationMessage('Vui lòng chọn món');
                return false;
            }
            return value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            onDishSelectedForUpdate(week, day, mealTimeId, categoryKey, courseId, result.value);
        }
    });
}

/**
 * Add dish to category (thêm món mới vào loại món)
 */
function addDishToCategory(week, day, mealTimeId, categoryKey) {
    Swal.fire({
        title: 'Thêm món ăn',
        html: '<div id="swalDishSelectAdd" class=""></div>',
        showCancelButton: true,
        confirmButtonText: 'Thêm',
        cancelButtonText: 'Hủy',
        didOpen: () => {
            const options = allDishes
                .filter(d => d.category === categoryKey);
            VirtualSelect.init({
                ele: '#swalDishSelectAdd',
                options: [...options],
                placeholder: 'Chọn món...',
                search: true
            });
        },
        preConfirm: () => {
            const value = document.querySelector('#swalDishSelectAdd').value;
            if (!value) {
                Swal.showValidationMessage('Vui lòng chọn món');
                return false;
            }
            return value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            onDishSelected(week, day, mealTimeId, categoryKey, result.value);
        }
    });
}

/**
 * On dish selected (thêm món mới)
 */
async function onDishSelected(week, day, mealTimeId, categoryKey, dishId) {
    console.log('onDishSelected', week, day, mealTimeId, categoryKey, dishId);
    if (!dishId) return;
    else dishId = parseInt(dishId);
    try {
        // Lấy thông tin món ăn + foods
        const response = await $.ajax({
            url: `/api/dish-foods/${dishId}`,
            type: 'GET'
        });
        console.log('response onDishSelected', response);
        if (!response.success) {
            Swal.fire('Lỗi', 'Không thể lấy thông tin món ăn', 'error');
            return;
        }

        const dishFoods = response.data; // Array of foods with full info

        // Lấy thông tin món ăn
        const dish = allDishes.find(d => d.value == dishId);
        console.log('dish onDishSelected', dish);
        if (!dish) {
            Swal.fire('Lỗi', 'Không tìm thấy món ăn', 'error');
            return;
        }

        // Tìm hoặc tạo detail record
        let detailRecord = existingDetails.find(d =>
            d.week_number === week &&
            d.day_of_week === day &&
            d.menu_time_id === mealTimeId
        );
        console.log('detailRecord onDishSelected', detailRecord);
        if (!detailRecord) {
            detailRecord = {
                week_number: week,
                day_of_week: day,
                menu_time_id: mealTimeId,
                detail: { courses: [], listFood: [] }
            };
            existingDetails.push(detailRecord);
        }

        // Ensure detail is object
        if (typeof detailRecord.detail === 'string') {
            detailRecord.detail = JSON.parse(detailRecord.detail);
        }

        if (!detailRecord.detail.courses) detailRecord.detail.courses = [];
        if (!detailRecord.detail.listFood) detailRecord.detail.listFood = [];

        // Tìm course_id mới (không xóa course cũ)
        const maxCourseId = detailRecord.detail.courses.length > 0 ?
            Math.max(...detailRecord.detail.courses.map(c => c.id)) : 0;
        const newCourseId = maxCourseId + 1;
        // Thêm course mới
        detailRecord.detail.courses.push({
            id: newCourseId,
            name: dish.label,
            dish_id: dish.id,
            category_key: categoryKey
        });

        // Thêm foods vào listFood với tính toán dinh dưỡng
        if (dishFoods && dishFoods.length > 0) {
            dishFoods.forEach((dishFood, index) => {
                // Sử dụng createFoodFromDishFood để tính toán dinh dưỡng
                const food = createFoodFromDishFood(dishFood, newCourseId, detailRecord);
                food.order_index = index;
                food.dish_id = dish.id;
                detailRecord.detail.listFood.push(food);
            });
        }

        // Mark as unsaved
        markAsUnsaved();

        // Re-render grid
        renderMenuGrid();
        console.log('detailRecord after add', dish);
        Swal.fire({
            icon: 'success',
            title: 'Đã thêm món',
            text: `Đã thêm "${dish.label}" vào thực đơn`,
            timer: 1500,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error loading dish:', error);
        Swal.fire('Lỗi', 'Không thể tải thông tin món ăn', 'error');
    }
}

/**
 * On dish selected for update (cập nhật course hiện có)
 */
async function onDishSelectedForUpdate(week, day, mealTimeId, categoryKey, courseId, dishId) {
    console.log('onDishSelectedForUpdate', week, day, mealTimeId, categoryKey, courseId, dishId);
    if (!dishId) return;
    else dishId = parseInt(dishId);
    try {
        // Lấy thông tin món ăn + foods
        const response = await $.ajax({
            url: `/api/dish-foods/${dishId}`,
            type: 'GET'
        });

        if (!response.success) {
            Swal.fire('Lỗi', 'Không thể lấy thông tin món ăn', 'error');
            return;
        }

        const dishFoods = response.data;
        const dish = allDishes.find(d => d.value == dishId);

        if (!dish) {
            Swal.fire('Lỗi', 'Không tìm thấy món ăn', 'error');
            return;
        }

        // Tìm detail record
        let detailRecord = existingDetails.find(d =>
            d.week_number === week &&
            d.day_of_week === day &&
            d.menu_time_id === mealTimeId
        );

        if (!detailRecord) {
            Swal.fire('Lỗi', 'Không tìm thấy detail record', 'error');
            return;
        }

        // Ensure detail is object
        if (typeof detailRecord.detail === 'string') {
            detailRecord.detail = JSON.parse(detailRecord.detail);
        }

        // Tìm course cần update
        const courseToUpdate = detailRecord.detail.courses.find(c => c.id === courseId);
        if (!courseToUpdate) {
            Swal.fire('Lỗi', 'Không tìm thấy course', 'error');
            return;
        }

        // Xóa foods cũ của course này
        detailRecord.detail.listFood = detailRecord.detail.listFood.filter(f => f.course_id !== courseId);

        // Update course
        courseToUpdate.name = dish.label;
        courseToUpdate.dish_id = dishId;

        // Thêm foods mới
        const maxFoodId = detailRecord.detail.listFood.length > 0 ?
            Math.max(...detailRecord.detail.listFood.map(f => f.id)) : 0;
        let nextFoodId = maxFoodId + 1;

        dishFoods.forEach(dishFood => {
            const food = createFoodFromDishFood(dishFood, dish.label, nextFoodId, courseId);
            detailRecord.detail.listFood.push(food);
            nextFoodId++;
        });

        // Mark as unsaved
        markAsUnsaved();

        // Re-render
        renderWeekTable(week);

        Swal.fire({
            icon: 'success',
            title: 'Đã cập nhật',
            text: `Đã cập nhật thành "${dish.label}"`,
            timer: 1500,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error updating dish:', error);
        Swal.fire('Lỗi', 'Không thể cập nhật món ăn', 'error');
    }
}

/**
 * Edit day detail (mở trang riêng)
 */
function editDayDetail(week, day, dayLabel) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
        showUnsavedChangesModal(() => {
            // After save or cancel, open the edit page
            window.open(`/menu-build/edit-day/${menuId}/${week}/${day}`, '_blank');
        });
    } else {
        // Mở trang edit detail
        window.open(`/menu-build/edit-day/${menuId}/${week}/${day}`, '_blank');
    }
}

/**
 * Calculate ingredients (tính nguyên liệu cả ngày)
 */
function calculateIngredients(week, day, dayLabel) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
        showUnsavedChangesModal(() => {
            // After save or cancel, open the ingredients page
            window.open(`/menu-build/ingredients/${menuId}/${week}/${day}`, '_blank');
        });
    } else {
        // Mở trang tính nguyên liệu
        window.open(`/menu-build/ingredients/${menuId}/${week}/${day}`, '_blank');
    }
}

/**
 * Calculate ingredients by meal time (tính nguyên liệu theo giờ ăn)
 */
function calculateIngredientsByMealTime(week, day, mealTimeId, dayLabel, mealTimeName) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Mở trang tính nguyên liệu theo giờ ăn
    window.open(`/menu-build/ingredients/${menuId}/${week}/${day}/${mealTimeId}`, '_blank');
}

/**
 * Calculate ingredients for whole week
 */
function calculateWeekIngredients(week) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
        showUnsavedChangesModal(() => {
            // After save or cancel, open the weekly ingredients page
            window.open(`/menu-build/ingredients-week/${menuId}/${week}`, '_blank');
        });
    } else {
        // Open the weekly ingredients page
        window.open(`/menu-build/ingredients-week/${menuId}/${week}`, '_blank');
    }
}

/**
 * Create issue from week (tạo phiếu xuất kho cho tuần)
 */
function createIssueFromWeek(week) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Lấy danh sách kho trước
    $.ajax({
        url: '/api/inventory/warehouses',
        type: 'GET',
        success: function (response) {
            if (!response.success || !response.data || response.data.length === 0) {
                Swal.fire('Lỗi', 'Không tìm thấy kho nào. Vui lòng tạo kho trong phần Quản lý kho trước.', 'error');
                return;
            }

            const warehouses = response.data;
            let warehouseOptions = '';
            warehouses.forEach(w => {
                warehouseOptions += `<option value="${w.id}">${w.name}</option>`;
            });

            Swal.fire({
                title: 'Tạo phiếu xuất kho',
                html: `
                    <p>Tạo phiếu xuất kho cho tuần ${week}?</p>
                    <div class="form-group text-start mb-3">
                        <label class="fw-bold mb-1">Chọn kho xuất:</label>
                        <select id="swalWarehouseId" class="form-control">
                            ${warehouseOptions}
                        </select>
                    </div>
                    <div class="form-group text-start">
                        <label class="fw-bold mb-1">Số lượng suất ăn (người):</label>
                        <input type="number" id="swalServingCount" class="form-control" value="1" min="1">
                    </div>
                    <p class="text-muted small mt-3">Hệ thống sẽ tạo 7 phiếu xuất (từ Thứ 2 đến Chủ nhật) dựa trên khối lượng thực phẩm cần mua.</p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Tạo phiếu',
                cancelButtonText: 'Hủy',
                preConfirm: () => {
                    const warehouseId = document.getElementById('swalWarehouseId').value;
                    const servingCount = document.getElementById('swalServingCount').value;
                    if (!servingCount || servingCount < 1) {
                        Swal.showValidationMessage('Vui lòng nhập số lượng suất ăn hợp lệ');
                        return false;
                    }
                    return { warehouseId, servingCount };
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const { warehouseId, servingCount } = result.value;

                    // Show loading
                    Swal.fire({
                        title: 'Đang xử lý...',
                        html: 'Đang tạo phiếu xuất kho cho từng ngày...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    try {
                        let successCount = 0;
                        let errorCount = 0;
                        let details = [];

                        // Tạo phiếu cho từng ngày
                        for (let day = 2; day <= 8; day++) {
                            const response = await $.ajax({
                                url: '/api/inventory/create-issue-from-menu',
                                type: 'POST',
                                contentType: 'application/json',
                                data: JSON.stringify({
                                    menu_build_id: menuId,
                                    week: week,
                                    day: day,
                                    warehouse_id: warehouseId,
                                    serving_count: servingCount
                                })
                            });

                            if (response.success) {
                                successCount++;
                            } else {
                                // Chỉ đếm lỗi nếu không phải là do không có thực phẩm (message có thể khác nhau tùy backend trả về)
                                // Tuy nhiên ở đây ta cứ đếm, nhưng hiển thị thông báo khéo léo
                                errorCount++;
                                if (response.message && response.message !== 'Không có thực phẩm nào trong thực đơn') {
                                    details.push(`Thứ ${day}: ${response.message}`);
                                }
                            }
                        }

                        if (successCount > 0) {
                            let htmlMsg = `<p>Đã tạo ${successCount} phiếu xuất kho thành công.</p>`;
                            if (errorCount > 0) {
                                htmlMsg += `<p class="text-warning small">Có ${errorCount} ngày không tạo được phiếu (do không có món ăn hoặc lỗi).</p>`;
                            }

                            Swal.fire({
                                icon: 'success',
                                title: 'Hoàn thành',
                                html: htmlMsg
                            });
                        } else {
                            Swal.fire('Thông báo', 'Không tạo được phiếu xuất kho nào. Có thể thực đơn tuần này chưa có món ăn.', 'info');
                        }

                    } catch (error) {
                        console.error('Error creating issues:', error);
                        Swal.fire('Lỗi', 'Có lỗi xảy ra khi tạo phiếu xuất kho', 'error');
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching warehouses:', error);
            Swal.fire('Lỗi', 'Không thể lấy danh sách kho', 'error');
        }
    });
}

/**
 * Create issue from day (tạo phiếu xuất kho cho 1 ngày)
 */
function createIssueFromDay(week, day, dayLabel) {
    const menuId = $('#menuId').val();
    if (!menuId) {
        Swal.fire('Cảnh báo', 'Vui lòng lưu thực đơn trước', 'warning');
        return;
    }

    // Lấy danh sách kho trước
    $.ajax({
        url: '/api/inventory/warehouses',
        type: 'GET',
        success: function (response) {
            if (!response.success || !response.data || response.data.length === 0) {
                Swal.fire('Lỗi', 'Không tìm thấy kho nào. Vui lòng tạo kho trong phần Quản lý kho trước.', 'error');
                return;
            }

            const warehouses = response.data;
            let warehouseOptions = '';
            warehouses.forEach(w => {
                warehouseOptions += `<option value="${w.id}">${w.name}</option>`;
            });

            Swal.fire({
                title: 'Tạo phiếu xuất kho',
                html: `
                    <p>Tạo phiếu xuất kho cho <strong>${dayLabel} - Tuần ${week}</strong>?</p>
                    <div class="form-group text-start mb-3">
                        <label class="fw-bold mb-1">Chọn kho xuất:</label>
                        <select id="swalWarehouseIdDay" class="form-control">
                            ${warehouseOptions}
                        </select>
                    </div>
                    <div class="form-group text-start">
                        <label class="fw-bold mb-1">Số lượng suất ăn (người):</label>
                        <input type="number" id="swalServingCountDay" class="form-control" value="1" min="1">
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Tạo phiếu',
                cancelButtonText: 'Hủy',
                preConfirm: () => {
                    const warehouseId = document.getElementById('swalWarehouseIdDay').value;
                    const servingCount = document.getElementById('swalServingCountDay').value;
                    if (!servingCount || servingCount < 1) {
                        Swal.showValidationMessage('Vui lòng nhập số lượng suất ăn hợp lệ');
                        return false;
                    }
                    return { warehouseId, servingCount };
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const { warehouseId, servingCount } = result.value;

                    // Show loading
                    Swal.fire({
                        title: 'Đang xử lý...',
                        html: 'Đang tạo phiếu xuất kho...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    try {
                        console.log('Creating issue from menu...', {
                            menuId,
                            week,
                            day,
                            warehouseId,
                            servingCount
                        })
                        const response = await $.ajax({
                            url: '/api/inventory/create-issue-from-menu',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                menu_build_id: menuId,
                                week: week,
                                day: day,
                                warehouse_id: warehouseId,
                                serving_count: servingCount
                            })
                        });

                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công',
                                text: `Đã tạo phiếu xuất kho cho ${dayLabel}`,
                                timer: 2000,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire('Lỗi', response.message || 'Không thể tạo phiếu xuất kho', 'error');
                        }

                    } catch (error) {
                        console.error('Error creating issue:', error);
                        Swal.fire('Lỗi', 'Có lỗi xảy ra khi tạo phiếu xuất kho', 'error');
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            console.error('Error fetching warehouses:', error);
            Swal.fire('Lỗi', 'Không thể lấy danh sách kho', 'error');
        }
    });
}

/**
 * Save menu
 */
function saveMenu() {
    const menuId = $('#menuId').val();
    const name = $('#menuName').val().trim();
    const description = $('#description').val().trim();
    const viewType = $('#viewType').val();
    const selectedWeek = $('#selectedWeek').val();
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const status = $('#status').val();
    const note = $('#note').val().trim();

    if (!name) {
        Swal.fire('Lỗi', 'Vui lòng nhập tên thực đơn', 'error');
        return;
    }

    // Prepare details
    const details = existingDetails.map(d => ({
        existing_id: d.id || null,
        week_number: d.week_number,
        day_of_week: d.day_of_week,
        menu_time_id: d.menu_time_id,
        detail: typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail),
        note: d.note || null
    }));

    const data = {
        id: menuId || null,
        name,
        description,
        view_type: viewType,
        selected_week: selectedWeek,
        start_date: startDate,
        end_date: endDate,
        status,
        note,
        visible_meal_times: visibleMealTimes,
        visible_categories: visibleCategories,
        details,
        detail_id_remove: detailIdRemove
    };

    $.ajax({
        url: '/menu-build/save',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.success) {
                // Clear unsaved changes flag
                hasUnsavedChanges = false;
                updateSaveButtonState();

                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: response.message
                }).then(() => {
                    window.location.href = '/menu-build/edit/' + response.data.id;
                });
            } else {
                Swal.fire('Lỗi', response.message, 'error');
            }
        },
        error: function (xhr, status, error) {
            Swal.fire('Lỗi', 'Có lỗi xảy ra: ' + error, 'error');
        }
    });
}

/**
 * Get detail
 */
function getDetail(week, day, mealTimeId) {
    const existing = existingDetails.find(d =>
        d.week_number === week &&
        d.day_of_week === day &&
        d.menu_time_id === mealTimeId
    );

    if (existing && existing.detail) {
        if (typeof existing.detail === 'string') {
            try {
                existing.detail = JSON.parse(existing.detail);
            } catch (e) {
                existing.detail = { courses: [], listFood: [] };
            }
        }
        return existing.detail;
    }

    return { courses: [], listFood: [] };
}

/**
 * Mark menu as having unsaved changes
 */
function markAsUnsaved() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
}

/**
 * Update save button state to show unsaved indicator
 */
function updateSaveButtonState() {
    const saveBtn = $('#saveMenuBtn');
    if (hasUnsavedChanges) {
        saveBtn.removeClass('btn-primary').addClass('btn-warning');
        saveBtn.html('<i class="fas fa-save"></i> Lưu thực đơn (Có thay đổi chưa lưu)');
    } else {
        saveBtn.removeClass('btn-warning').addClass('btn-primary');
        saveBtn.html('<i class="fas fa-save"></i> Lưu thực đơn');
    }
}

/**
 * Show modal asking user to save unsaved changes
 */
function showUnsavedChangesModal(callback) {
    Swal.fire({
        title: 'Thực đơn chưa được lưu',
        text: 'Bạn có thay đổi chưa được lưu. Bạn có muốn lưu thực đơn trước không?',
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Lưu và tiếp tục',
        denyButtonText: '<i class="fas fa-times"></i> Không lưu',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#d33',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            // Save menu first
            saveMenuAndContinue(callback);
        } else if (result.isDenied) {
            // Continue without saving
            if (callback) callback();
        }
        // If cancelled, do nothing
    });
}

/**
 * Save menu and then execute callback
 */
function saveMenuAndContinue(callback) {
    const menuId = $('#menuId').val();
    const name = $('#menuName').val().trim();
    const description = $('#description').val().trim();
    const viewType = $('#viewType').val();
    const selectedWeek = $('#selectedWeek').val();
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const status = $('#status').val();
    const note = $('#note').val().trim();

    if (!name) {
        Swal.fire('Lỗi', 'Vui lòng nhập tên thực đơn', 'error');
        return;
    }

    // Prepare details
    const details = existingDetails.map(d => ({
        existing_id: d.id || null,
        week_number: d.week_number,
        day_of_week: d.day_of_week,
        menu_time_id: d.menu_time_id,
        detail: typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail),
        note: d.note || null
    }));

    const data = {
        id: menuId || null,
        name,
        description,
        view_type: viewType,
        selected_week: selectedWeek,
        start_date: startDate,
        end_date: endDate,
        status,
        note,
        visible_meal_times: visibleMealTimes,
        visible_categories: visibleCategories,
        details,
        detail_id_remove: detailIdRemove
    };

    $.ajax({
        url: '/menu-build/save',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.success) {
                // Clear unsaved changes flag
                hasUnsavedChanges = false;
                updateSaveButtonState();

                // Update menuId if it's a new menu
                if (response.data && response.data.id) {
                    $('#menuId').val(response.data.id);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Đã lưu thành công',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    if (callback) callback();
                });
            } else {
                Swal.fire('Lỗi', response.message, 'error');
            }
        },
        error: function (xhr, status, error) {
            Swal.fire('Lỗi', 'Có lỗi xảy ra: ' + error, 'error');
        }
    });
}

// Biến lưu cấu hình hiển thị cột hiện tại, tương tự menuExample.js
// Cần thiết cho các hàm export chi tiết.
let currentDisplayConfig = {
    visible_columns: ['weight', 'energy', 'protein', 'fat', 'carbohydrate'],
    column_order: ['weight', 'energy', 'protein', 'fat', 'carbohydrate']
};


// ================== EXPORT FUNCTIONS ==================

/**
 * Creates and shows the nutrition component selection modal
 */
function showNutritionComponentModal(exportFunction, weekNumber = null) {
    // Check if modal already exists
    if ($('#nutrition-component-modal').length === 0) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="nutrition-component-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-xl">
                    <div class="modal-content">
                        <button class="modal-btn-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
                        <h3 class="modal-title fs-6 text-uppercase text-center mb-3">Chọn thông số dinh dưỡng xuất Excel</h3>
                        <div class="row">
                            <div class="col-12">
                                <div class="mb-3 d-flex gap-2">
                                    <button type="button" class="btn btn-sm btn-success" onclick="selectAllNutritionFields()">Chọn tất cả</button>
                                    <button type="button" class="btn btn-sm btn-warning" onclick="unselectAllNutritionFields()">Bỏ chọn tất cả</button>
                                    <button type="button" class="btn btn-sm btn-info" onclick="selectBasicNutritionFields()">Chọn cơ bản</button>
                                </div>
                            </div>
                        <div id="nutrition-fields-container">
                            <!-- Nội dung sẽ được tạo động bằng JavaScript -->
                        </div>
                        
                        <div class="row g-2 justify-content-center mt-2">
                            <div class="col-6 col-md-auto">
                                <button class="btn btn-cancel box-btn w-100 text-uppercase" type="button" data-bs-dismiss="modal">Huỷ</button>
                            </div>
                            <div class="col-6 col-md-auto">
                                <button class="btn btn-primary box-btn w-100 text-uppercase" type="button" onclick="confirmExportWithNutritionFields()">Xuất Excel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHtml);
    }

    // Store the export function and week number for later use
    window.currentExportFunction = exportFunction;
    window.currentWeekNumber = weekNumber;

    // Render the nutrition fields
    renderNutritionComponentModal();

    // Show the modal
    $('#nutrition-component-modal').modal('show');
}

/**
 * Renders the nutrition component selection modal content
 */
function renderNutritionComponentModal() {
    if (!availableColumns || Object.keys(availableColumns).length === 0) {
        console.error('Available columns not loaded yet');
        return;
    }

    let html = '<div class="row">';

    // Create basic info columns first
    html += '<div class="col-md-3">';
    html += '<div class="card mb-3">';
    html += '<div class="card-header py-2">';
    html += '<h6 class="m-0 font-weight-bold text-primary">Thông tin cơ bản</h6>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="form-check">';
    html += '<input class="form-check-input nutrition-field" type="checkbox" value="name" id="field_name" checked>';
    html += '<label class="form-check-label" for="field_name">Tên món ăn</label>';
    html += '</div>';
    html += '<div class="form-check">';
    html += '<input class="form-check-input nutrition-field" type="checkbox" value="weight" id="field_weight" checked>';
    html += '<label class="form-check-label" for="field_weight">Khối lượng</label>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Create column groups from availableColumns
    Object.keys(columnGroups).forEach(groupKey => {
        const groupName = columnGroups[groupKey];
        const groupColumns = Object.keys(availableColumns).filter(key =>
            availableColumns[key].group === groupKey
        );

        if (groupColumns.length > 0) {
            const colClass = groupKey === 'minerals' || groupKey === 'amino_acids' || groupKey === 'sugars' ||
                groupKey === 'antioxidants' || groupKey === 'phytonutrients' || groupKey === 'metabolites'
                ? 'col-md-4' : 'col-md-3';

            html += '<div class="' + colClass + '">';
            html += '<div class="card mb-3">';
            html += '<div class="card-header py-2">';
            html += '<h6 class="m-0 font-weight-bold text-primary">' + groupName + '</h6>';
            html += '</div>';
            html += '<div class="card-body">';

            groupColumns.forEach(columnKey => {
                const column = availableColumns[columnKey];
                const isChecked = currentDisplayConfig.visible_columns.includes(columnKey) ? 'checked' : '';
                html += '<div class="form-check">';
                html += '<input class="form-check-input nutrition-field" type="checkbox" value="' + columnKey + '" id="field_' + columnKey + '" ' + isChecked + '>';
                html += '<label class="form-check-label" for="field_' + columnKey + '">' + column.label + ' - ' + columnKey + '</label>';
                html += '</div>';
            });

            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
    });

    html += '</div>';

    $('#nutrition-fields-container').html(html);
}

/**
 * Select all nutrition fields
 */
function selectAllNutritionFields() {
    $('.nutrition-field').prop('checked', true);
}

/**
 * Unselect all nutrition fields
 */
function unselectAllNutritionFields() {
    $('.nutrition-field').prop('checked', false);
}

/**
 * Select basic nutrition fields
 */
function selectBasicNutritionFields() {
    $('.nutrition-field').prop('checked', false);

    // Select basic fields
    $('#field_name').prop('checked', true);
    $('#field_weight').prop('checked', true);

    // Select default nutrition fields from availableColumns
    Object.keys(availableColumns).forEach(key => {
        if (availableColumns[key].default) {
            $('#field_' + key).prop('checked', true);
        }
    });
}

/**
 * Confirm export with selected nutrition fields
 */
function confirmExportWithNutritionFields() {
    // Get selected fields
    const selectedFields = [];
    $('.nutrition-field:checked').each(function () {
        selectedFields.push($(this).val());
    });

    if (selectedFields.length === 0) {
        Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 1 thông số để xuất!', 'error');
        return;
    }

    // Update currentDisplayConfig with selected fields (excluding basic fields)
    const nutritionFields = selectedFields.filter(field => field !== 'name' && field !== 'weight');
    currentDisplayConfig.visible_columns = nutritionFields;
    currentDisplayConfig.column_order = nutritionFields;

    // Close modal
    $('#nutrition-component-modal').modal('hide');

    // Execute the stored export function
    if (window.currentExportFunction) {
        window.currentExportFunction(window.currentWeekNumber);
    }
}

/**
 * Gathers menu data for export, structured similarly to menuExamine.
 * Can filter by a specific week.
 * @param {number|null} weekNumber - The week to filter by (1-4). If null, gets all weeks.
 * @returns {Array} An array of menu-like objects.
 */
function getMenuDataForExport(weekNumber = null) {
    const menuName = $('#menuName').val() || 'Thực đơn';

    // Helper to create a menu object for a week
    const createWeekMenu = (week) => {
        const weekDetails = existingDetails.filter(d => d.week_number === week);
        if (weekDetails.length === 0) return null;

        const reconstructedDetail = [];

        daysOfWeek.forEach(day => {
            visibleMealTimes.forEach(mtId => {
                const detail = weekDetails.find(d => d.day_of_week === day.value && d.menu_time_id === mtId);
                if (detail && detail.detail && detail.detail.listFood && detail.detail.listFood.length > 0) {
                    const mealTimeInfo = menuTimes.find(mt => mt.id === mtId);
                    reconstructedDetail.push({
                        id: mtId,
                        // Add day to name to make it unique for the export logic
                        name: `${day.label} - ${mealTimeInfo.name}`,
                        courses: detail.detail.courses,
                        listFood: detail.detail.listFood
                    });
                }
            });
        });

        return {
            name: `${menuName} - Tuần ${week}`,
            detail: reconstructedDetail
        };
    };

    if (weekNumber) {
        const menu = createWeekMenu(weekNumber);
        return menu ? [menu] : [];
    } else {
        const allMenus = [];
        for (let i = 1; i <= 4; i++) {
            const menu = createWeekMenu(i);
            if (menu) allMenus.push(menu);
        }
        return allMenus;
    }
}


/**
 * Xuất thực đơn ra file Excel - mỗi ngày là 1 sheet
 * @param {number|null} weekNumber - The week to export (1-4). If null, exports current week.
 */
function exportMenuExcel(weekNumber = null) {
    try {
        // Lấy dữ liệu cho tuần hiện tại hoặc tuần được chỉ định
        const viewType = $('#viewType').val();
        const currentWeek = parseInt($('#selectedWeek').val()) || 1;
        const targetWeek = weekNumber || currentWeek;

        // Lấy dữ liệu cho tuần cụ thể
        const menuData = getMenuDataForExport(targetWeek);

        if (!menuData || menuData.length === 0) {
            Swal.fire('Lỗi', 'Không có dữ liệu thực đơn để xuất!', 'error');
            return;
        }
        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            Swal.fire('Lỗi', 'Không tìm thấy thư viện ExcelJS!', 'error');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        // Group data by day
        const groupedByDay = {};
        menuData[0].detail.forEach(item => {
            // Extract day from the name (e.g., "Thứ 2 - Bữa sáng" -> "Thứ 2")
            const dayName = item.name.split(' - ')[0];
            if (!groupedByDay[dayName]) {
                groupedByDay[dayName] = [];
            }
            groupedByDay[dayName].push(item);
        });

        // Create a sheet for each day
        Object.entries(groupedByDay).forEach(([dayName, dayMeals], dayIndex) => {
            let sheetName = dayName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            // Add number to sheet name if there are multiple days with same name
            if (Object.keys(groupedByDay).filter(d => d === dayName).length > 1) {
                sheetName = `${dayName}_${dayIndex + 1}`.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            }
            const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 30 } });

            ws.mergeCells(1, 1, 1, 3);
            const titleCell = ws.getCell(1, 1);
            titleCell.value = `${dayName} - ${menuData[0].name}`;
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.font = { bold: true, size: 18 };

            ws.getRow(2).values = ['Giờ ăn', 'Thực phẩm', 'Khối lượng (g)'];
            ['A2', 'B2', 'C2'].forEach((addr) => {
                const cell = ws.getCell(addr);
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            let rowIndex = 3;
            dayMeals.forEach(menuTime => {
                const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
                const listFood = menuTime.listFood || [];

                if (listFood.length === 0) return;

                const defaultCourse = { id: 0, name: 'Món ăn chung' };
                const validCourses = courses.filter(c => c && c.id !== null && c.id !== undefined);
                const foodsByCourse = {};

                listFood.forEach(food => {
                    let courseId = food.course_id;
                    if (courseId === null || courseId === undefined || !validCourses.some(c => c.id == courseId)) {
                        courseId = 0;
                    }
                    if (!foodsByCourse[courseId]) foodsByCourse[courseId] = [];
                    foodsByCourse[courseId].push(food);
                });

                let totalRows = 0;
                Object.keys(foodsByCourse).forEach(courseId => {
                    totalRows += 1 + foodsByCourse[courseId].length;
                });

                if (totalRows > 0) {
                    ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
                    const aCell = ws.getCell(rowIndex, 1);
                    aCell.value = menuTime.name.split(' - ')[1] || menuTime.name; // Only meal time, not day
                    aCell.font = { bold: true };
                    aCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
                }

                Object.keys(foodsByCourse).forEach(courseId => {
                    const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                    const courseName = course ? course.name : 'Món ăn chung';
                    const foods = foodsByCourse[courseId];

                    ws.getCell(rowIndex, 2).value = courseName || '';
                    ws.getCell(rowIndex, 2).font = { bold: true };
                    ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                    rowIndex += 1;

                    foods.forEach(food => {
                        ws.getCell(rowIndex, 2).value = food.name || '';
                        ws.getCell(rowIndex, 3).value = food.weight || 0;
                        ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                        ws.getCell(rowIndex, 3).alignment = { horizontal: 'center', vertical: 'middle' };
                        rowIndex += 1;
                    });
                });
            });

            ws.columns = [{ width: 20 }, { width: 40 }, { width: 15 }];
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_Tuan_${targetWeek}_${timestamp}.xlsx`;
        wb.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Swal.fire('Thành công', `Đã xuất thực đơn tuần ${targetWeek} ra file Excel (mỗi ngày là 1 sheet)!`, 'success');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            Swal.fire('Lỗi', 'Có lỗi khi xuất file Excel.', 'error');
        });

    } catch (error) {
        console.error('Error exporting menu to Excel:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất file Excel: ' + error.message, 'error');
    }
}

/**
 * Xuất thực đơn ra file Excel với cột % ăn được và khối lượng cần mua - mỗi ngày là 1 sheet
 * @param {number|null} weekNumber - The week to export (1-4). If null, exports current week.
 */
function exportMenuExcelWithPurchase(weekNumber = null) {
    try {
        // Lấy dữ liệu cho tuần hiện tại hoặc tuần được chỉ định
        const viewType = $('#viewType').val();
        const currentWeek = parseInt($('#selectedWeek').val()) || 1;
        const targetWeek = weekNumber || currentWeek;

        // Lấy dữ liệu cho tuần cụ thể
        const menuData = getMenuDataForExport(targetWeek);

        if (!menuData || menuData.length === 0) {
            Swal.fire('Lỗi', 'Không có dữ liệu thực đơn để xuất!', 'error');
            return;
        }
        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            Swal.fire('Lỗi', 'Không tìm thấy thư viện ExcelJS!', 'error');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        // Group data by day
        const groupedByDay = {};
        menuData[0].detail.forEach(item => {
            // Extract day from the name (e.g., "Thứ 2 - Bữa sáng" -> "Thứ 2")
            const dayName = item.name.split(' - ')[0];
            if (!groupedByDay[dayName]) {
                groupedByDay[dayName] = [];
            }
            groupedByDay[dayName].push(item);
        });

        // Create a sheet for each day
        Object.entries(groupedByDay).forEach(([dayName, dayMeals], dayIndex) => {
            let sheetName = dayName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            // Add number to sheet name if there are multiple days with same name
            if (Object.keys(groupedByDay).filter(d => d === dayName).length > 1) {
                sheetName = `${dayName}_${dayIndex + 1}`.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            }
            const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 30 } });

            ws.mergeCells(1, 1, 1, 5);
            const titleCell = ws.getCell(1, 1);
            titleCell.value = `${dayName} - ${menuData[0].name}`;
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.font = { bold: true, size: 18 };

            ws.getRow(2).values = ['Giờ ăn', 'Thực phẩm', 'Khối lượng (g)', '% ăn được', 'Khối lượng cần mua (g)'];
            ['A2', 'B2', 'C2', 'D2', 'E2'].forEach((addr) => {
                const cell = ws.getCell(addr);
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            });

            let rowIndex = 3;
            dayMeals.forEach(menuTime => {
                const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
                const listFood = menuTime.listFood || [];

                if (listFood.length === 0) return;

                const defaultCourse = { id: 0, name: 'Món ăn chung' };
                const validCourses = courses.filter(c => c && c.id !== null && c.id !== undefined);
                const foodsByCourse = {};

                listFood.forEach(food => {
                    let courseId = food.course_id;
                    if (courseId === null || courseId === undefined || !validCourses.some(c => c.id == courseId)) {
                        courseId = 0;
                    }
                    if (!foodsByCourse[courseId]) foodsByCourse[courseId] = [];
                    foodsByCourse[courseId].push(food);
                });

                let totalRows = 0;
                Object.keys(foodsByCourse).forEach(courseId => {
                    totalRows += 1 + foodsByCourse[courseId].length;
                });

                if (totalRows > 0) {
                    ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
                    const aCell = ws.getCell(rowIndex, 1);
                    aCell.value = menuTime.name.split(' - ')[1] || menuTime.name; // Only meal time, not day
                    aCell.font = { bold: true };
                    aCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
                    aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
                }

                Object.keys(foodsByCourse).forEach(courseId => {
                    const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                    const courseName = course ? course.name : 'Món ăn chung';
                    const foods = foodsByCourse[courseId];

                    const courseCell = ws.getCell(rowIndex, 2);
                    courseCell.value = courseName || '';
                    courseCell.font = { bold: true };
                    courseCell.alignment = { horizontal: 'left', vertical: 'middle' };
                    courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
                    rowIndex += 1;

                    foods.forEach(food => {
                        const weight = food.weight || 0;
                        const edible = food.edible || 100;
                        const purchaseWeight = edible > 0 ? (weight * 100 / edible) : weight;

                        ws.getCell(rowIndex, 2).value = food.name || '';
                        ws.getCell(rowIndex, 3).value = weight;
                        ws.getCell(rowIndex, 4).value = edible;
                        ws.getCell(rowIndex, 5).value = parseFloat(purchaseWeight.toFixed(2));

                        ws.getCell(rowIndex, 3).numFmt = '0.00';
                        ws.getCell(rowIndex, 4).numFmt = '0.00';
                        ws.getCell(rowIndex, 5).numFmt = '0.00';

                        rowIndex += 1;
                    });
                });
            });

            ws.columns = [{ width: 20 }, { width: 40 }, { width: 18 }, { width: 15 }, { width: 22 }];
            for (let r = 2; r < rowIndex; r++) {
                for (let c = 1; c <= 5; c++) {
                    ws.getCell(r, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }
            }
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_Mua_Hang_Tuan_${targetWeek}_${timestamp}.xlsx`;
        wb.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Swal.fire('Thành công', `Đã xuất thực đơn mua hàng tuần ${targetWeek} ra file Excel (mỗi ngày là 1 sheet)!`, 'success');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            Swal.fire('Lỗi', 'Có lỗi khi xuất file Excel.', 'error');
        });

    } catch (error) {
        console.error('Error exporting menu with purchase to Excel:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất file Excel: ' + error.message, 'error');
    }
}

/**
 * Xuất bảng thực đơn ra file Excel với đầy đủ thông tin dinh dưỡng - mỗi ngày là 1 sheet
 * @param {number|null} weekNumber - The week to export (1-4). If null, exports current week.
 */
function exportMenuTableExcel(weekNumber = null) {
    // Show nutrition component selection modal first
    showNutritionComponentModal(exportMenuTableExcelWithSelectedComponents, weekNumber);
}

/**
 * Xuất bảng thực đơn ra file Excel với các thành phần dinh dưỡng đã chọn
 * @param {number|null} weekNumber - The week to export (1-4). If null, exports current week.
 */
function exportMenuTableExcelWithSelectedComponents(weekNumber = null) {
    try {
        // Lấy dữ liệu cho tuần hiện tại hoặc tuần được chỉ định
        const viewType = $('#viewType').val();
        const currentWeek = parseInt($('#selectedWeek').val()) || 1;
        const targetWeek = weekNumber || currentWeek;

        // Lấy dữ liệu cho tuần cụ thể
        const menuData = getMenuDataForExport(targetWeek);

        if (!menuData || menuData.length === 0) {
            Swal.fire('Lỗi', 'Không có dữ liệu thực đơn để xuất!', 'error');
            return;
        }

        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            Swal.fire('Lỗi', 'Không tìm thấy thư viện ExcelJS!', 'error');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        // Group data by day
        const groupedByDay = {};
        menuData[0].detail.forEach(item => {
            // Extract day from the name (e.g., "Thứ 2 - Bữa sáng" -> "Thứ 2")
            const dayName = item.name.split(' - ')[0];
            if (!groupedByDay[dayName]) {
                groupedByDay[dayName] = [];
            }
            groupedByDay[dayName].push(item);
        });

        // Create a sheet for each day
        Object.entries(groupedByDay).forEach(([dayName, dayMeals], dayIndex) => {
            let sheetName = dayName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            // Add number to sheet name if there are multiple days with same name
            if (Object.keys(groupedByDay).filter(d => d === dayName).length > 1) {
                sheetName = `${dayName}_${dayIndex + 1}`.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            }

            // Create menu object for this day only
            const dayMenu = {
                name: `${dayName} - ${menuData[0].name}`,
                detail: dayMeals
            };

            createMenuWorksheet(wb, dayMenu, sheetName);
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_Chi_Tiet_Tuan_${targetWeek}_${timestamp}.xlsx`;

        wb.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Swal.fire('Thành công', `Đã xuất bảng thực đơn chi tiết tuần ${targetWeek} ra file Excel (mỗi ngày là 1 sheet)!`, 'success');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            Swal.fire('Lỗi', 'Có lỗi khi xuất file Excel.', 'error');
        });

    } catch (error) {
        console.error('Error exporting menu table to Excel:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất file Excel: ' + error.message, 'error');
    }
}

/**
 * Xuất TẤT CẢ các tuần ra file Excel, mỗi tuần là một sheet
 */
function exportAllWeeksTableExcel() {
    try {
        const menuData = getMenuDataForExport(); // Get all weeks

        if (!menuData || menuData.length === 0) {
            Swal.fire('Lỗi', 'Không có thực đơn nào để xuất!', 'error');
            return;
        }

        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            Swal.fire('Lỗi', 'Không tìm thấy thư viện ExcelJS!', 'error');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        let createdSheets = 0;
        menuData.forEach(menu => {
            if (menu && menu.detail && menu.detail.length > 0) {
                createMenuWorksheet(wb, menu);
                createdSheets++;
            }
        });

        if (createdSheets === 0) {
            Swal.fire('Lỗi', 'Không có thực đơn nào có dữ liệu để xuất!', 'error');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Tat_Ca_Cac_Tuan_${timestamp}.xlsx`;

        wb.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Swal.fire('Thành công', `Đã xuất ${createdSheets} tuần ra file Excel!`, 'success');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            Swal.fire('Lỗi', 'Có lỗi khi xuất file Excel.', 'error');
        });

    } catch (error) {
        console.error('Error exporting all weeks to Excel:', error);
        Swal.fire('Lỗi', 'Có lỗi xảy ra khi xuất file Excel: ' + error.message, 'error');
    }
}


/**
 * Tạo worksheet cho một thực đơn với đầy đủ thông tin dinh dưỡng
 * @param {Object} wb - ExcelJS Workbook
 * @param {Object} menu - Menu object cần xuất
 * @param {string} [customSheetName] - Tên sheet tùy chọn
 */
function createMenuWorksheet(wb, menu, customSheetName = null) {
    if (!menu || !menu.detail || menu.detail.length === 0) {
        return null;
    }

    let sheetName = customSheetName || menu.name || 'Thực đơn';
    sheetName = sheetName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
    const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 25 } });

    const numNutritionCols = currentDisplayConfig.visible_columns.length;
    const totalCols = 2 + numNutritionCols;

    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = menu.name || 'THỰC ĐƠN CHI TIẾT';
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.font = { bold: true, size: 16 };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    let headerRow = ws.getRow(2);
    let headerValues = ['Bữa ăn', 'Tên món ăn'];
    currentDisplayConfig.visible_columns.forEach(columnKey => {
        const column = availableColumns[columnKey];
        if (column) headerValues.push(column.label);
    });
    headerRow.values = headerValues;

    for (let i = 1; i <= totalCols; i++) {
        const cell = headerRow.getCell(i);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }

    let rowIndex = 3;
    let allFoods = [];

    menu.detail.forEach(menuTime => {
        const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
        const listFood = menuTime.listFood || [];
        if (listFood.length === 0) return;

        if (courses.length === 0) courses.push({ id: 1, name: '' });

        let totalRows = courses.length + listFood.length;
        const startRow = rowIndex;

        ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
        const mealCell = ws.getCell(rowIndex, 1);
        mealCell.value = menuTime.name || '';
        mealCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
        mealCell.font = { bold: true, size: 12 };
        mealCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };

        courses.forEach(course => {
            const courseFoods = listFood.filter(f => f.course_id == course.id);
            const courseRow = ws.getRow(rowIndex);
            courseRow.getCell(2).value = course.name || '';
            courseRow.getCell(2).font = { bold: true, italic: true };
            courseRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
            courseRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

            for (let i = 3; i <= totalCols; i++) {
                courseRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
            }
            rowIndex++;

            courseFoods.forEach(food => {
                const foodRow = ws.getRow(rowIndex);
                foodRow.getCell(2).value = food.name || '';
                foodRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

                let colIndex = 3;
                currentDisplayConfig.visible_columns.forEach(columnKey => {
                    let value = food[columnKey];
                    value = (value !== null && value !== undefined && value !== '' && !isNaN(value)) ? parseFloat(value) : 0;
                    foodRow.getCell(colIndex).value = value;
                    foodRow.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle' };
                    if (typeof value === 'number') foodRow.getCell(colIndex).numFmt = '0.0';
                    colIndex++;
                });
                allFoods.push(food);
                rowIndex++;
            });
        });

        for (let r = startRow; r < rowIndex; r++) {
            for (let c = 1; c <= totalCols; c++) {
                ws.getCell(r, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        }
    });

    if (allFoods.length > 0) {
        const totals = {};
        currentDisplayConfig.visible_columns.forEach(columnKey => { totals[columnKey] = 0; });
        allFoods.forEach(food => {
            currentDisplayConfig.visible_columns.forEach(columnKey => {
                if (food[columnKey] !== undefined && food[columnKey] !== null && food[columnKey] !== '') {
                    totals[columnKey] += parseFloat(food[columnKey]) || 0;
                }
            });
        });

        const totalRow = ws.getRow(rowIndex);
        totalRow.getCell(1).value = 'TỔNG';
        totalRow.getCell(1).font = { bold: true, size: 12 };
        totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

        let colIndex = 3;
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            const cell = totalRow.getCell(colIndex);
            if (columnKey !== 'weight') {
                const total = totals[columnKey] || 0;
                cell.value = total;
                if (typeof total === 'number') cell.numFmt = '0.00';
            }
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            colIndex++;
        });

        for (let c = 1; c <= totalCols; c++) {
            totalRow.getCell(c).border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
        }
        rowIndex++;

        const hasEnergy = currentDisplayConfig.visible_columns.includes('energy');
        const hasProtein = currentDisplayConfig.visible_columns.includes('protein');
        const hasFat = currentDisplayConfig.visible_columns.includes('fat');
        const hasCarb = currentDisplayConfig.visible_columns.includes('carbohydrate');

        if (hasEnergy && totals.energy > 0 && (hasProtein || hasFat || hasCarb)) {
            const percentRow = ws.getRow(rowIndex);
            percentRow.getCell(1).value = '% Năng lượng';
            percentRow.getCell(1).font = { bold: true, italic: true };
            percentRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            percentRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
            percentRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

            let colIndex = 3;
            currentDisplayConfig.visible_columns.forEach(columnKey => {
                const cell = percentRow.getCell(colIndex);
                let percentValue = '';
                if (columnKey === 'protein' && totals.protein) percentValue = ((totals.protein * 4 * 100) / totals.energy).toFixed(2) + '%';
                else if (columnKey === 'fat' && totals.fat) percentValue = ((totals.fat * 9 * 100) / totals.energy).toFixed(2) + '%';
                else if (columnKey === 'carbohydrate' && totals.carbohydrate) percentValue = ((totals.carbohydrate * 4 * 100) / totals.energy).toFixed(2) + '%';
                cell.value = percentValue;
                cell.font = { italic: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
                colIndex++;
            });

            for (let c = 1; c <= totalCols; c++) {
                percentRow.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
            }
        }
    }

    ws.getColumn(1).width = 12;
    ws.getColumn(2).width = 35;
    for (let i = 3; i <= totalCols; i++) {
        ws.getColumn(i).width = 15;
    }
    return ws;
}
