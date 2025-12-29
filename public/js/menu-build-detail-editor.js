/**
 * Menu Build Detail Editor
 * Modal để chỉnh sửa chi tiết món ăn cho một ngày cụ thể
 */

// Global variables for detail editor
let currentEditingDay = null;
let currentMenuBuildId = null;
let menuExamine = []; // Giống khau-phan-an
let allFoods = [];

/**
 * Mở modal chỉnh sửa chi tiết cho một ngày
 */
function openDayDetailEditor(menuBuildId, weekNumber, dayOfWeek, mealType, dayLabel) {
    currentMenuBuildId = menuBuildId;
    currentEditingDay = {
        week_number: weekNumber,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        label: dayLabel
    };

    // Load chi tiết món ăn cho ngày này
    loadDayDetails();

    // Hiển thị modal
    $('#dayDetailModal').modal('show');
}

/**
 * Load chi tiết món ăn cho ngày đang chỉnh sửa
 */
function loadDayDetails() {
    const params = {
        menu_build_id: currentMenuBuildId,
        week_number: currentEditingDay.week_number,
        day_of_week: currentEditingDay.day_of_week
    };

    if (currentEditingDay.meal_type) {
        params.meal_type = currentEditingDay.meal_type;
    }

    $.ajax({
        url: '/api/menu-build/day-detail',
        type: 'GET',
        data: params,
        success: function (response) {
            if (response.success) {
                // Parse detail JSON và hiển thị
                menuExamine = response.data.map(item => {
                    let detail = [];
                    if (item.detail) {
                        try {
                            detail = JSON.parse(item.detail);
                        } catch (e) {
                            console.error('Error parsing detail:', e);
                        }
                    }
                    return {
                        id: item.id,
                        dish_id: item.dish_id,
                        dish_name: item.dish_name,
                        category_key: item.category_key,
                        detail: detail
                    };
                });

                // Update modal title
                $('#dayDetailModalLabel').text(`Chỉnh sửa chi tiết - ${currentEditingDay.label}`);

                // Render table
                renderDetailTable();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: response.message
                });
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading day details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tải chi tiết món ăn'
            });
        }
    });
}

/**
 * Render bảng chi tiết món ăn
 */
function renderDetailTable() {
    const tbody = $('#detailTableBody');
    tbody.empty();

    if (menuExamine.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Chưa có món ăn nào. Vui lòng thêm món ăn từ trang chính.
                </td>
            </tr>
        `);
        return;
    }

    menuExamine.forEach((menu, menuIndex) => {
        if (!menu.detail || menu.detail.length === 0) {
            // Món ăn chưa có chi tiết thực phẩm
            const row = $('<tr>');
            row.append(`<td>${menuIndex + 1}</td>`);
            row.append(`<td colspan="4">${menu.dish_name}</td>`);
            row.append(`
                <td>
                    <button class="btn btn-sm btn-primary" onclick="addFoodToMenu(${menuIndex})">
                        <i class="fas fa-plus"></i> Thêm thực phẩm
                    </button>
                </td>
            `);
            tbody.append(row);
        } else {
            // Món ăn đã có chi tiết thực phẩm
            menu.detail.forEach((food, foodIndex) => {
                const row = $('<tr>');

                if (foodIndex === 0) {
                    row.append(`<td rowspan="${menu.detail.length}">${menuIndex + 1}</td>`);
                    row.append(`<td rowspan="${menu.detail.length}">${menu.dish_name}</td>`);
                }

                row.append(`<td>${food.food_name || 'N/A'}</td>`);
                row.append(`<td>${food.quantity || 0}</td>`);
                row.append(`<td>${food.unit || ''}</td>`);
                row.append(`
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editFood(${menuIndex}, ${foodIndex})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="removeFood(${menuIndex}, ${foodIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `);

                tbody.append(row);
            });
        }
    });
}

/**
 * Thêm thực phẩm vào món ăn
 */
function addFoodToMenu(menuIndex) {
    // TODO: Implement food selection modal
    Swal.fire({
        title: 'Chọn thực phẩm',
        html: `
            <select id="foodSelect" class="form-control">
                <option value="">-- Chọn thực phẩm --</option>
            </select>
            <input type="number" id="foodQuantity" class="form-control mt-2" placeholder="Số lượng" />
        `,
        showCancelButton: true,
        confirmButtonText: 'Thêm',
        cancelButtonText: 'Hủy',
        didOpen: () => {
            // Load foods
            loadFoodsForSelect();
        },
        preConfirm: () => {
            const foodId = $('#foodSelect').val();
            const quantity = $('#foodQuantity').val();

            if (!foodId || !quantity) {
                Swal.showValidationMessage('Vui lòng chọn thực phẩm và nhập số lượng');
                return false;
            }

            return { foodId, quantity };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { foodId, quantity } = result.value;
            const food = allFoods.find(f => f.id == foodId);

            if (!menuExamine[menuIndex].detail) {
                menuExamine[menuIndex].detail = [];
            }

            menuExamine[menuIndex].detail.push({
                food_id: parseInt(foodId),
                food_name: food.name,
                quantity: parseFloat(quantity),
                unit: food.unit || 'g'
            });

            renderDetailTable();
        }
    });
}

/**
 * Load danh sách thực phẩm
 */
function loadFoodsForSelect() {
    $.ajax({
        url: '/api/foods-for-select',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                allFoods = response.data;
                const select = $('#foodSelect');
                select.empty().append('<option value="">-- Chọn thực phẩm --</option>');

                response.data.forEach(food => {
                    select.append(`<option value="${food.id}">${food.name}</option>`);
                });
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading foods:', error);
        }
    });
}

/**
 * Sửa thực phẩm
 */
function editFood(menuIndex, foodIndex) {
    const food = menuExamine[menuIndex].detail[foodIndex];

    Swal.fire({
        title: 'Sửa thực phẩm',
        html: `
            <input type="text" id="editFoodName" class="form-control mb-2" value="${food.food_name}" readonly />
            <input type="number" id="editFoodQuantity" class="form-control" value="${food.quantity}" placeholder="Số lượng" />
        `,
        showCancelButton: true,
        confirmButtonText: 'Lưu',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
            const quantity = $('#editFoodQuantity').val();

            if (!quantity) {
                Swal.showValidationMessage('Vui lòng nhập số lượng');
                return false;
            }

            return { quantity };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            menuExamine[menuIndex].detail[foodIndex].quantity = parseFloat(result.value.quantity);
            renderDetailTable();
        }
    });
}

/**
 * Xóa thực phẩm
 */
function removeFood(menuIndex, foodIndex) {
    Swal.fire({
        title: 'Xác nhận xóa',
        text: 'Bạn có chắc chắn muốn xóa thực phẩm này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            menuExamine[menuIndex].detail.splice(foodIndex, 1);
            renderDetailTable();
        }
    });
}

/**
 * Lưu chi tiết món ăn
 */
function saveDayDetails() {
    // Lưu từng món ăn
    const promises = menuExamine.map(menu => {
        const detailJson = JSON.stringify(menu.detail || []);

        return $.ajax({
            url: '/api/menu-build/update-detail-food',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                id: menu.id,
                detail: detailJson
            })
        });
    });

    Promise.all(promises)
        .then(responses => {
            const allSuccess = responses.every(r => r.success);

            if (allSuccess) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Đã lưu chi tiết món ăn',
                    timer: 2000,
                    showConfirmButton: false
                });

                $('#dayDetailModal').modal('hide');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Có lỗi xảy ra khi lưu'
                });
            }
        })
        .catch(error => {
            console.error('Error saving details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể lưu chi tiết món ăn'
            });
        });
}

