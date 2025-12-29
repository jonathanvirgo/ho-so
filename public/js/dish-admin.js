// JavaScript cho quản lý món ăn
let dishFoods = [];
let foodSelectInstance = null;

// ================== CẤU HÌNH CỘT ==================
// Lưu ý: availableColumns và columnGroups được import từ column-config.js

let currentDisplayConfig = {
    visible_columns: Object.keys(availableColumns).filter(key => availableColumns[key].default)
};

// ================== KHỞI TẠO ==================

$(document).ready(function() {
    initFoodSelect();
    initDishNameAutocomplete();
    
    // Inject column selector UI
    const foodListCard = $('.card-body .table-responsive').closest('.card');
    foodListCard.before('<div id="column_selector_container" class="mb-4"></div>');

    createColumnSelector();
    loadColumnConfig();

    if (window.dishData && window.dishData.isEdit && window.dishData.existingFoods.length > 0) {
        // Tính toán lại tất cả thực phẩm theo trọng lượng thực tế sử dụng hàm tương tự caculateFoodInfo
        dishFoods = window.dishData.existingFoods.map(food => {
            const originalFood = food; // Dữ liệu gốc từ server là trên 100g
            
            if (originalFood) {
                // Tạo object mới từ dữ liệu gốc
                const calculatedFood = { ...originalFood };
                
                // Cập nhật weight mới
                calculatedFood.weight = parseFloat(originalFood.actual_weight) || 0;
                
                // Danh sách các trường KHÔNG cần tính lại (các trường metadata, id, etc.)
                const fieldsToSkip = new Set([
                    'id', 'food_id', 'name', 'ten', 'code', 'type', 'type_year', 'active', 
                    'weight', 'created_by', 'note', 'created_at', 'updated_at', 'dish_id', 'order_index', 'edible'
                ]);
                
                // Tỉ lệ = weight mới / weight gốc (trên 100g)
                const originalWeight = 100; // Dữ liệu gốc từ DB là trên 100g
                const newWeight = parseFloat(originalFood.actual_weight) || 0;
                const ratio = originalWeight > 0 ? newWeight / originalWeight : 0;
                
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
                            calculatedFood[key] = Math.round((value * ratio) * 100) / 100; // Làm tròn 2 chữ số thập phân
                        } else {
                            // Nếu weight gốc = 0, giữ nguyên giá trị gốc
                            calculatedFood[key] = value;
                        }
                    }
                });
                
                return calculatedFood;
            }
            
            return food;
        });
        
        updateFoodTable();
    } else {
        updateFoodTable(); // Initial table render
    }

    $('#foodType, #foodYear').on('change', function() {
        updateFoodSelect();
    });
});


// ================== LOGIC CHÍNH ==================

function addFoodToDish() {
    try {
        if (!foodSelectInstance) {
            toarstError('Lỗi hệ thống: Virtual Select chưa được khởi tạo!');
            return;
        }

        const selectedOptions = foodSelectInstance.getSelectedOptions();
        const weightInput = $('#foodWeight').val();

        if (!selectedOptions || selectedOptions.length === 0) {
            toarstError('Vui lòng chọn thực phẩm!');
            return;
        }
        if (!weightInput || isNaN(parseFloat(weightInput)) || parseFloat(weightInput) <= 0) {
            toarstError('Vui lòng nhập khối lượng hợp lệ!');
            return;
        }

        const weight = parseFloat(weightInput);
        const foodData = selectedOptions.customData;

        if (!foodData || !foodData.id) {
            toarstError('Dữ liệu thực phẩm không hợp lệ!');
            return;
        }
        
        if (dishFoods.findIndex(f => f.food_id == foodData.id) !== -1) {
            toarstWarning(`Thực phẩm "${foodData.name}" đã có trong danh sách!`);
            return;
        }

        const newFood = {
            food_id: foodData.id,
            food_name: foodData.name,
            weight: weight,
        };

        // Gán tất cả các trường dinh dưỡng từ customData
        Object.keys(availableColumns).forEach(key => {
            newFood[key] = foodData[key];
        });
        
        // Tính toán lại dinh dưỡng theo khối lượng nhập vào sử dụng hàm tương tự caculateFoodInfo
        const calculatedFood = calculateNutritionWithCaculateFoodInfo(newFood, weight);

        dishFoods.push(calculatedFood);
        updateFoodTable();

        foodSelectInstance.reset();
        $('#foodWeight').val('');
        
        toarstMessage(`Đã thêm "${foodData.name}" vào món ăn!`);
    } catch (error) {
        console.error('Error in addFoodToDish:', error);
        toarstError('Có lỗi xảy ra khi thêm thực phẩm!');
    }
}

function removeFoodFromDish(index) {
    dishFoods.splice(index, 1);
    updateFoodTable();
    toarstMessage('Đã xóa thực phẩm khỏi món ăn!');
}

function updateFoodWeight(index, newWeight) {
    const newWeightNum = parseFloat(newWeight);
    if (isNaN(newWeightNum) || newWeightNum <= 0) {
        toarstError('Khối lượng phải là số dương!');
        // Revert UI
        const originalWeight = dishFoods[index].weight;
        $(`#dishFoodsBody tr:eq(${index})`).find('.weight-input').val(originalWeight);
        return;
    }

    const food = dishFoods[index];
    const calculatedFood = calculateNutritionWithCaculateFoodInfo(food, newWeightNum);
    dishFoods[index] = calculatedFood;
    
    updateFoodTable();
}

function recalculateAllFoods() {
    dishFoods = dishFoods.map(food => {
        return calculateNutritionWithCaculateFoodInfo(food, food.weight);
    });
}

function calculateNutrition(originalFood, newWeight) {
    const calculatedFood = { ...originalFood };
    calculatedFood.weight = newWeight;
    const ratio = newWeight / 100; // Dữ liệu gốc luôn là trên 100g

    Object.keys(availableColumns).forEach(key => {
        if (key !== 'weight' && key !== 'code' && key !== 'type') {
            const originalValue = parseFloat(originalFood[key]) || 0;
            calculatedFood[key] = originalValue * ratio;
        }
    });
    return calculatedFood;
}

// Hàm tính toán dinh dưỡng theo trọng lượng thực tế sử dụng logic giống caculateFoodInfo trong menuExample.js
function calculateNutritionWithCaculateFoodInfo(originalFood, newWeight) {
    // Kiểm tra dữ liệu đầu vào
    if (!originalFood || isNaN(parseFloat(newWeight))) {
        console.error('Invalid input data for calculateNutritionWithCaculateFoodInfo');
        return originalFood;
    }

    if(typeof newWeight !== 'number') {
        newWeight = parseFloat(newWeight);
    }
    
    // Tỉ lệ = weight mới / weight gốc
    const originalWeight = parseFloat(originalFood.weight) || 100; // Nếu không có weight gốc, giả định là 100g
    const ratio = originalWeight > 0 ? newWeight / originalWeight : 0;
    
    // Tạo object mới từ object gốc
    const newFood = { ...originalFood };
    
    // Cập nhật weight mới
    newFood.weight = newWeight;
    
    // Danh sách các trường KHÔNG cần tính lại (các trường metadata, id, etc.)
    const fieldsToSkip = new Set([
        'id', 'id_food', 'name', 'ten', 'code', 'type', 'type_year', 'active', 
        'weight', 'created_by', 'note', 'created_at', 'updated_at', 'course_id', "edible"
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


// ================== RENDER BẢNG & UI ==================

function updateFoodTable() {
    updateTableHeader();
    updateTableBody();
    updateTotals();
}

function updateTableHeader() {
    const thead = $('#dishFoodsTable thead');
    let headerHtml = '<tr><th width="5%">#</th>';
    // let headerHtml = '';
    currentDisplayConfig.visible_columns.forEach(key => {
        console.log('Adding column to header:', key, availableColumns[key]);
        const column = availableColumns[key];
        if (column) {
            headerHtml += `<th>${column.label}</th>`;
        }
    });

    headerHtml += '<th>Thao tác</th></tr>';
    thead.html(headerHtml);
}

function updateTableBody() {
    const tbody = $('#dishFoodsBody');
    const emptyMessage = $('#emptyMessage');

    if (dishFoods.length === 0) {
        tbody.empty();
        emptyMessage.show();
        return;
    }

    emptyMessage.hide();
    let html = '';

    dishFoods.forEach((food, index) => {
        html += `<tr><td>${index + 1}</td>`;

        currentDisplayConfig.visible_columns.forEach(key => {
            let value = food[key];
            if (key === 'weight') {
                html += `<td><input type="number" class="form-control form-control-sm" value="${value}" onchange="updateFoodWeight(${index}, this.value)" min="0.1" step="0.1"></td>`;
            } else if (key === 'type') {
                 html += `<td><span class="food-type-badge">${textTypeFood(food.type)} (${food.type_year || ''})</span></td>`;
            } else if (key === 'code') {
                html += `<td>${food.code || ''}</td>`;
            } else if (key === 'ten') {
                html += `<td>${food.ten || ''}</td>`;
            } else if (key === 'name') {
                html += `<td>${food.name || ''}</td>`;
            } else {
                html += `<td class="text-center">${(parseFloat(value) || 0).toFixed(2)}</td>`;
            }
        });

        html += `<td><button class="btn btn-sm btn-danger" onclick="removeFoodFromDish(${index})" title="Xóa"><i class="fas fa-trash"></i></button></td>`;
        html += '</tr>';
    });

    tbody.html(html);
}

function setTotalMenu(listFood) {
    try {
        if (listFood.length > 0) {
            // Khởi tạo object để lưu tổng các cột
            const totals = {};
            
            // Tính tổng cho tất cả các cột được hiển thị
            currentDisplayConfig.visible_columns.forEach(columnKey => {
                totals[columnKey] = 0;
            });
            
            // Tính tổng cho từng thực phẩm
            for (let food of listFood) {
                currentDisplayConfig.visible_columns.forEach(columnKey => {
                    if (food[columnKey] !== undefined && food[columnKey] !== null && food[columnKey] !== '') {
                        const value = parseFloat(food[columnKey]) || 0;
                        totals[columnKey] += value;
                    }
                });
            }
            

            // Tạo hoặc cập nhật dòng tổng
            createOrUpdateTotalRow(totals);

            // Tạo hoặc cập nhật dòng phần trăm
            const hasPercentColumns = currentDisplayConfig.visible_columns.some(c => ['protein', 'fat', 'carbohydrate'].includes(c));
            if (totals.energy && totals.energy > 0 && hasPercentColumns) {
                createOrUpdatePercentRow();

                // Cập nhật giá trị phần trăm
                if (totals.protein) {
                    const protein_percent = (totals.protein * 4 * 100) / totals.energy;
                    $('#total_protein_percent').text(protein_percent.toFixed(2) + '%');
                }
                if (totals.fat) {
                    const fat_percent = (totals.fat * 9 * 100) / totals.energy;
                    $('#total_fat_percent').text(fat_percent.toFixed(2) + '%');
                }
                if (totals.carbohydrate) {
                    const carb_percent = (totals.carbohydrate * 4 * 100) / totals.energy;
                    $('#total_carbohydrate_percent').text(carb_percent.toFixed(2) + '%');
                }
            } else {
                $('#percent_row').remove();
            }
            
        } else {
            // Xóa dòng tổng nếu không có thực phẩm
            $('#total_row').remove();
            $('#percent_row').remove();
        }
    } catch (error) {
        console.error('Error in setTotalMenu:', error);
    }
}

// Tạo hoặc cập nhật dòng tổng
function createOrUpdateTotalRow(totals) {
    try {
        // Xóa dòng tổng cũ nếu có
        $('#total_row').remove();
        
        // Tạo dòng tổng mới
        let $totalRow = $('<tr id="total_row" class="table-info font-weight-bold">');

        // Cột số thứ tự (cố định)
        $totalRow.append($('<td class="text-center">').text('TỔNG'));
        
        // Các cột thông tin thực phẩm theo cấu hình
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            let $cell = $('<td class="text-center">');
            
            if (['weight', 'code', 'ten'].includes(columnKey)) {
                // Các cột không tính tổng
                $cell.text('');
            } else {
                const total = totals[columnKey] || 0;
                let displayValue = '';
                
                if (total > 0) {
                    // Hiển thị giá trị có 2 chữ số thập phân
                    displayValue = total.toFixed(2);
                }
                
                $cell.text(displayValue);
                $cell.attr('id', `total_${columnKey}`);
            }
            
            $totalRow.append($cell);
        });
        
        // Cột thao tác (cố định)
        $totalRow.append($('<td class="text-center">').text(''));
        
        // Thêm dòng tổng vào cuối bảng
        $('#dishFoodsTable tbody').append($totalRow);
        
    } catch (error) {
        console.error('Error creating total row:', error);
    }
}

// Tạo hoặc cập nhật dòng phần trăm năng lượng từ Protein/Fat/Carb
function createOrUpdatePercentRow() {
    try {
        // Xóa dòng cũ nếu có
        $('#percent_row').remove();

        // Tạo dòng mới hiển thị phía sau dòng tổng (append trước, sau đó total sẽ append ngay sau)
        let $percentRow = $('<tr id="percent_row" class="table-warning">');

        // Cột số thứ tự (cố định)
        $percentRow.append($('<td class="text-center">').text(''));

        // Các cột theo cấu hình
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            let $cell = $('<td class="text-center">');
            
            if (['protein', 'fat', 'carbohydrate'].includes(columnKey)) {
                $cell.append($('<span>').attr('id', `total_${columnKey}_percent`).addClass('font-weight-bold'));
            } else {
                $cell.html('&nbsp;');
            }
            
            $percentRow.append($cell);
        });

        // Cột thao tác (cố định)
        $percentRow.append($('<td class="text-center">').text(''));

        // Thêm dòng phần trăm vào cuối bảng (sẽ đứng sau dòng tổng)
        $('#dishFoodsTable tbody').append($percentRow);
    } catch (error) {
        console.error('Error creating percent row:', error);
    }
}

function updateTotals() {
    setTotalMenu(dishFoods);
}


// ================== QUẢN LÝ CẤU HÌNH CỘT ==================

function createColumnSelector() {
    const selectorHtml = `
        <div class="card">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-columns"></i> Chọn cột hiển thị</span>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleColumnSelector()">
                        <i class="fas fa-cog"></i>
                    </button>
                </h6>
            </div>
            <div id="column_selector_content" class="card-body" style="display: none;">
                <div id="column_checkboxes"></div>
                <div class="mt-3">
                    <button type="button" class="btn btn-primary btn-sm" onclick="applyColumnConfig()">
                        <i class="fas fa-check"></i> Áp dụng
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="resetColumnConfig()">
                        <i class="fas fa-undo"></i> Mặc định
                    </button>
                </div>
            </div>
        </div>`;
    $('#column_selector_container').html(selectorHtml);
    createColumnCheckboxes();
}

function createColumnCheckboxes() {
    let html = '';
    Object.keys(columnGroups).forEach(groupKey => {
        html += `<div class="mb-3"><h6 class="text-secondary">${columnGroups[groupKey]}</h6>`;
        Object.keys(availableColumns).forEach(columnKey => {
            const column = availableColumns[columnKey];
            if (column.group === groupKey) {
                const isChecked = currentDisplayConfig.visible_columns.includes(columnKey) ? 'checked' : '';
                html += `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input column-checkbox" type="checkbox" 
                               id="col_${columnKey}" value="${columnKey}" ${isChecked}>
                        <label class="form-check-label" for="col_${columnKey}">${column.label}</label>
                    </div>`;
            }
        });
        html += '</div>';
    });
    $('#column_checkboxes').html(html);
}

function toggleColumnSelector() {
    $('#column_selector_content').slideToggle();
}

function applyColumnConfig() {
    const newVisibleColumns = [];
    $('.column-checkbox:checked').each(function() {
        newVisibleColumns.push($(this).val());
    });
    currentDisplayConfig.visible_columns = newVisibleColumns;
    saveColumnConfig();
    updateFoodTable();
    toggleColumnSelector();
    toarstMessage('Đã cập nhật các cột hiển thị.');
}

function resetColumnConfig() {
    currentDisplayConfig.visible_columns = Object.keys(availableColumns).filter(key => availableColumns[key].default);
    saveColumnConfig();
    createColumnCheckboxes(); // Re-render checkboxes with default state
    updateFoodTable();
    toarstMessage('Đã reset cột hiển thị về mặc định.');
}

function saveColumnConfig() {
    try {
        localStorage.setItem('dishAdminColumns', JSON.stringify(currentDisplayConfig));
    } catch (e) {
        console.error("Failed to save column config to localStorage", e);
    }
}

function loadColumnConfig() {
    try {
        const savedConfig = localStorage.getItem('dishAdminColumns');
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            if (parsedConfig.visible_columns) {
                currentDisplayConfig = parsedConfig;
            }
        }
    } catch (e) {
        console.error("Failed to load column config from localStorage", e);
    }
    // Update checkboxes to reflect loaded config
    createColumnCheckboxes();
}


// ================== HÀM PHỤ & KHỞI TẠO CÓ SẴN ==================

function initFoodSelect() {
    try {
        const selectElement = document.querySelector('#foodSelect');
        if (!selectElement) return;
        VirtualSelect.init({
            ele: '#foodSelect',
            placeholder: 'Tìm kiếm thực phẩm...',
            search: true,
            searchPlaceholderText: 'Nhập tên thực phẩm (tối thiểu 2 ký tự)...',
            onServerSearch: function(search, virtualSelect) {
                if (search.length < 2) {
                    virtualSelect.setServerOptions([]);
                    return;
                }
                $.ajax({
                    url: '/api/food-search',
                    type: 'GET',
                    data: {
                        search: search,
                        type: $('#foodType').val(),
                        type_year: $('#foodYear').val()
                    },
                    success: function(response) {
                        virtualSelect.setServerOptions(response.success ? response.data : []);
                    }
                });
            }
        });
        foodSelectInstance = document.querySelector('#foodSelect');
    } catch (error) {
        console.error('Error initializing Virtual Select:', error);
    }
}

function updateFoodSelect() {
    if (foodSelectInstance) {
        foodSelectInstance.reset();
    }
}

function initDishNameAutocomplete() {
    try {
        const dishNameInput = $('#dishName');
        if (dishNameInput.length === 0) {
            console.error('Element #dishName không tồn tại!');
            return;
        }

        // Tạo dropdown container
        const dropdownContainer = $('<div class="dish-suggestions-dropdown"></div>');
        dishNameInput.after(dropdownContainer);

        let searchTimeout;
        let currentSuggestions = [];

        // Xử lý khi user nhập
        dishNameInput.on('input', function() {
            const query = $(this).val().trim();
            
            // Clear timeout cũ
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // Ẩn dropdown nếu query quá ngắn
            if (query.length < 2) {
                hideSuggestions();
                return;
            }

            // Debounce search
            searchTimeout = setTimeout(() => {
                searchDishes(query);
            }, 300);
        });

        // Ẩn dropdown khi click ra ngoài
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#dishName, .dish-suggestions-dropdown').length) {
                hideSuggestions();
            }
        });

        // Xử lý khi focus vào input
        dishNameInput.on('focus', function() {
            const query = $(this).val().trim();
            if (query.length >= 2 && currentSuggestions.length > 0) {
                showSuggestions(currentSuggestions);
            }
        });

        function searchDishes(query) {
            $.ajax({
                url: '/admin/api/search-dishes',
                type: 'GET',
                data: { q: query },
                success: function(response) {
                    if (response.success && response.data && response.data.length > 0) {
                        currentSuggestions = response.data;
                        showSuggestions(currentSuggestions);
                    } else {
                        hideSuggestions();
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Search dishes error:', error);
                    hideSuggestions();
                }
            });
        }

        function showSuggestions(suggestions) {
            let html = '<div class="suggestion-list">';
            suggestions.forEach(dish => {
                const categoryText = dish.category ? ` (${dish.category})` : '';
                const shareText = dish.share == 1 ? '<i class="fas fa-share-alt text-success" title="Được chia sẻ"></i>' : '';
                html += `
                    <div class="suggestion-item" data-dish-name="${dish.name}">
                        <div class="suggestion-name">
                            ${dish.name}${categoryText}
                            ${shareText}
                        </div>
                        <div class="suggestion-description">
                            ${dish.description || 'Không có mô tả'}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            dropdownContainer.html(html).show();

            // Xử lý click vào suggestion
            dropdownContainer.find('.suggestion-item').on('click', function() {
                const dishName = $(this).data('dish-name');
                dishNameInput.val(dishName);
                hideSuggestions();
                
                // Hiển thị thông báo gợi ý
                toarstWarning(`Gợi ý: Món ăn "${dishName}" đã tồn tại. Bạn có thể chỉnh sửa hoặc tạo món ăn mới với tên khác.`);
            });
        }

        function hideSuggestions() {
            dropdownContainer.hide().empty();
        }
    } catch (error) {
        console.error('Error initializing dish name autocomplete:', error);
    }
}

function textTypeFood(type) {
    const types = {
        'raw': 'Sống', 'cooked': 'Chín ĐP', 'cooked_vdd': 'Chín VDD',
        'milk': 'Sữa', 'ddd': 'Dịch DD', 'cake': 'Bánh/kẹo/đồ uống'
    };
    return types[type] || '';
}

function saveDish() {
    try {
        const dishName = $('#dishName').val().trim();
        if (!dishName) {
            toarstError('Vui lòng nhập tên món ăn!');
            return;
        }
        if (dishFoods.length === 0) {
            toarstError('Vui lòng thêm ít nhất một thực phẩm vào món ăn!');
            return;
        }

        // Chỉ gửi những dữ liệu cần thiết để giảm payload
        const foodsToSave = dishFoods.map(food => {
            const savedFood = {
                food_id: food.food_id,
                weight: food.weight,
            };
            // Thêm tất cả các trường dinh dưỡng để server có thể lưu lại
            Object.keys(availableColumns).forEach(key => {
                savedFood[key] = food[key];
            });
            return savedFood;
        });

        const dataToSend = {
            id: $('#dishId').val(),
            name: dishName,
            category: $('#dishCategory').val() || '',
            description: $('#dishDescription').val() || '',
            share: $('#dishShare').is(':checked') ? 1 : 0,
            dish_foods: JSON.stringify(foodsToSave)
        };

        const saveBtn = $('.btn-save-dish');
        saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Đang lưu...');

        $.ajax({
            url: '/admin/mon-an/upsert',
            type: 'POST',
            data: dataToSend,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    toarstMessage(response.message);
                    setTimeout(() => { window.location.href = '/admin/mon-an'; }, 1500);
                } else {
                    toarstError(response.message);
                }
            },
            error: function() {
                toarstError('Có lỗi xảy ra khi lưu món ăn!');
            },
            complete: function() {
                saveBtn.prop('disabled', false).html('<i class="fas fa-save"></i> ' + ($('#dishId').val() ? 'Cập nhật món ăn' : 'Lưu món ăn'));
            }
        });
    } catch (error) {
        console.error('Error in saveDish:', error);
    }
}
