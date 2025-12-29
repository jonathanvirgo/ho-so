var dataExamine = {
    foodNameListSearch: []
};

// Hàm lấy patient_id từ URL hoặc biến global
function getPatientIdFromUrl() {
    // Thử lấy từ biến global trước
    if (typeof currentPatientId !== 'undefined' && currentPatientId) {
        return currentPatientId;
    }

    // Nếu không có, lấy từ URL
    const pathArray = window.location.pathname.split('/');
    const detailIndex = pathArray.indexOf('detail');
    if (detailIndex !== -1 && detailIndex + 1 < pathArray.length) {
        return pathArray[detailIndex + 1];
    }
    return null;
}

function chooseMenuExample() {
    try {
        let id = 1;
        if (menuExamine.length > 0) {
            id = menuExamine[menuExamine.length - 1].id + 1;
        }
        let menu_example_id = parseInt($("#menuExample_id").val());
        if (menu_example_id) {
            for (let menu of menuExample) {
                if (menu.id == menu_example_id) {
                    if (menu.detail && menu.detail.length > 0) {
                        for (let meal of menu.detail) {
                            if (!meal.courses) {
                                meal.courses = [{ id: 1, name: meal.name_course || '' }];
                            }
                            if (meal.listFood && meal.listFood.length > 0) {
                                for (let food of meal.listFood) {
                                    if (!food.course_id) food.course_id = 1;
                                }
                            }
                        }
                    }
                    let menuNew = {
                        id: id,
                        name: menu.name_menu,
                        detail: JSON.parse(menu.detail),
                        created_at: new Date().toISOString(), // Thêm ngày tạo
                    };
                    menuExamine.push(menuNew);
                    let newItem = {
                        label: menuNew.name,
                        value: menuNew.id
                    }
                    addNewOptionToVirtualSelect('menu_id', newItem, true);
                    break;
                }
            }
            // if(isGenerate){
            $('#tb_menu tbody').empty();
            $('#tb_menu').show();
            generateTableMenu(id);
            // }
        } else {
            toarstError("Vui lòng chọn mẫu!");
        }
    } catch (error) {
        console.log('error', error);
    }
}

// Danh sách tất cả các trường có thể hiển thị (không bao gồm name vì đã cố định)

function generateTableMenu(menu_id) {
    try {
        if (menu_id) {
            if (menuExamine.length > 0) {
                for (let menu of menuExamine) {
                    if (menu.id == menu_id) {
                        $('#name_menu').val(menu.name);
                        $('#menu_example_note').val(menu.note || '');
                        $('#name_menu_text').text(menu.name);
                        // Kích hoạt chỉnh sửa tên bằng double click
                        enableInlineMenuNameEdit();

                        // Hiển thị thông tin ngày tạo nếu có
                        if (menu.created_at) {
                            const createdDate = new Date(menu.created_at);
                            const formattedDate = createdDate.toLocaleDateString('vi-VN') + ' ' + createdDate.toLocaleTimeString('vi-VN');

                            // Tìm element để hiển thị ngày tạo
                            let dateInfo = $('#menu_date_info');
                            if (dateInfo.length === 0) {
                                // Tạo element mới nếu chưa có
                                $('#name_menu_text').after(`
                                    <small id="menu_date_info" class="text-muted d-block">
                                        <i class="fa fa-clock"></i> Tạo ngày: <span id="menu_created_date"></span>
                                    </small>
                                `);
                                dateInfo = $('#menu_date_info');
                            }
                            $('#menu_created_date').text(formattedDate);
                            dateInfo.show();
                        } else {
                            $('#menu_date_info').hide();
                        }

                        // Tạo UI chọn cột hiển thị
                        createColumnSelector();

                        // Load cấu hình hiển thị cột cho bệnh nhân hiện tại
                        loadTableDisplayConfig();

                        addTemplateListMenuTime(menu.detail);
                        // Sau khi render bảng, đồng bộ selector món
                        try { setupCourseSelectorListeners(); refreshCourseSelector(); } catch (e) { }
                        break;
                    }
                }
            }
            $('#tb_menu').show();
        } else {
            $('#tb_menu').hide();
        }
    } catch (error) {
        console.error('Error in generateTableMenu:', error);
    }
}

// Migrate name_course -> courses[] và gắn course_id cho các food nếu thiếu
function migrateMenuTimeToCourses(menuTime) {
    try {
        if (!menuTime) return;
        if (!Array.isArray(menuTime.courses)) {
            const defaultCourseId = 1;
            const defaultCourseName = menuTime.name_course || '';
            menuTime.courses = [{ id: defaultCourseId, name: defaultCourseName }];
            if (Array.isArray(menuTime.listFood)) {
                menuTime.listFood.forEach(f => {
                    if (f && (f.course_id == null)) f.course_id = defaultCourseId;
                });
            }
        } else {
            const fallbackId = menuTime.courses.length > 0 ? menuTime.courses[0].id : 1;
            if (Array.isArray(menuTime.listFood)) {
                menuTime.listFood.forEach(f => {
                    if (f && (f.course_id == null || !menuTime.courses.some(c => c.id == f.course_id))) {
                        f.course_id = fallbackId;
                    }
                });
            }
        }
    } catch (e) {
        console.error('migrateMenuTimeToCourses error:', e);
    }
}

// ================== COURSE SELECTOR (MÓN ĂN) ==================
// Xây danh sách options cho selector món ăn theo giờ ăn đang chọn
function buildCourseOptions(courses) {
    try {
        if (!Array.isArray(courses)) return [];
        return courses.map(c => ({ label: c && c.name ? c.name : 'Chưa đặt', value: c && c.id != null ? c.id : 1 }));
    } catch (e) {
        return [];
    }
}

// Lấy element VirtualSelect của course
function getCourseSelectElement() {
    return document.querySelector('#course_id');
}

// Lấy giờ ăn đang chọn
function getSelectedMenuTimeId() {
    const el = document.querySelector('#menuTime_id');
    return el && el.value ? el.value : null;
}

// Làm mới danh sách món cho giờ ăn đang chọn
function refreshCourseSelector() {
    try {
        const courseEl = getCourseSelectElement();
        if (!courseEl) return;

        const currentMenu = getCurrentMenu();
        const menuTimeId = getSelectedMenuTimeId();
        if (!currentMenu || !menuTimeId) {
            // Không có dữ liệu để hiển thị
            if (typeof courseEl.virtualSelect !== 'undefined') {
                courseEl.setOptions([]);
                courseEl.reset();
            }
            return;
        }

        const mt = findMenuTimeById(currentMenu, menuTimeId);
        if (!mt) return;

        // Đảm bảo structure courses hợp lệ
        migrateMenuTimeToCourses(mt);

        const options = buildCourseOptions(mt.courses || []);

        // Lưu lại lựa chọn hiện tại nếu có
        const prevVal = courseEl && courseEl.value ? courseEl.value : null;

        if (typeof courseEl.virtualSelect === 'undefined') {
            VirtualSelect.init({
                ele: '#course_id',
                options: options,
                optionsCount: 10,
                placeholder: 'Chọn món trong giờ ăn'
            });
        } else {
            courseEl.setOptions(options);
        }

        // Set lựa chọn: giữ nguyên nếu còn tồn tại, không thì chọn món cuối hoặc đầu
        let targetValue = null;
        if (prevVal && options.some(o => String(o.value) === String(prevVal))) {
            targetValue = prevVal;
        } else if (options.length > 0) {
            targetValue = options[options.length - 1].value; // ưu tiên món vừa thêm gần đây
        }
        if (targetValue != null) {
            courseEl.setValue(targetValue);
        } else {
            courseEl.reset();
        }
    } catch (e) {
        console.error('refreshCourseSelector error:', e);
    }
}

// Gán lắng nghe thay đổi giờ ăn để cập nhật danh sách món
function setupCourseSelectorListeners() {
    try {
        const el = document.querySelector('#menuTime_id');
        if (el) {
            el.addEventListener('change', function () {
                refreshCourseSelector();
            });
        }
    } catch (e) {
        console.error('setupCourseSelectorListeners error:', e);
    }
}

// Biến lưu cấu hình hiển thị cột hiện tại
let currentDisplayConfig = {
    visible_columns: ['weight', 'energy', 'protein', 'fat', 'carbohydrate'],
    column_order: ['weight', 'energy', 'protein', 'fat', 'carbohydrate']
};

// Tạo UI chọn cột hiển thị
function createColumnSelector() {
    try {
        // Kiểm tra xem đã có UI chưa
        if ($('#column_selector_container').length > 0) {
            return;
        }

        // Tạo container cho column selector
        const selectorHtml = `
            <div id="column_selector_container" class="mb-3">
                <div class="card">
                    <div class="card-header">
                        <h6 class="m-0 font-weight-bold d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-2">
                                <i class="fas fa-columns"></i> Chọn cột hiển thị
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-primary float-right" onclick="toggleColumnSelector()">
                                <i class="fas fa-cog"></i>
                            </button>
                        </h6>
                    </div>
                    <div id="column_selector_content" class="card-body" style="display: none;">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Chọn cột hiển thị:</h6>
                                <div id="column_checkboxes"></div>
                            </div>
                            <div class="col-md-6">
                                <h6>Thứ tự cột:</h6>
                                <div id="column_order_list" class="sortable-list"></div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button type="button" class="btn btn-primary btn-sm" onclick="applyColumnConfig()">
                                <i class="fas fa-check"></i> Áp dụng
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="resetColumnConfig()">
                                <i class="fas fa-undo"></i> Đặt lại mặc định
                            </button>
                            <button type="button" class="btn btn-success btn-sm" onclick="saveColumnConfig()">
                                <i class="fas fa-save"></i> Lưu cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Thêm vào trước bảng menu
        $('#tb_menu').before(selectorHtml);

        // Tạo checkboxes cho từng nhóm cột
        createColumnCheckboxes();

    } catch (error) {
        console.error('Error creating column selector:', error);
    }
}

// Tạo checkboxes cho các cột
function createColumnCheckboxes() {
    try {

        let html = '';

        Object.keys(columnGroups).forEach(groupKey => {
            html += `<div class="mb-3">
                <h6 class="text-secondary">${columnGroups[groupKey]}</h6>`;

            Object.keys(availableColumns).forEach(columnKey => {
                const column = availableColumns[columnKey];
                if (column.group === groupKey) {
                    const isChecked = currentDisplayConfig.visible_columns.includes(columnKey) ? 'checked' : '';
                    html += `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input column-checkbox" type="checkbox" 
                                   id="col_${columnKey}" value="${columnKey}" ${isChecked}
                                   onchange="updateColumnOrder()">
                            <label class="form-check-label" for="col_${columnKey}">
                                ${column.label} - ${columnKey}
                            </label>
                        </div>
                    `;
                }
            });

            html += '</div>';
        });

        $('#column_checkboxes').html(html);
        updateColumnOrderList();

    } catch (error) {
        console.error('Error creating column checkboxes:', error);
    }
}

// Cập nhật danh sách thứ tự cột
function updateColumnOrderList() {
    try {
        let html = '<ul class="list-group sortable" id="sortable_columns">';

        currentDisplayConfig.visible_columns.forEach(columnKey => {
            const column = availableColumns[columnKey];
            if (column) {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center" data-column="${columnKey}">
                        <span><i class="fas fa-grip-vertical text-muted mr-2"></i>${column.label}</span>
                        <small class="text-muted">${columnKey}</small>
                    </li>
                `;
            }
        });

        html += '</ul>';
        $('#column_order_list').html(html);

        // Khởi tạo sortable nếu có jQuery UI
        if (typeof $.fn.sortable !== 'undefined') {
            $('#sortable_columns').sortable({
                update: function (event, ui) {
                    updateColumnOrderFromList();
                }
            });
        }

    } catch (error) {
        console.error('Error updating column order list:', error);
    }
}

// Cập nhật thứ tự cột từ danh sách
function updateColumnOrderFromList() {
    try {
        const newOrder = [];
        $('#sortable_columns li').each(function () {
            newOrder.push($(this).data('column'));
        });
        currentDisplayConfig.column_order = newOrder;
        currentDisplayConfig.visible_columns = newOrder;

    } catch (error) {
        console.error('Error updating column order from list:', error);
    }
}

// Cập nhật thứ tự cột khi checkbox thay đổi
function updateColumnOrder() {
    try {
        const checkedColumns = [];
        $('.column-checkbox:checked').each(function () {
            checkedColumns.push($(this).val());
        });

        // Giữ thứ tự hiện tại cho các cột đã chọn, thêm cột mới vào cuối
        const newVisibleColumns = [];

        // Thêm các cột đã có theo thứ tự cũ
        currentDisplayConfig.visible_columns.forEach(col => {
            if (checkedColumns.includes(col)) {
                newVisibleColumns.push(col);
            }
        });

        // Thêm các cột mới
        checkedColumns.forEach(col => {
            if (!newVisibleColumns.includes(col)) {
                newVisibleColumns.push(col);
            }
        });

        currentDisplayConfig.visible_columns = newVisibleColumns;
        currentDisplayConfig.column_order = newVisibleColumns;

        updateColumnOrderList();

    } catch (error) {
        console.error('Error updating column order:', error);
    }
}

// Toggle hiển thị column selector
function toggleColumnSelector() {
    $('#column_selector_content').slideToggle();
}

// Áp dụng cấu hình cột
function applyColumnConfig() {
    try {
        // Rebuild table với cấu hình mới
        rebuildTableWithNewColumns();

        // Ẩn column selector
        $('#column_selector_content').slideUp();

        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Đã áp dụng cấu hình hiển thị cột mới.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error applying column config:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Có lỗi xảy ra khi áp dụng cấu hình.'
        });
    }
}

// Đặt lại cấu hình mặc định
function resetColumnConfig() {
    try {
        // Lấy các cột mặc định
        const defaultColumns = Object.keys(availableColumns).filter(key => availableColumns[key].default);

        currentDisplayConfig = {
            visible_columns: defaultColumns,
            column_order: defaultColumns
        };

        // Cập nhật UI
        $('.column-checkbox').prop('checked', false);
        defaultColumns.forEach(col => {
            $(`#col_${col}`).prop('checked', true);
        });

        updateColumnOrderList();

        Swal.fire({
            icon: 'info',
            title: 'Đã đặt lại!',
            text: 'Cấu hình đã được đặt lại về mặc định.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error resetting column config:', error);
    }
}

// Lưu cấu hình vào database
function saveColumnConfig() {
    try {
        const patientId = getPatientIdFromUrl();
        if (!patientId) {
            Swal.fire({
                icon: 'warning',
                title: 'Cảnh báo!',
                text: 'Không tìm thấy thông tin bệnh nhân để lưu cấu hình.'
            });
            return;
        }

        $.ajax({
            url: '/khau-phan-an/save-table-config',
            method: 'POST',
            data: {
                patient_id: patientId,
                config: JSON.stringify(currentDisplayConfig)
            },
            success: function (response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công!',
                        text: 'Đã lưu cấu hình hiển thị cột.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: response.message || 'Có lỗi xảy ra khi lưu cấu hình.'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Có lỗi xảy ra khi kết nối server.'
                });
            }
        });

    } catch (error) {
        console.error('Error saving column config:', error);
    }
}

// Load cấu hình hiển thị từ database
function loadTableDisplayConfig() {
    try {
        const patientId = getPatientIdFromUrl();
        if (!patientId) {
            return;
        }

        $.ajax({
            url: '/khau-phan-an/get-table-config',
            method: 'GET',
            data: { patient_id: patientId },
            success: function (response) {
                if (response.success && response.data && response.data.table_display_config) {
                    try {
                        const config = JSON.parse(response.data.table_display_config);
                        if (config.visible_columns && config.column_order) {
                            currentDisplayConfig = config;

                            // Cập nhật UI nếu đã tạo
                            if ($('#column_checkboxes').length > 0) {
                                $('.column-checkbox').prop('checked', false);
                                config.visible_columns.forEach(col => {
                                    $(`#col_${col}`).prop('checked', true);
                                });
                                updateColumnOrderList();
                            }
                        }
                    } catch (e) {
                        console.log('Error parsing config, using default');
                    }
                }
            },
            error: function () {
                console.log('Error loading config, using default');
            }
        });

    } catch (error) {
        console.error('Error loading table display config:', error);
    }
}

function addTemplateListMenuTime(listMenuTime) {
    try {
        // Xóa nội dung cũ
        $("#tb_menu").find('tbody').empty();

        // Cập nhật table header với cấu hình hiện tại
        updateTableHeaderWithConfig();

        if (listMenuTime.length > 0) {
            let listFoodTotal = [];
            for (let mt of listMenuTime) {
                const totalRows = computeMenuTimeRowspan(mt);
                const colspanCount = currentDisplayConfig.visible_columns.length + 1; // cột thao tác tách riêng
                if (!mt.courses || mt.courses.length == 0) {
                    mt.courses = [{ id: 1, name: mt.name_course || '' }];
                    mt.listFood.forEach(f => {
                        if (!f.course_id) {
                            f.course_id = 1;
                        }
                    });
                }
                const firstCourse = (mt.courses && mt.courses[0]) ? mt.courses[0] : { id: 1, name: '' };
                const $firstRow = $('<tr/>')
                    .attr('id', 'menu_time_' + mt.id)
                    .addClass('text-center');
                $firstRow.append($('<td/>')
                    .css({ "writing-mode": "vertical-rl", "vertical-align": "middle" })
                    .attr('rowspan', Math.max(totalRows, 1))
                    .text(mt.name)
                );
                $firstRow.append(createCourseHeaderCell(mt.id, firstCourse, colspanCount));
                $firstRow.append($('<td class="text-center"/>').append(
                    $('<button type="button" class="btn btn-sm btn-outline-danger" title="Xóa món"/>')
                        .data('menu_time_id', mt.id)
                        .data('course_id', firstCourse.id)
                        .append($('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width=".8rem" heigh=".8rem"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>'))
                        .click(function () { deleteCourse($(this).data('menu_time_id'), $(this).data('course_id')); })
                ));
                $("#tb_menu").find('tbody').append($firstRow);

                const foodsCourse0 = (mt.listFood || []).filter(f => f.course_id == firstCourse.id);
                foodsCourse0.forEach(food => {
                    const $row = addFoodTemplate(food, mt.id);
                    $("#tb_menu").find('tbody').append($row);
                });
                listFoodTotal.push(...foodsCourse0);

                if (mt.courses && mt.courses.length > 1) {
                    for (let i = 1; i < mt.courses.length; i++) {
                        const course = mt.courses[i];
                        const $courseRow = $('<tr/>')
                            .attr('id', `course_${mt.id}_${course.id}`)
                            .addClass('text-center')
                            .append(createCourseHeaderCell(mt.id, course, colspanCount))
                            .append($('<td class="text-center"/>').append(
                                $('<button type="button" class="btn btn-sm btn-outline-danger" title="Xóa món"/>')
                                    .data('menu_time_id', mt.id)
                                    .data('course_id', course.id)
                                    .append($('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width=".8rem" heigh=".8rem"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>'))
                                    .click(function () { deleteCourse($(this).data('menu_time_id'), $(this).data('course_id')); })
                            ));
                        $("#tb_menu").find('tbody').append($courseRow);

                        const foodsByCourse = (mt.listFood || []).filter(f => f.course_id == course.id);
                        foodsByCourse.forEach(food => {
                            const $row = addFoodTemplate(food, mt.id);
                            $("#tb_menu").find('tbody').append($row);
                        });
                        listFoodTotal.push(...foodsByCourse);
                    }
                }
            }
            setTotalMenu(listFoodTotal);
        }
    } catch (error) {
        console.error('Error in addTemplateListMenuTime:', error);
    }
}

// Tính tổng số hàng (rowspan) cho 1 menuTime theo nhiều course
function computeMenuTimeRowspan(menuTimeObj) {
    try {
        const courses = Array.isArray(menuTimeObj.courses) ? menuTimeObj.courses : [];
        const listFood = menuTimeObj.listFood || [];
        const coursesLength = courses.length == 0 ? 1 : courses.length;
        const foodsLength = listFood.length;
        const total = coursesLength + foodsLength;
        return Math.max(total, 1);
    } catch (e) {
        return 1;
    }
}

// Tạo ô header course (input tên món) với colspan
function createCourseHeaderCell(menuTimeId, course, colspanCount) {
    const $cell = $("<td/>").attr('colspan', colspanCount);
    const $wrapper = $('<div class="d-flex align-items-center gap-2 justify-content-center"></div>');
    const $input = $("<input/>")
        .attr({ type: 'text', value: course.name || '', placeholder: 'Nhập tên món ăn' })
        .addClass('form-control form-control-title p-1')
        .css({ 'text-align': 'center' })
        .data('menu_time_id', menuTimeId)
        .data('course_id', course.id)
        .change(function () {
            const mtId = $(this).data('menu_time_id');
            const cId = $(this).data('course_id');
            changeCourseName(mtId, cId, $(this).val());
        });
    $wrapper.append($input);
    $cell.append($wrapper);
    return $cell;
}

// Cập nhật tên course theo id
function changeCourseName(menuTimeId, courseId, newName) {
    try {
        const menu_id = parseInt($('#menu_id').val());
        for (let menu of menuExamine) {
            if (menu_id == menu.id) {
                for (let mt of menu.detail) {
                    if (mt.id == menuTimeId && Array.isArray(mt.courses)) {
                        for (let c of mt.courses) {
                            if (c.id == courseId) {
                                c.name = newName || '';
                                // Đồng bộ dropdown sau khi thay đổi tên món
                                try { refreshCourseSelector(); } catch (e) { }
                                return;
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('changeCourseName error:', e);
    }
}

// Xóa một món (course) và toàn bộ thực phẩm thuộc món đó
function deleteCourse(menuTimeId, courseId) {
    try {
        const currentMenu = getCurrentMenu();
        if (!currentMenu) return;
        const mt = findMenuTimeById(currentMenu, menuTimeId);
        if (!mt) return;
        // Xóa toàn bộ foods thuộc course
        mt.listFood = (mt.listFood || []).filter(f => f.course_id != courseId);
        // Xóa course
        mt.courses = (mt.courses || []).filter(c => c.id != courseId);
        // Nếu không còn course nào, tạo course mặc định rỗng để người dùng nhập tên
        if (!mt.courses || mt.courses.length === 0) {
            mt.courses = [{ id: 1, name: '' }];
        }
        // Render lại toàn bộ để cập nhật rowspan/tổng
        updateMenuDisplay(currentMenu);
        toarstMessage('Đã xóa món và các thực phẩm liên quan.');
        try { refreshCourseSelector(); } catch (e) { }
    } catch (e) {
        console.error('deleteCourse error:', e);
        toarstError('Không thể xóa món.');
    }
}

// Cập nhật table header với cấu hình cột mới (chỉ cập nhật label, không thay đổi cấu trúc)
function updateTableHeaderWithConfig() {
    try {
        // Tạo header mới với cấu trúc cố định + cột động
        let headerHtml = `
                <tr>
                    <th class="text-center">Bữa ăn</th>
                    <th class="text-center">Tên món ăn</th>
        `;

        // Thêm header cho các cột thông tin thực phẩm được chọn
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            const column = availableColumns[columnKey];
            if (column) {
                headerHtml += `<th class="text-center">${column.label}</th>`;
            }
        });

        headerHtml += `
                    <th class="text-center">Thao tác</th>
                </tr>
        `;

        // Cập nhật header - chỉ thay đổi nội dung trong thead, không tạo thead mới
        $('#tb_menu thead').html(headerHtml);

    } catch (error) {
        console.error('Error updating table header:', error);
    }
}

// Rebuild table với cấu hình cột mới
function rebuildTableWithNewColumns() {
    try {
        const currentMenuId = parseInt($('#menu_id').val());
        if (currentMenuId) {
            // Tìm menu hiện tại và rebuild
            for (let menu of menuExamine) {
                if (menu.id == currentMenuId) {
                    // Rebuild với cấu hình mới
                    addTemplateListMenuTime(menu.detail);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error rebuilding table with new columns:', error);
    }
}

function addTemplateMenuTime(menuTime) {
    try {
        let colspanCount = currentDisplayConfig.visible_columns.length + 1; // +1 cho cột thao tác
        const firstCourse = (menuTime.courses && menuTime.courses[0]) ? menuTime.courses[0] : { id: 1, name: '' };
        const rowspan = computeMenuTimeRowspan(menuTime);
        return $('<tr/>')
            .attr("id", "menu_time_" + menuTime.id)
            .addClass("text-center")
            .append($("<td/>")
                .css({ "writing-mode": "vertical-rl", "vertical-align": "middle" })
                .attr("rowspan", Math.max(rowspan, 1))
                .text(menuTime.name)
            )
            .append(createCourseHeaderCell(menuTime.id, firstCourse, colspanCount));
    } catch (error) {
        console.error('Error in addTemplateMenuTime:', error);
    }
}

function addFoodTemplate(food, menuTime_id) {
    try {
        let $row = $('<tr/>').attr("id", "food_" + menuTime_id + "_" + food.id).attr('data-course-id', food.course_id != null ? food.course_id : '');

        // Cột tên món ăn (cố định)
        $row.append($("<td/>").text(food.name || ''));

        // Các cột thông tin thực phẩm theo cấu hình
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            let $cell = $("<td/>").attr("id", "food_" + menuTime_id + "_" + food.id + "_" + columnKey);

            // Xử lý đặc biệt cho cột weight (có input)
            if (columnKey === 'weight') {
                $cell.append($("<input/>")
                    .attr({ "type": "number", "step": "0.01", "min": "0", "value": food[columnKey] || 0 })
                    .addClass("form-control form-control-title p-1")
                    .data("food_id", food.id)
                    .data("menu_time_id", menuTime_id)
                    .change(function () {
                        const idFood = $(this).data('food_id');
                        const idMenuTime = $(this).data('menu_time_id');
                        const rawVal = $(this).val();
                        const parsed = parseFloat(rawVal);
                        const weight = isNaN(parsed) ? 0 : parsed;

                        changeWeightFood(idFood, idMenuTime, weight);
                    })
                );
            } else {
                // Hiển thị giá trị với định dạng phù hợp
                let value = food[columnKey];
                if (value !== null && value !== undefined && value !== '') {
                    // Làm tròn số thập phân nếu là số
                    if (!isNaN(value) && value !== '') {
                        value = parseFloat(value).toFixed(2);
                        // Loại bỏ số 0 thừa ở cuối
                        value = parseFloat(value).toString();
                    }
                    $cell.text(value);
                } else {
                    $cell.text('0');
                }
            }

            $row.append($cell);
        });

        // Cột thao tác (cố định)
        $row.append($("<td/>")
            .append($(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width=".8rem" heigh=".8rem">
                    <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/>
                </svg>`)
                .css({ "display": 'block' }))
            .css({ "cursor": "pointer", "vertical-align": "middle", "place-items": "center" })
            .data("food_id", food.id)
            .data("menu_time_id", menuTime_id)
            .click(function () {
                let idFood = $(this).data('food_id');
                let idMenuTime = $(this).data('menu_time_id');
                deleteFood(idFood, idMenuTime);
            })
        );

        return $row;

    } catch (error) {
        console.error('Error in addFoodTemplate:', error);
        return $('<tr/>'); // Trả về row trống nếu có lỗi
    }
}

function deleteFood(id_food, menuTime_id) {
    try {
        let menu_id = parseInt($('#menu_id').val());
        for (let menu of menuExamine) {
            if (menu_id == menu.id) {
                let listFoodTotal = [];
                for (let item of menu.detail) {
                    if (menuTime_id == item.id) {
                        // Xóa thực phẩm khỏi danh sách
                        item.listFood = item.listFood.filter(food => food.id !== id_food);

                        // Xóa row khỏi table
                        $('#food_' + menuTime_id + '_' + id_food).remove();

                        // Cập nhật rowspan theo đa course
                        const newRowspan = computeMenuTimeRowspan(item);
                        $('#menu_time_' + menuTime_id + ' td:first-child').attr('rowspan', Math.max(newRowspan, 1));
                    }
                    listFoodTotal.push(...item.listFood);
                }
                setTotalMenu(listFoodTotal);
                break;
            }
        }
    } catch (error) {
        console.error('Error deleting food:', error);
    }
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

            // Tạo hoặc cập nhật dòng phần trăm (hiển thị trước dòng tổng nếu có các cột phù hợp)
            const hasPercentColumns = currentDisplayConfig.visible_columns.some(c => ['protein', 'fat', 'carbohydrate'].includes(c));
            if (totals.energy && totals.energy > 0 && hasPercentColumns) {
                createOrUpdatePercentRow();
            } else {
                $('#percent_row').remove();
            }

            // Cập nhật giá trị phần trăm sau khi hàng đã được tạo
            if (totals.energy && totals.energy > 0) {
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

        // Cột bữa ăn (cố định)
        $totalRow.append($('<td class="text-center">').text('TỔNG'));

        // Cột tên món ăn (cố định)
        $totalRow.append($('<td class="text-center">').text(''));

        // Các cột thông tin thực phẩm theo cấu hình
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            let $cell = $('<td class="text-center">');

            if (columnKey === 'weight') {
                // Cột weight không tính tổng
                $cell.text('');
            } else {
                const total = totals[columnKey] || 0;
                let displayValue = '';

                if (total > 0) {
                    // Làm tròn và hiển thị
                    displayValue = parseFloat(total.toFixed(2)).toString();
                }

                $cell.text(displayValue);
                $cell.attr('id', `total_${columnKey}`);
            }

            $totalRow.append($cell);
        });

        // Cột thao tác (cố định)
        $totalRow.append($('<td class="text-center">').text(''));

        // Thêm dòng tổng vào cuối bảng
        $('#tb_menu tbody').append($totalRow);

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

        // Cột bữa ăn (cố định)
        $percentRow.append($('<td class="text-center">').text(''));

        // Cột tên món ăn (cố định)
        $percentRow.append($('<td class="text-center">').text(''));

        // Các cột theo cấu hình
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            let $cell = $('<td class="text-center">');
            if (columnKey === 'protein') {
                $cell.append($('<span id="total_protein_percent">'));
            } else if (columnKey === 'fat') {
                $cell.append($('<span id="total_fat_percent">'));
            } else if (columnKey === 'carbohydrate') {
                $cell.append($('<span id="total_carbohydrate_percent">'));
            } else {
                $cell.text('');
            }
            $percentRow.append($cell);
        });

        // Cột thao tác (cố định)
        $percentRow.append($('<td class="text-center">').text(''));

        // Thêm dòng phần trăm vào cuối bảng (sẽ đứng trước dòng tổng do tổng được append sau)
        $('#tb_menu tbody').append($percentRow);
    } catch (error) {
        console.error('Error creating percent row:', error);
    }
}

function changeCourse(menuTime_id) {
    try {
        // Deprecated: map về course đầu tiên
        const $input = $('#menu_time_' + menuTime_id).find('input').first();
        const newName = $input.val();
        const menu_id = parseInt($('#menu_id').val());
        for (let menu of menuExamine) {
            if (menu_id == menu.id) {
                for (let item of menu.detail) {
                    if (menuTime_id == item.id) {
                        if (item.courses && item.courses.length > 0) {
                            item.courses[0].name = newName || '';
                        }
                        return;
                    }
                }
            }
        }
    } catch (error) {

    }
}

// Hàm cập nhật note cho menu hiện tại
function updateMenuNote() {
    try {
        let menu_id = parseInt($('#menu_id').val());
        let note = $('#menu_example_note').val();
        for (let menu of menuExamine) {
            if (menu_id == menu.id) {
                menu.note = note;
                break;
            }
        }
    } catch (error) {
        console.error('Error updating menu note:', error);
    }
}

function changeWeightFood(id_food, menuTime_id, value) {
    try {
        let menu_id = parseInt($('#menu_id').val());
        for (let menu of menuExamine) {
            if (menu_id == menu.id) {
                let listFoodTotal = [];
                for (let item of menu.detail) {
                    if (menuTime_id == item.id) {
                        for (let food of item.listFood) {
                            if (id_food == food.id) {
                                // Cập nhật object food với các giá trị dinh dưỡng mới
                                const updatedFood = caculateFoodInfo(food, value);
                                Object.assign(food, updatedFood);

                                // Cập nhật tất cả các cột được hiển thị
                                currentDisplayConfig.visible_columns.forEach(columnKey => {
                                    const $cell = $("#food_" + menuTime_id + "_" + food.id + "_" + columnKey);
                                    if ($cell.length > 0) {
                                        if (columnKey === 'weight') {
                                            // Cập nhật input field weight
                                            $cell.val(food[columnKey]);
                                        } else {
                                            // Cập nhật text cho các cột khác
                                            let value = food[columnKey];
                                            if (value !== null && value !== undefined && value !== '') {
                                                // Làm tròn số thập phân nếu là số
                                                if (!isNaN(value) && value !== '') {
                                                    value = parseFloat(value).toFixed(2);
                                                    // Loại bỏ số 0 thừa ở cuối
                                                    value = parseFloat(value).toString();
                                                }
                                                $cell.text(value);
                                            } else {
                                                $cell.text('0');
                                            }
                                        }
                                    }
                                });

                                break;
                            }
                        }
                    }
                    listFoodTotal.push(...item.listFood);
                }
                setTotalMenu(listFoodTotal);
                break;
            }
        }
    } catch (error) {
        console.error('Error in changeWeightFood:', error);
    }
}


/**
 * Tính toán lại các giá trị dinh dưỡng theo weight mới
 * @param {Object} originalFood - Object thực phẩm gốc
 * @param {number} newWeight - Weight mới cần tính
 * @returns {Object} Object mới với các giá trị đã được tính lại
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

function generateFoodName(id) {
    // Khởi tạo Virtual Select với onServerSearch
    VirtualSelect.init({
        ele: '#' + id,
        options: [],
        search: true,
        searchPlaceholderText: 'Tìm kiếm thực phẩm (tối thiểu 2 ký tự)...',
        placeholder: 'Chọn thực phẩm',
        noOptionsText: 'Không có kết quả được tìm thấy',
        noSearchResultsText: 'Không tìm thấy kết quả phù hợp',
        searchingText: 'Đang tìm kiếm...',
        allowNewOption: false,
        hasOptionDescription: true,
        showSelectedOptionsFirst: true,
        maxValues: 1,
        searchDelay: 500,
        onServerSearch: function (searchValue, virtualSelect) {
            if (searchValue && searchValue.length >= 2) {
                // Sử dụng API chung cho cả admin và user
                const typeSelect = document.querySelector('#food_type');
                const yearSelect = document.querySelector('#food_year');
                let apiUrl = '/api/food-search';

                // Thêm filter parameters
                let params = [`search=${encodeURIComponent(searchValue)}`];
                if (typeSelect && typeSelect.value) {
                    params.push(`type=${typeSelect.value}`);
                }
                if (yearSelect && yearSelect.value) {
                    params.push(`type_year=${yearSelect.value}`);
                }

                if (params.length > 0) {
                    apiUrl += '?' + params.join('&');
                }

                fetch(apiUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {

                            // Chuyển đổi dữ liệu cho Virtual Select
                            const options = data.data.map(item => {
                                const foodData = item.customData;
                                return {
                                    label: item.label,
                                    value: item.value,
                                    description: `Năng lượng: ${foodData.energy || 'N/A'} | Protein: ${foodData.protein || 'N/A'}`,
                                    customData: foodData
                                };
                            });

                            // Cập nhật options cho Virtual Select
                            virtualSelect.setServerOptions(options);
                        } else {
                            console.log('API returned error:', data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Lỗi khi tìm kiếm:', error);
                    });
            } else {
                console.log('Search value too short:', searchValue);
            }
        }
    });

    document.querySelector('#' + id).addEventListener('change', function () {
        if (this.value) {
            const selectedOption = this.getSelectedOptions();
            if (selectedOption && selectedOption.customData) {
                if ($('#food_note').length > 0 && selectedOption.customData.note) {
                    $('#food_note_container').removeClass('d-none');
                    // Use .html() instead of .text() to render HTML from CKEditor
                    $('#food_note').html(selectedOption.customData.note);
                } else {
                    $('#food_note_container').addClass('d-none');
                }
            }
        }
    });
}



// Hàm hỗ trợ để lấy dữ liệu chi tiết của thực phẩm đã chọn
function getSelectedFoodData(id) {
    const virtualSelect = document.querySelector('#' + id).virtualSelect;
    const selectedOptions = virtualSelect.getSelectedOptions();

    if (selectedOptions.length > 0) {
        return selectedOptions[0].customData;
    }
    return null;
}

// Hàm để xóa lựa chọn (tương đương allowClear của Select2)
function clearFoodSelection(id) {
    const virtualSelect = document.querySelector('#' + id).virtualSelect;
    virtualSelect.reset();
}

// Cập nhật dropdown thực phẩm khi thay đổi filter
function updateFoodDropdown(selectId) {
    const virtualSelectElement = document.querySelector('#' + selectId);
    if (virtualSelectElement && virtualSelectElement.virtualSelect) {
        // Reset lựa chọn hiện tại
        virtualSelectElement.virtualSelect.reset();
        // Xóa options hiện tại
        virtualSelectElement.virtualSelect.setServerOptions([]);
    }
}

function showConfirmSaveMenu() {
    try {
        $('#modal-cf-save-menu').modal('show');
    } catch (error) {

    }
}

function saveMenu() {
    try {
        let url = '/khau-phan-an/save-menu';
        let menu_id = parseInt($('#menu_id').val());
        // Lấy patient_id từ URL hoặc từ biến global
        let patient_id = getPatientIdFromUrl();
        let data = {
            patient_id: patient_id,
            note: $('#menu_example_note').val(),
            detail: JSON.stringify(menuExamine)
        };

        $.ajax({
            type: 'POST',
            url: url,
            data: data,
            beforeSend: function () {
                $('#modal-cf-save-menu').modal('hide');
                loading.show();
            },
            success: function (result) {
                loading.hide();
                if (result.success) {
                    toarstMessage('Lưu thực đơn thành công');
                } else {
                    toarstError(result.message);
                }
            },
            error: function (jqXHR, exception) {
                loading.hide();
                ajax_call_error(jqXHR, exception);
            }
        });
    } catch (error) {

    }
}

// Hàm lưu thực đơn dành cho admin
function saveMenuExample() {
    try {
        const menuName = $('#name_menu_text').val() || 'Thực đơn mới';
        const menuNote = $('#menu_example_note').val() || '';

        // Lấy chi tiết thực đơn từ menuExamine
        let detail = [];
        if (window.menuExamine && window.menuExamine.length > 0) {
            detail = window.menuExamine[0].detail || [];
        }

        const data = {
            name_menu: menuName,
            detail: JSON.stringify(detail),
            share: 1, // Mặc định chia sẻ
            note: menuNote
        };

        // Nếu đang edit thì thêm id
        if (window.menuExamine && window.menuExamine.length > 0 && window.menuExamine[0].isExisting) {
            data.id = window.menuExamine[0].id;
        }

        $.ajax({
            type: 'POST',
            url: '/admin/thuc-don-mau/upsert/',
            data: data,
            beforeSend: function () {
                if (typeof loading !== 'undefined') loading.show();
            },
            success: function (result) {
                if (typeof loading !== 'undefined') loading.hide();
                if (result.success) {
                    toarstMessage(result.message || 'Lưu thành công!');

                    // Nếu là tạo mới thì chuyển sang trang edit
                    if (!window.menuExamine || window.menuExamine.length === 0 || !window.menuExamine[0].isExisting) {
                        if (result.data && result.data.id) {
                            setTimeout(() => {
                                window.location.href = '/admin/thuc-don-mau/' + result.data.id;
                            }, 1000);
                        }
                    } else {
                        // Cập nhật thông tin hiện tại
                        window.menuExamine[0].name = menuName;
                        $('#name_menu_text').val(menuName);
                    }
                } else {
                    toarstError(result.message || 'Có lỗi xảy ra khi lưu thực đơn!');
                }
            },
            error: function (jqXHR, exception) {
                if (typeof loading !== 'undefined') loading.hide();
                console.error('Error saving menu:', jqXHR, exception);
                toarstError('Có lỗi xảy ra khi lưu thực đơn!');
            }
        });
    } catch (error) {
        console.error('Error in saveMenuExample:', error);
        toarstError('Có lỗi xảy ra!');
    }
}

// Hàm lưu thực đơn thành thực đơn mẫu
function saveMenuExampleFromMenu() {
    try {
        // Kiểm tra xem có thực đơn mẫu nào đang được chọn không
        const selectedMenuId = $('#menuExample_id').val();
        console.log('current menu', menuExamine);

        if (selectedMenuId) {
            // Nếu đang có thực đơn mẫu được chọn, hỏi có muốn lưu vào thực đơn hiện tại không
            Swal.fire({
                title: 'Lưu thực đơn',
                text: 'Bạn có muốn lưu thực đơn hiện tại vào thực đơn mẫu đã chọn không?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Có, lưu vào thực đơn hiện tại',
                cancelButtonText: 'Tạo thực đơn mẫu mới',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Lưu vào thực đơn mẫu hiện tại
                    saveToExistingMenuExample(selectedMenuId);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // Tạo thực đơn mẫu mới
                    showCreateNewMenuExampleDialog();
                }
            });
        } else {
            // Nếu không có thực đơn mẫu nào được chọn, tạo mới
            showCreateNewMenuExampleDialog();
        }
    } catch (error) {
        console.error('Error in saveMenuExampleFromMenu:', error);
        toarstError('Có lỗi xảy ra!');
    }
}

// Hàm hiển thị dialog tạo thực đơn mẫu mới
function showCreateNewMenuExampleDialog() {
    Swal.fire({
        title: 'Tạo thực đơn mẫu mới',
        text: 'Nhập tên cho thực đơn mẫu:',
        input: 'text',
        inputPlaceholder: 'Tên thực đơn mẫu',
        inputValue: $('#name_menu').val() || '',
        showCancelButton: true,
        confirmButtonText: 'Tạo mới',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Vui lòng nhập tên thực đơn mẫu!';
            }
            return null;
        }
    }).then((result) => {
        console.log("createNewMenuExample result", result);
        if (result.isConfirmed) {
            console.log("createNewMenuExample result.value.trim()", result.value.trim());
            createMenuExample(result.value.trim());
        }
    });
}

// Hàm tạo thực đơn mẫu mới
function createMenuExample(menuName) {
    try {
        console.log("createNewMenuExample menuName", menuName);
        // Lấy chi tiết thực đơn hiện tại
        const currentMenuDetail = getCurrentMenuDetail();
        console.log("currentMenuDetail", currentMenuDetail);
        const data = {
            name_menu: menuName,
            detail: JSON.stringify(currentMenuDetail.detail),
            share: 1, // Mặc định chia sẻ
            note: currentMenuDetail.note
        };
        console.log("createNewMenuExample data", data);
        $.ajax({
            type: 'POST',
            url: '/admin/thuc-don-mau/upsert/',
            data: data,
            beforeSend: function () {
                if (typeof loading !== 'undefined') loading.show();
            },
            success: function (result) {
                console.log("createNewMenuExample", result);
                if (typeof loading !== 'undefined') loading.hide();
                if (result.success) {
                    toarstMessage('Tạo thực đơn mẫu thành công!');

                    // Nếu có data.id, có thể chuyển hướng hoặc cập nhật UI
                    if (result.data && result.data.id) {
                        // Có thể thêm logic cập nhật UI ở đây nếu cần
                    }
                } else {
                    toarstError(result.message || 'Có lỗi xảy ra khi tạo thực đơn mẫu!');
                }
            },
            error: function (jqXHR, exception) {
                if (typeof loading !== 'undefined') loading.hide();
                console.error('Error creating menu example:', jqXHR, exception);
                toarstError('Có lỗi xảy ra khi tạo thực đơn mẫu!');
            }
        });
    } catch (error) {
        console.error('Error in createNewMenuExample:', error);
        toarstError('Có lỗi xảy ra!');
    }
}

// Hàm lưu vào thực đơn mẫu hiện tại
function saveToExistingMenuExample(menuId) {
    try {

        // Tìm thực đơn mẫu hiện tại
        const existingMenu = menuExample.find(menu => menu.id == menuId);
        if (!existingMenu) {
            toarstError('Không tìm thấy thực đơn mẫu!');
            return;
        }
        const currentMenuDetail = getCurrentMenuDetail();
        const data = {
            id: currentMenuDetail.id,
            name_menu: currentMenuDetail.name,
            detail: JSON.stringify(currentMenuDetail.detail),
            share: 1,
            note: currentMenuDetail.note
        };

        $.ajax({
            type: 'POST',
            url: '/admin/thuc-don-mau/upsert/',
            data: data,
            beforeSend: function () {
                if (typeof loading !== 'undefined') loading.show();
            },
            success: function (result) {
                if (typeof loading !== 'undefined') loading.hide();
                if (result.success) {
                    toarstMessage('Cập nhật thực đơn mẫu thành công!');

                    // Cập nhật thông tin hiện tại
                    existingMenu.name = data.name_menu;
                    existingMenu.detail = currentMenuDetail;
                    $('#name_menu_text').text(data.name_menu);

                } else {
                    toarstError(result.message || 'Có lỗi xảy ra khi cập nhật thực đơn mẫu!');
                }
            },
            error: function (jqXHR, exception) {
                if (typeof loading !== 'undefined') loading.hide();
                console.error('Error updating menu example:', jqXHR, exception);
                toarstError('Có lỗi xảy ra khi cập nhật thực đơn mẫu!');
            }
        });
    } catch (error) {
        console.error('Error in saveToExistingMenuExample:', error);
        toarstError('Có lỗi xảy ra!');
    }
}

function getCurrentMenuDetail() {
    let currentMenuId = parseInt($('#menu_id').val());
    let currentMenu = null;
    if (currentMenuId) {
        for (let menu of menuExamine) {
            if (menu.id == currentMenuId) {
                currentMenu = menu;
            }
        }
    }
    return currentMenu;
}

function addMenu() {
    try {
        //thêm menu trống
        let menuNew = addMenuList();
        menuExamine.push(menuNew);

        //thêm vào virtual select
        const newOption = {
            label: menuNew.name,
            value: menuNew.id,
            customData: menuNew
        };

        const element = document.querySelector('#menu_id');
        if (element) {
            element.addOption(newOption);
            element.setValue(menuNew.id);
        }

        resetTemplateMenu();
        //tạo template menu
        generateTableMenu(menuNew.id);
        $('#name_menu_text').val(menuNew.name);
        $('#tb_menu').show();

        // Hiển thị thông tin ngày tạo cho thực đơn mới
        if (menuNew.created_at) {
            const createdDate = new Date(menuNew.created_at);
            const formattedDate = createdDate.toLocaleDateString('vi-VN') + ' ' + createdDate.toLocaleTimeString('vi-VN');

            let dateInfo = $('#menu_date_info');
            if (dateInfo.length === 0) {
                $('#name_menu_text').after(`
                    <small id="menu_date_info" class="text-muted d-block">
                        <i class="fa fa-clock"></i> Tạo ngày: <span id="menu_created_date"></span>
                    </small>
                `);
                dateInfo = $('#menu_date_info');
            }
            $('#menu_created_date').text(formattedDate);
            dateInfo.show();
        }
        // Kích hoạt chỉnh sửa tên bằng double click
        enableInlineMenuNameEdit();
    } catch (error) {
        console.error(error);
    }
}

function addMenuList() {
    let id = 1;
    if (menuExamine.length > 0) {
        id = menuExamine[menuExamine.length - 1].id + 1;
    }
    let menu = {
        id: id,
        name: "Thực đơn " + id,
        detail: [],
        note: '',
        created_at: new Date().toISOString(), // Thêm ngày tạo
    }
    for (let time of listMenuTime) {
        menu.detail.push({
            id: time.id,
            name: time.name,
            courses: [{ id: 1, name: '' }],
            listFood: []
        });
    }
    return menu;
}

function resetTemplateMenu() {
    //Xóa template menu hiện tại
    $('#tb_menu').find('tbody').empty();
    $('#menu_example_note').val('');
    $('#total_energy').text('');
    $('#total_protein').text('');
    $('#total_animal_protein').text('');
    $('#total_lipid').text('');
    $('#total_unanimal_lipid').text('');
    $('#total_carbohydrate').text('');

    $('#total_protein_percent').text('');
    $('#total_lipid_percent').text('');
    $('#total_carbohydrate_percent').text('');
}

// Thêm thực phẩm vào thực đơn
function addFoodToMenu() {
    try {
        // Kiểm tra xem có phải trang admin không
        const isAdminPage = window.location.pathname.includes('/admin/thuc-don-mau/');

        if (isAdminPage) {
            return addFoodToMenuAdmin();
        }

        const menuSelect = document.querySelector('#menu_id');
        const menuTimeSelect = document.querySelector('#menuTime_id');
        const foodSelect = document.querySelector('#food_name');
        const selectedFoodOptions = foodSelect.getSelectedOptions();
        const menu_id = menuSelect.value;
        if (menu_id && menuExamine.length > 0) {
            for (let item of menuExamine) {
                if (menu_id == item.id) {
                    const menuTime_id = menuTimeSelect.value;
                    if (menuTime_id) {
                        if (item.detail.length > 0) {
                            let listFoodTotal = [];
                            for (let menuTime of item.detail) {
                                if (menuTime_id == menuTime.id) {
                                    // Lấy course được chọn nếu có
                                    const courseSelect = document.querySelector('#course_id');
                                    let selectedCourseId = null;
                                    if (courseSelect && courseSelect.value) {
                                        selectedCourseId = parseInt(courseSelect.value);
                                    }
                                    // Đảm bảo cấu trúc courses
                                    migrateMenuTimeToCourses(menuTime);

                                    const selectedFoodValue = foodSelect.value;
                                    if (!selectedFoodValue || !selectedFoodOptions) {
                                        toarstError('Vui lòng chọn thực phẩm!');
                                        return;
                                    }

                                    // Kiểm tra selectedFoodOptions[0] cho user page  
                                    const selectedOption = selectedFoodOptions;
                                    if (!selectedOption || !selectedOption.customData) {
                                        toarstError('Thông tin dinh dưỡng của thực phẩm không có sẵn!');
                                        return;
                                    }

                                    const foodData = selectedOption.customData;
                                    let id = menuTime.listFood.length == 0 ? 1 : menuTime.listFood[menuTime.listFood.length - 1].id + 1;
                                    const weight = parseFloat($('#weight_food').val()) || 0;
                                    if (!Array.isArray(menuTime.courses) || menuTime.courses.length === 0) {
                                        menuTime.courses = [{ id: 1, name: '' }];
                                    }
                                    // Xác định course đích: ưu tiên course đang chọn, fallback course cuối
                                    let targetCourse = null;
                                    if (selectedCourseId != null && menuTime.courses.some(c => c.id == selectedCourseId)) {
                                        targetCourse = menuTime.courses.find(c => c.id == selectedCourseId);
                                    } else {
                                        targetCourse = menuTime.courses[menuTime.courses.length - 1];
                                    }
                                    let food = {
                                        "id": id,
                                        "id_food": isNaN(parseInt(selectedOption.value)) ? 0 : parseInt(selectedOption.value),
                                        "name": selectedOption.label,
                                        "course_id": targetCourse.id,
                                        // Làm phẳng toàn bộ thông tin thực phẩm (spread operator)
                                        ...foodData
                                    }

                                    // Tính toán lại các giá trị dựa trên khối lượng
                                    if (weight > 0) {
                                        const updatedFood = caculateFoodInfo(food, weight);
                                        Object.assign(food, updatedFood);
                                    }
                                    menuTime.listFood.push(food);
                                    let foodTemplate = addFoodTemplate(food, menuTime_id);
                                    const $courseRows = $(`tr[id^="food_${menuTime_id}_"][data-course-id="${targetCourse.id}"]`);
                                    if ($courseRows.length > 0) {
                                        $courseRows.last().after(foodTemplate);
                                    } else {
                                        const headerSelector = `#course_${menuTime_id}_${targetCourse.id}`;
                                        if ($(headerSelector).length > 0) {
                                            $(headerSelector).after(foodTemplate);
                                        } else {
                                            $('#menu_time_' + menuTime_id).after(foodTemplate);
                                        }
                                    }
                                    const newRowspan = computeMenuTimeRowspan(menuTime);
                                    $('#menu_time_' + menuTime_id + ' td:first-child').attr('rowspan', Math.max(newRowspan, 1));
                                }
                                listFoodTotal.push(...menuTime.listFood);
                            }
                            setTotalMenu(listFoodTotal);
                            // Reset food selection
                            foodSelect.reset();
                            $('#weight_food').val('');
                            // Giữ course selector không đổi
                            try { refreshCourseSelector(); } catch (e) { }
                        } else {
                            toarstError('Chưa có dữ liệu giờ ăn!');
                        }
                    } else {
                        toarstError('Bạn chưa chọn giờ ăn!');
                    }
                    break;
                }
            }
        } else {
            toarstError('Tạo mới hoặc chọn menu mẫu!');
        }
    } catch (error) {
        console.error(error);
    }
}

function addNewOptionToVirtualSelect(selectId, newOption, isSetValue = false) {
    const element = document.querySelector('#' + selectId);

    // Kiểm tra xem Virtual Select instance có tồn tại không
    if (typeof (element.virtualSelect) == 'undefined') {
        console.error('Virtual Select instance not found for element:', selectId);
        return;
    }

    // Sử dụng method addOption của Virtual Select
    element.addOption(newOption);
    if (isSetValue) {
        // Set giá trị được chọn (tương đương selected: true)
        element.setValue(newOption.value);
    }
}

function generateMenuExamine() {
    if (menuExamine && menuExamine.length > 0) {
        const menuSelect = document.querySelector('#menu_id');
        if (menuSelect && menuSelect.virtualSelect) {
            // Virtual Select đã được khởi tạo từ view với dữ liệu menuExamine
            // Chỉ cần set value cho item cuối cùng và tính toán tổng

            const lastItem = menuExamine[menuExamine.length - 1];
            if (lastItem) {
                // Set value cho item cuối cùng
                menuSelect.setValue(lastItem.id);
            }

            // Tính toán tổng cho item đầu tiên (nếu có)
            if (menuExamine.length > 0) {
                const firstItem = menuExamine[0];
                let listFoodTotal = [];
                for (let menuTime of firstItem.detail) {
                    if (menuTime.listFood && menuTime.listFood.length > 0) {
                        listFoodTotal.push(...menuTime.listFood);
                    }
                }
                setTotalMenu(listFoodTotal);
            }

            // Generate table với menu đã được chọn
            let menu_id = menuSelect.value || (menuExamine.length > 0 ? menuExamine[0].id : 0);
            generateTableMenu(menu_id);
            enableInlineMenuNameEdit();
        }
    }
}

function showModalDeleteMenuExample(val) {
    try {
        var confirmBox = `
        <div class="modal fade" id="modal_cf_delete_example" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <button class="modal-btn-close btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="text-center mb-2">
                    <i class="fa-solid fa-trash"></i>
                </div>
                <h4 class="modal-title text-center text-tra-lai mb-4">Bỏ thực đơn mẫu</h4>
                <p class="text-body-2 fw-5 text-center mb-4">Bạn muốn bỏ thực đơn mẫu này khỏi phiếu khám không?</p>
                <div class="row g-2 justify-content-center">
                <div class="col-6">
                    <button class="btn btn-cancel box-btn w-100 text-uppercase" type="button" data-bs-dismiss="modal">Không</button>
                </div>
                <div class="col-6">
                    <button onclick="deleteMenuExample(`+ val + `)" class="btn btn-primary box-btn w-100 text-uppercase" type="button" data-bs-dismiss="modal">
                     Đồng ý
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>`;
        $("#modal_confirm_box").html(confirmBox);
        $("#modal_cf_delete_example").modal('show');
    } catch (error) {

    }
}

function deleteMenuExample(id) {
    try {
        // Xóa thực đơn khỏi list
        removeItemArrayByIdObject(menuExamine, id);
        document.querySelector('#menu_id').setOptions(menuExamine.map(s => ({ label: s.name, value: s.id })));
        document.querySelector('#menu_id').reset();
        // nếu có menu trong danh sách thì thêm vào template
        if (menuExamine.length > 0) {
            // Set giá trị mới cho Virtual Select
            const menuSelect = document.querySelector('#menu_id');
            if (menuSelect) {
                menuSelect.setValue(menuExamine[0].id);
            }

            $('#tb_menu tbody').empty();
            $('#tb_menu').show();
            generateTableMenu(menuExamine[0].id);
        } else {
            $('#tb_menu tbody').empty();
            $('#tb_menu').hide();
        }
    } catch (error) {
        console.error('Error in deleteMenuExample:', error);
    }
}

// xóa phần từ object trong mảng bằng id
function removeItemArrayByIdObject(arr, id) {
    var j = 0;
    for (var i = 0, l = arr.length; i < l; i++) {
        if (arr[i].id !== id) {
            arr[j++] = arr[i];
        }
    }
    arr.length = j;
}

// ===================== ADMIN FUNCTIONS =====================

// Hàm thêm thực phẩm dành riêng cho admin
function addFoodToMenuAdmin() {
    try {
        const menuTimeSelect = document.querySelector('#menuTime_id');
        const foodSelect = document.querySelector('#food_name');

        if (!menuTimeSelect || !foodSelect) {
            toarstError('Không tìm thấy form elements!');
            return;
        }

        const selectedFoodOptions = foodSelect.getSelectedOptions();

        if (!selectedFoodOptions) {
            toarstError('Vui lòng chọn thực phẩm!');
            return;
        }

        // Kiểm tra chi tiết selectedFoodOptions[0]
        const selectedOption = selectedFoodOptions;
        if (!selectedOption) {
            toarstError('Dữ liệu thực phẩm được chọn không hợp lệ!');
            return;
        }

        if (!selectedOption.customData) {
            console.error('Missing customData in selected option:', selectedOption);
            toarstError('Thông tin dinh dưỡng của thực phẩm không có sẵn!');
            return;
        }

        const menuTime_id = menuTimeSelect.value;

        if (!menuTime_id) {
            toarstError('Bạn chưa chọn giờ ăn!');
            return;
        }

        // Kiểm tra và khởi tạo menuExamine nếu cần
        if (!window.menuExamine || window.menuExamine.length === 0) {
            createNewMenuExample();

            // Kiểm tra lại sau khi tạo
            if (!window.menuExamine || window.menuExamine.length === 0) {
                toarstError('Không thể khởi tạo thực đơn!');
                return;
            }
        }

        const foodData = selectedOption.customData;
        const weight = parseFloat($('#weight_food').val()) || 0;

        if (weight <= 0) {
            toarstError('Vui lòng nhập khối lượng hợp lệ (> 0)!');
            return;
        }

        // Tìm menu time tương ứng trong menu hiện tại
        let targetMenuTime = null;
        for (let menuTime of window.menuExamine[0].detail) {
            if (menuTime_id == menuTime.id) {
                targetMenuTime = menuTime;
                break;
            }
        }

        // Nếu không tìm thấy, tự động tạo mới
        if (!targetMenuTime) {
            console.log('Menu time not found, creating new one:', menuTime_id);

            // Tìm thông tin menu time từ listMenuTime
            const menuTimeInfo = window.listMenuTime?.find(mt => mt.id == menuTime_id);
            const menuTimeName = menuTimeInfo ? menuTimeInfo.name : `Giờ ăn ${menuTime_id}`;

            targetMenuTime = {
                id: parseInt(menuTime_id),
                name: menuTimeName,
                courses: [{ id: 1, name: '' }],
                listFood: []
            };

            window.menuExamine[0].detail.push(targetMenuTime);
        }
        if (!Array.isArray(targetMenuTime.courses) || targetMenuTime.courses.length === 0) {
            targetMenuTime.courses = [{ id: 1, name: '' }];
        }
        const targetCourse = targetMenuTime.courses.length === 1 ? targetMenuTime.courses[0] : targetMenuTime.courses[targetMenuTime.courses.length - 1];

        // Tạo ID mới cho thực phẩm
        let foodId = targetMenuTime.listFood && targetMenuTime.listFood.length > 0
            ? targetMenuTime.listFood[targetMenuTime.listFood.length - 1].id + 1
            : 1;

        // Tạo object thực phẩm với đầy đủ thông tin
        let food = {
            "id": foodId,
            "id_food": selectedOption.value,
            "name": selectedOption.label,
            "weight": weight,
            "course_id": targetCourse.id,

            // Sao chép tất cả thông tin từ foodData
            ...foodData
        };

        // Tính toán lại các giá trị dựa trên khối lượng
        const updatedFood = caculateFoodInfo(food, weight);
        Object.assign(food, updatedFood);

        // Thêm vào danh sách
        if (!targetMenuTime.listFood) {
            targetMenuTime.listFood = [];
        }
        targetMenuTime.listFood.push(food);

        // Tạo template HTML và thêm vào table
        let foodTemplate = addFoodTemplate(food, menuTime_id);

        // Kiểm tra và thêm vào table
        const tableBody = $('#tb_menu tbody');
        if (tableBody.length === 0) {
            console.error('Table body not found');
            toarstError('Không tìm thấy bảng thực đơn!');
            return;
        }

        // Hiển thị table nếu đang ẩn
        $('#tb_menu').show();

        // Tìm vị trí để insert row mới
        const menuTimeRow = $(`#menu_time_${menuTime_id}`);
        if (menuTimeRow.length === 0) {
            // Nếu không tìm thấy row menu time, rebuild lại toàn bộ table
            addTemplateListMenuTime(window.menuExamine[0].detail);
        } else {
            // Chèn theo course
            const $courseRows = $(`tr[id^="food_${menuTime_id}_"][data-course-id="${targetCourse.id}"]`);
            if ($courseRows.length > 0) {
                $courseRows.last().after(foodTemplate);
            } else {
                const headerSelector = `#course_${menuTime_id}_${targetCourse.id}`;
                if ($(headerSelector).length > 0) {
                    $(headerSelector).after(foodTemplate);
                } else {
                    menuTimeRow.after(foodTemplate);
                }
            }

            // Cập nhật rowspan cho menu time
            const newRowspan = computeMenuTimeRowspan(targetMenuTime);
            menuTimeRow.find('td:first-child').attr('rowspan', Math.max(newRowspan, 1));
        }

        // Tính lại tổng
        let listFoodTotal = [];
        for (let menuTime of window.menuExamine[0].detail) {
            if (menuTime.listFood && menuTime.listFood.length > 0) {
                listFoodTotal.push(...menuTime.listFood);
            }
        }
        setTotalMenu(listFoodTotal);

        // Reset form
        foodSelect.reset();
        $('#weight_food').val('');
        toarstMessage('Đã thêm thực phẩm vào thực đơn!');
    } catch (error) {
        console.error('Lỗi khi thêm thực phẩm:', error);
        toarstError('Có lỗi xảy ra khi thêm thực phẩm: ' + error.message);
    }
}

// Khởi tạo thực đơn admin
function initAdminMenuExample() {

    // Khởi tạo food selection
    generateFoodName("food_name");

    // Khởi tạo dish selection
    generateDishName("dish_name");

    // Khởi tạo thực đơn
    if (window.menuExamine && window.menuExamine.length > 0) {
        // Hiển thị bảng thực đơn nếu có dữ liệu
        $('#tb_menu').show();
        generateTableMenu(window.menuExamine[0].id);
        try { setupCourseSelectorListeners(); refreshCourseSelector(); } catch (e) { }

        // Tính tổng thực phẩm
        let listFoodTotal = [];
        for (let menuTime of window.menuExamine[0].detail) {
            if (menuTime.listFood && menuTime.listFood.length > 0) {
                listFoodTotal.push(...menuTime.listFood);
            }
        }
        setTotalMenu(listFoodTotal);
    } else {
        // Nếu không có dữ liệu, tạo thực đơn trống
        createNewMenuExample();
    }

    // Setup event listeners
    setupMenuNameChange();
}

// Tạo thực đơn mẫu mới cho admin
function createNewMenuExample() {
    try {
        // Tạo cấu trúc thực đơn trống
        let menuDetail = [];
        if (window.listMenuTime && window.listMenuTime.length > 0) {
            menuDetail = window.listMenuTime.map(time => ({
                id: time.id,
                name: time.name,
                courses: [{ id: 1, name: '' }],
                listFood: []
            }));
        }

        const newMenu = {
            id: 1,
            name: 'Thực đơn mới',
            detail: menuDetail,
            note: '',
            created_at: new Date().toISOString(), // Thêm ngày tạo
            created_by: (typeof window.user !== 'undefined' && window.user.id) ? window.user.id : null // Thêm người tạo nếu có
        };

        // Cập nhật global variable
        if (!window.menuExamine) {
            window.menuExamine = [];
        }
        window.menuExamine = [newMenu];

        // Hiển thị bảng
        $('#tb_menu').show();
        generateTableMenu(1);
        try { setupCourseSelectorListeners(); refreshCourseSelector(); } catch (e) { }
    } catch (error) {
        console.error('Lỗi khi tạo thực đơn mới:', error);
    }
}

// Hàm hiển thị modal cập nhật tên thực đơn cho admin
function showUpdateMenuNameModal() {
    Swal.fire({
        title: 'Cập nhật tên thực đơn',
        input: 'text',
        inputValue: window.menuExamine && window.menuExamine.length > 0 ? window.menuExamine[0].name : '',
        inputPlaceholder: 'Nhập tên thực đơn mới',
        showCancelButton: true,
        confirmButtonText: 'Cập nhật',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Vui lòng nhập tên thực đơn!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const newName = result.value.trim();
            $('#name_menu_text').val(newName);

            // Cập nhật menuExamine
            if (window.menuExamine && window.menuExamine.length > 0) {
                window.menuExamine[0].name = newName;
            }

            toarstMessage('Đã cập nhật tên thực đơn. Nhấn "Lưu" để hoàn tất.');
        }
    });
}
// Cập nhật tên thực đơn khi thay đổi input cho admin
function setupMenuNameChange() {
    $('#name_menu_text').on('input', function () {
        const newName = $(this).val();

        // Cập nhật menuExamine
        if (window.menuExamine && window.menuExamine.length > 0) {
            window.menuExamine[0].name = newName || 'Thực đơn mới';
        }
    });
}

// ======= Inline edit tên thực đơn bằng double click =======
function enableInlineMenuNameEdit() {
    try {
        const $title = $('#name_menu_text');
        // Tránh bind nhiều lần
        $title.off('dblclick.inlineEdit');
        $title.on('dblclick.inlineEdit', function () {
            // Nếu input đã tồn tại thì bỏ qua
            if ($('#name_menu_text_input').length > 0) return;

            const currentText = $title.text().trim();
            const $input = $('<input/>')
                .attr({ id: 'name_menu_text_input', type: 'text' })
                .addClass('form-control form-control-title p-1')
                .val(currentText)
                .css({ 'max-width': '420px' });

            // Thay thế nội dung h6 tạm thời bằng input
            $title.empty().append($input);
            $input.focus().select();

            const commit = () => {
                const newName = ($input.val() || '').trim() || currentText;
                // Cập nhật UI
                $title.text(newName);
                $('#name_menu').val(newName);

                // Cập nhật vào menuExamine hiện tại
                const menuSelect = document.querySelector('#menu_id');
                const currentId = menuSelect ? menuSelect.value : null;
                if (currentId && Array.isArray(menuExamine)) {
                    for (let m of menuExamine) {
                        if (m.id == currentId) {
                            m.name = newName;
                            break;
                        }
                    }
                }

                // Cập nhật label trong Virtual Select
                if (menuSelect && typeof menuSelect.setOptions === 'function') {
                    menuSelect.setOptions(menuExamine.map(s => ({ label: s.name, value: s.id })));
                    menuSelect.setValue(currentId);
                }
            };

            $input.on('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    // Hủy thay đổi
                    $title.text(currentText);
                }
            });
            $input.on('blur', function () {
                commit();
            });
        });
    } catch (error) {
        console.error('Error enabling inline menu name edit:', error);
    }
}

// Functions để xử lý món ăn
function generateDishName(id) {
    try {
        // Tự động phát hiện URL phù hợp (admin vs client)
        const isAdminPage = window.location.pathname.includes('/admin/');
        const apiUrl = isAdminPage ? '/admin/api/dishes-for-select' : '/api/dishes-for-select';

        // Lấy category nếu có
        const category = document.getElementById('dish_category') ? document.getElementById('dish_category').value : '';

        // Xây dựng URL với tham số category nếu có
        let requestUrl = apiUrl;
        if (category && category !== '') {
            requestUrl += '?category=' + encodeURIComponent(category);
        }

        // Lấy danh sách món ăn từ server
        $.ajax({
            url: requestUrl,
            type: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    const options = response.data.map(dish => ({
                        label: dish.label,
                        value: dish.value,
                        customData: dish
                    }));

                    // Nếu VirtualSelect đã tồn tại, cập nhật options, nếu không thì khởi tạo mới
                    const element = document.querySelector('#' + id);
                    if (element && element.virtualSelect) {
                        element.setOptions(options);
                        element.reset(); // Reset lựa chọn hiện tại
                    } else {
                        VirtualSelect.init({
                            ele: '#' + id,
                            options: options,
                            optionsCount: 10,
                            placeholder: 'Chọn món ăn',
                            search: true,
                            searchPlaceholderText: 'Tìm kiếm món ăn...',
                            noSearchResultsText: 'Không tìm thấy món ăn nào',
                            noOptionsText: 'Không có món ăn nào'
                        });
                    }
                } else {
                    console.error('Không thể lấy danh sách món ăn:', response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi lấy danh sách món ăn:', error);
            }
        });
    } catch (error) {
        console.error('Error in generateDishName:', error);
    }
}

// Hàm cập nhật dropdown món ăn theo loại món ăn được chọn
function updateDishDropdown() {
    try {
        const dishSelectId = 'dish_name';
        const category = document.getElementById('dish_category') ? document.getElementById('dish_category').value : '';

        // Tự động phát hiện URL phù hợp (admin vs client)
        const isAdminPage = window.location.pathname.includes('/admin/');
        const apiUrl = isAdminPage ? '/admin/api/dishes-for-select' : '/api/dishes-for-select';

        // Xây dựng URL với tham số category nếu có
        let requestUrl = apiUrl;
        if (category && category !== '') {
            requestUrl += '?category=' + encodeURIComponent(category);
        }

        // Lấy danh sách món ăn từ server theo loại đã chọn
        $.ajax({
            url: requestUrl,
            type: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    const options = response.data.map(dish => ({
                        label: dish.label,
                        value: dish.value,
                        customData: dish
                    }));

                    // Cập nhật VirtualSelect với options mới
                    const element = document.querySelector('#' + dishSelectId);
                    if (element && element.virtualSelect) {
                        element.setOptions(options);
                        element.reset(); // Reset lựa chọn hiện tại
                    } else {
                        // Nếu chưa có VirtualSelect, khởi tạo mới
                        VirtualSelect.init({
                            ele: '#' + dishSelectId,
                            options: options,
                            optionsCount: 10,
                            placeholder: 'Chọn món ăn',
                            search: true,
                            searchPlaceholderText: 'Tìm kiếm món ăn...',
                            noSearchResultsText: 'Không tìm thấy món ăn nào',
                            noOptionsText: 'Không có món ăn nào'
                        });
                    }
                } else {
                    console.error('Không thể lấy danh sách món ăn:', response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi lấy danh sách món ăn:', error);
            }
        });
    } catch (error) {
        console.error('Error in updateDishDropdown:', error);
    }
}

// Thêm món ăn vào thực đơn
function addDishToMenu() {
    try {

        const dishMenuTimeSelect = document.querySelector('#dish_menuTime_id');
        const dishSelect = document.querySelector('#dish_name');

        if (!dishMenuTimeSelect || !dishSelect) {
            console.error('Form elements not found:', { dishMenuTimeSelect, dishSelect });
            toarstError('Không tìm thấy form chọn món ăn!');
            return;
        }

        const menuTimeId = dishMenuTimeSelect.value;
        const selectedDishOptions = dishSelect.getSelectedOptions();

        if (!menuTimeId) {
            toarstError('Vui lòng chọn giờ ăn!');
            return;
        }

        if (!selectedDishOptions || selectedDishOptions.length === 0) {
            toarstError('Vui lòng chọn món ăn!');
            return;
        }

        const dishData = selectedDishOptions.customData;
        const dishId = selectedDishOptions.value;

        if (!dishData || !dishId) {
            console.error('Invalid dish data:', { dishData, dishId });
            toarstError('Dữ liệu món ăn không hợp lệ!');
            return;
        }

        // Tự động phát hiện URL phù hợp (admin vs client)
        const isAdminPage = window.location.pathname.includes('/admin/');
        const dishFoodsApiUrl = isAdminPage ? `/admin/api/dish-foods/${dishId}` : `/api/dish-foods/${dishId}`;

        // Lấy chi tiết thực phẩm trong món ăn
        $.ajax({
            url: dishFoodsApiUrl,
            type: 'GET',
            success: function (response) {

                if (response.success && response.data && response.data.length > 0) {
                    // Thêm từng thực phẩm trong món ăn vào thực đơn
                    addDishFoodsToMenu(response.data, menuTimeId, dishData.label);
                } else {
                    console.error('No foods found in dish:', dishData.label, response);
                    const errorMsg = response.message || `Món ăn "${dishData.label}" chưa có thực phẩm nào!`;
                    toarstError(errorMsg);
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX error when fetching dish foods:', {
                    url: dishFoodsApiUrl,
                    xhr: xhr,
                    status: status,
                    error: error,
                    responseText: xhr.responseText
                });
                toarstError(`Có lỗi xảy ra khi lấy thông tin món ăn "${dishData.label}": ${error}`);
            }
        });

    } catch (error) {
        console.error('Error in addDishToMenu:', error);
        toarstError('Có lỗi xảy ra khi thêm món ăn!');
    }
}

// Thêm các thực phẩm từ món ăn vào thực đơn
function addDishFoodsToMenu(dishFoods, menuTimeId, dishName) {
    try {
        // Kiểm tra dữ liệu đầu vào
        if (!dishFoods || dishFoods.length === 0) {
            console.error('No dish foods data provided:', dishFoods);
            toarstError('Không có dữ liệu thực phẩm trong món ăn "' + dishName + '"!');
            return;
        }

        // Lấy menu hiện tại
        const currentMenu = getCurrentMenu();
        if (!currentMenu) {
            toarstError('Không tìm thấy thực đơn hiện tại!');
            return;
        }

        // Tìm menu time tương ứng
        const targetMenuTime = findMenuTimeById(currentMenu, menuTimeId);
        if (!targetMenuTime) {
            toarstError('Không tìm thấy giờ ăn được chọn!');
            return;
        }

        // Tạo course mới cho món ăn này
        const newCourseId = (Array.isArray(targetMenuTime.courses) && targetMenuTime.courses.length > 0)
            ? Math.max.apply(null, targetMenuTime.courses.map(c => c.id)) + 1
            : 1;
        const newCourse = { id: newCourseId, name: dishName || '' };
        if (!Array.isArray(targetMenuTime.courses)) targetMenuTime.courses = [];
        targetMenuTime.courses.push(newCourse);

        // Thêm từng thực phẩm trong món ăn
        let addedFoodsCount = 0;
        for (let dishFood of dishFoods) {
            const food = createFoodFromDishFood(dishFood, dishName, targetMenuTime, newCourseId);
            targetMenuTime.listFood.push(food);
            addedFoodsCount++;
        }

        // Cập nhật giao diện
        updateMenuDisplay(currentMenu);
        resetDishSelection();
        try { refreshCourseSelector(); } catch (e) { }

        toarstMessage(`Đã thêm món "${dishName}" (${addedFoodsCount} thực phẩm) vào thực đơn!`);

    } catch (error) {
        console.error('Error in addDishFoodsToMenu:', error);
        toarstError('Có lỗi xảy ra khi thêm thực phẩm từ món ăn!');
    }
}

/**
 * Lấy menu hiện tại đang được chọn
 */
function getCurrentMenu() {
    const isAdminPage = window.location.pathname.includes('/admin/thuc-don-mau/');
    let menuExamineData = isAdminPage ? window.menuExamine : menuExamine;

    if (!menuExamineData || menuExamineData.length === 0) {
        console.error('No menu examine data found');
        return null;
    }

    if (isAdminPage) {
        return menuExamineData[0];
    } else {
        const menuSelect = document.querySelector('#menu_id');
        const selectedMenuId = menuSelect ? menuSelect.value : null;

        if (selectedMenuId) {
            for (let menu of menuExamineData) {
                if (menu.id == selectedMenuId) {
                    return menu;
                }
            }
        }

        return menuExamineData[0];
    }
}

/**
 * Tìm menu time theo ID
 */
function findMenuTimeById(currentMenu, menuTimeId) {
    for (let menuTime of currentMenu.detail) {
        if (menuTimeId == menuTime.id) {
            return menuTime;
        }
    }
    return null;
}

/**
 * Cập nhật tên món ăn cho menu time
 */
// Deprecated: chuyển sang course riêng
function updateMenuTimeCourse(menuTime, dishName) {
    const newId = (menuTime.courses && menuTime.courses.length > 0) ? Math.max.apply(null, menuTime.courses.map(c => c.id)) + 1 : 1;
    if (!Array.isArray(menuTime.courses)) menuTime.courses = [];
    menuTime.courses.push({ id: newId, name: dishName || '' });
}

/**
 * Tạo object food từ dishFood với tính toán dinh dưỡng động
 */
function createFoodFromDishFood(dishFood, dishName, menuTime, courseId) {
    const foodId = menuTime.listFood.length === 0 ? 1 : menuTime.listFood[menuTime.listFood.length - 1].id + 1;
    const actualWeight = dishFood.actual_weight || 0;

    // Tính toán dinh dưỡng theo tỉ lệ khối lượng
    const calculatedNutrition = caculateFoodInfo(dishFood, actualWeight);

    return {
        "id": foodId,
        id_food: dishFood.food_info_id,
        course_id: courseId != null ? courseId : (menuTime.courses && menuTime.courses[0] ? menuTime.courses[0].id : 1),
        // Tất cả giá trị dinh dưỡng được tính toán động
        ...calculatedNutrition
    };
}

/**
 * Cập nhật giao diện menu
 */
function updateMenuDisplay(currentMenu) {
    // Hiển thị table nếu đang ẩn
    $('#tb_menu').show();

    // Rebuild lại toàn bộ table với dữ liệu mới
    addTemplateListMenuTime(currentMenu.detail);

    // Tính lại tổng từ tất cả menu time
    let listFoodTotal = [];
    for (let menuTime of currentMenu.detail) {
        if (menuTime.listFood && menuTime.listFood.length > 0) {
            listFoodTotal.push(...menuTime.listFood);
        }
    }
    setTotalMenu(listFoodTotal);
}

/**
 * Reset lựa chọn món ăn
 */
function resetDishSelection() {
    const dishSelect = document.querySelector('#dish_name');
    if (dishSelect && dishSelect.reset) {
        dishSelect.reset();
    }
}

/**
 * Xuất thực đơn ra file Excel
 * Mỗi thực đơn sẽ là một sheet riêng biệt
 */
function exportMenuExcel() {
    try {
        // Kiểm tra dữ liệu
        const isAdminPage = window.location.pathname.includes('/admin/thuc-don-mau/');
        const menuData = isAdminPage ? window.menuExamine : menuExamine;
        if (!menuData || menuData.length === 0) {
            toarstError('Không có dữ liệu thực đơn để xuất!');
            return;
        }
        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            toarstError('Không tìm thấy ExcelJS trên trình duyệt!');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        menuData.forEach((menu, menuIndex) => {
            let sheetName = menu.name || `Thực đơn ${menuIndex + 1}`;
            sheetName = sheetName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 30 } });

            // Tiêu đề A1:C1
            ws.mergeCells(1, 1, 1, 3);
            const titleCell = ws.getCell(1, 1);
            titleCell.value = menu.name || 'THỰC ĐƠN';
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.font = { bold: true, size: 18 };

            // Header dòng 2
            ws.getRow(2).values = ['Giờ ăn', 'Thực phẩm', 'Khối lượng (g)'];
            ['A2', 'B2', 'C2'].forEach((addr) => {
                const cell = ws.getCell(addr);
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Dữ liệu chi tiết
            let rowIndex = 3;
            const listRowIndexMenuTime = [];

            if (menu.detail && menu.detail.length > 0) {
                menu.detail.forEach(menuTime => {
                    const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
                    const listFood = menuTime.listFood || [];

                    // Nếu không có thực phẩm nào thì bỏ qua
                    if (listFood.length === 0) return;

                    // Tạo món ăn mặc định cho các thực phẩm không có course_id hoặc course_id không tồn tại
                    const defaultCourse = { id: 0, name: 'Món ăn chung' };
                    const validCourses = courses.filter(c => c && c.id !== null && c.id !== undefined);

                    // Gom thực phẩm theo món ăn
                    const foodsByCourse = {};

                    listFood.forEach(food => {
                        let courseId = food.course_id;

                        // Nếu không có course_id hoặc course_id không tồn tại, gán vào món mặc định
                        if (courseId === null || courseId === undefined || !validCourses.some(c => c.id == courseId)) {
                            courseId = 0; // ID của món mặc định
                        }

                        if (!foodsByCourse[courseId]) {
                            foodsByCourse[courseId] = [];
                        }
                        foodsByCourse[courseId].push(food);
                    });

                    // Tính tổng số hàng cho menu time này
                    let totalRows = 0;
                    Object.keys(foodsByCourse).forEach(courseId => {
                        const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                        const foods = foodsByCourse[courseId];

                        // 1 hàng cho tên món ăn + số thực phẩm
                        totalRows += 1 + foods.length;
                    });

                    if (totalRows > 0) {
                        ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
                        ws.getCell(rowIndex, 1).value = menuTime.name || '';
                        const aCell = ws.getCell(rowIndex, 1);
                        aCell.font = { bold: true };
                        aCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
                        listRowIndexMenuTime.push(rowIndex);
                    }

                    // Ghi dữ liệu theo từng món ăn
                    Object.keys(foodsByCourse).forEach(courseId => {
                        const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                        const courseName = course ? course.name : 'Món ăn chung';
                        const foods = foodsByCourse[courseId];

                        // Ghi tên món ăn
                        ws.getCell(rowIndex, 2).value = courseName || '';
                        ws.getCell(rowIndex, 2).font = { bold: true };
                        ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                        ws.getCell(rowIndex, 3).value = '';
                        rowIndex += 1;

                        // Ghi từng thực phẩm trong món ăn
                        foods.forEach(food => {
                            ws.getCell(rowIndex, 2).value = food.name || '';
                            ws.getCell(rowIndex, 3).value = food.weight || 0;
                            ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                            ws.getCell(rowIndex, 3).alignment = { horizontal: 'center', vertical: 'middle' };
                            rowIndex += 1;
                        });
                    });
                });
            }

            // Chiều rộng cột
            ws.columns = [
                { width: 20 }, // Giờ ăn
                { width: 40 }, // Thực phẩm
                { width: 15 }  // Khối lượng
            ];
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_${timestamp}.xlsx`;
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
            toarstMessage('Đã xuất thực đơn ra file Excel thành công!');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            toarstError('Có lỗi khi xuất bằng ExcelJS.');
        });

    } catch (error) {
        console.error('Error exporting menu to Excel:', error);
        toarstError('Có lỗi xảy ra khi xuất file Excel: ' + error.message);
    }
}

/**
 * Xuất thực đơn ra file Excel với cột % ăn được và khối lượng cần mua
 * Mỗi thực đơn sẽ là một sheet riêng biệt
 */
function exportMenuExcelWithPurchase() {
    try {
        // Kiểm tra dữ liệu
        const isAdminPage = window.location.pathname.includes('/admin/thuc-don-mau/');
        const menuData = isAdminPage ? window.menuExamine : menuExamine;
        if (!menuData || menuData.length === 0) {
            toarstError('Không có dữ liệu thực đơn để xuất!');
            return;
        }
        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            toarstError('Không tìm thấy ExcelJS trên trình duyệt!');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        menuData.forEach((menu, menuIndex) => {
            let sheetName = menu.name || `Thực đơn ${menuIndex + 1}`;
            sheetName = sheetName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
            const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 30 } });

            // Tiêu đề A1:E1 (thêm 2 cột mới)
            ws.mergeCells(1, 1, 1, 5);
            const titleCell = ws.getCell(1, 1);
            titleCell.value = menu.name || 'THỰC ĐƠN';
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.font = { bold: true, size: 18 };

            // Header dòng 2
            ws.getRow(2).values = ['Giờ ăn', 'Thực phẩm', 'Khối lượng (g)', '% ăn được', 'Khối lượng cần mua (g)'];
            ['A2', 'B2', 'C2', 'D2', 'E2'].forEach((addr) => {
                const cell = ws.getCell(addr);
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9E1F2' }
                };
            });

            // Dữ liệu chi tiết
            let rowIndex = 3;
            const listRowIndexMenuTime = [];

            if (menu.detail && menu.detail.length > 0) {
                console.log("menu.detail", menu.detail);
                menu.detail.forEach(menuTime => {
                    const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
                    const listFood = menuTime.listFood || [];

                    // Nếu không có thực phẩm nào thì bỏ qua
                    if (listFood.length === 0) return;

                    // Tạo món ăn mặc định cho các thực phẩm không có course_id hoặc course_id không tồn tại
                    const defaultCourse = { id: 0, name: 'Món ăn chung' };
                    const validCourses = courses.filter(c => c && c.id !== null && c.id !== undefined);

                    // Gom thực phẩm theo món ăn
                    const foodsByCourse = {};

                    listFood.forEach(food => {
                        let courseId = food.course_id;

                        // Nếu không có course_id hoặc course_id không tồn tại, gán vào món mặc định
                        if (courseId === null || courseId === undefined || !validCourses.some(c => c.id == courseId)) {
                            courseId = 0; // ID của món mặc định
                        }

                        if (!foodsByCourse[courseId]) {
                            foodsByCourse[courseId] = [];
                        }
                        foodsByCourse[courseId].push(food);
                    });

                    // Tính tổng số hàng cho menu time này
                    let totalRows = 0;
                    Object.keys(foodsByCourse).forEach(courseId => {
                        const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                        const foods = foodsByCourse[courseId];

                        // 1 hàng cho tên món ăn + số thực phẩm
                        totalRows += 1 + foods.length;
                    });

                    if (totalRows > 0) {
                        ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
                        ws.getCell(rowIndex, 1).value = menuTime.name || '';
                        const aCell = ws.getCell(rowIndex, 1);
                        aCell.font = { bold: true };
                        aCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
                        aCell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFCE4D6' }
                        };
                        listRowIndexMenuTime.push(rowIndex);
                    }
                    console.log("foodsByCourse", foodsByCourse);
                    // Ghi dữ liệu theo từng món ăn
                    Object.keys(foodsByCourse).forEach(courseId => {
                        const course = courseId == 0 ? defaultCourse : validCourses.find(c => c.id == courseId);
                        const courseName = course ? course.name : 'Món ăn chung';
                        const foods = foodsByCourse[courseId];

                        // Ghi tên món ăn
                        ws.getCell(rowIndex, 2).value = courseName || '';
                        ws.getCell(rowIndex, 2).font = { bold: true };
                        ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                        ws.getCell(rowIndex, 2).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFF2CC' }
                        };
                        ws.getCell(rowIndex, 3).value = '';
                        ws.getCell(rowIndex, 4).value = '';
                        ws.getCell(rowIndex, 5).value = '';
                        rowIndex += 1;

                        // Ghi từng thực phẩm trong món ăn
                        foods.forEach(food => {

                            const weight = food.weight || 0;
                            const edible = food.edible || 100; // % ăn được, mặc định 100%
                            console.log(food.name, weight, edible);
                            const purchaseWeight = edible > 0 ? (weight * 100 / edible) : weight;

                            ws.getCell(rowIndex, 2).value = food.name || '';
                            ws.getCell(rowIndex, 3).value = weight;
                            ws.getCell(rowIndex, 4).value = edible;
                            ws.getCell(rowIndex, 5).value = parseFloat(purchaseWeight.toFixed(2));

                            ws.getCell(rowIndex, 2).alignment = { horizontal: 'left', vertical: 'middle' };
                            ws.getCell(rowIndex, 3).alignment = { horizontal: 'center', vertical: 'middle' };
                            ws.getCell(rowIndex, 4).alignment = { horizontal: 'center', vertical: 'middle' };
                            ws.getCell(rowIndex, 5).alignment = { horizontal: 'center', vertical: 'middle' };

                            // Format số
                            ws.getCell(rowIndex, 3).numFmt = '0.00';
                            ws.getCell(rowIndex, 4).numFmt = '0.00';
                            ws.getCell(rowIndex, 5).numFmt = '0.00';

                            rowIndex += 1;
                        });
                    });
                });
            }

            // Chiều rộng cột
            ws.columns = [
                { width: 20 }, // Giờ ăn
                { width: 40 }, // Thực phẩm
                { width: 18 }, // Khối lượng
                { width: 15 }, // % ăn được
                { width: 22 }  // Khối lượng cần mua
            ];

            // Thêm border cho tất cả các ô có dữ liệu
            for (let r = 2; r < rowIndex; r++) {
                for (let c = 1; c <= 5; c++) {
                    const cell = ws.getCell(r, c);
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_Mua_Hang_${timestamp}.xlsx`;
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
            toarstMessage('Đã xuất thực đơn mua hàng ra file Excel thành công!');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            toarstError('Có lỗi khi xuất bằng ExcelJS.');
        });

    } catch (error) {
        console.error('Error exporting menu to Excel:', error);
        toarstError('Có lỗi xảy ra khi xuất file Excel: ' + error.message);
    }
}

/**
 * Tạo worksheet cho một thực đơn với đầy đủ thông tin dinh dưỡng
 * @param {Object} wb - ExcelJS Workbook
 * @param {Object} menu - Menu object cần xuất
 */
function createMenuWorksheet(wb, menu) {
    if (!menu || !menu.detail || menu.detail.length === 0) {
        return null;
    }

    let sheetName = menu.name || 'Thực đơn';
    sheetName = sheetName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
    const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 25 } });

    // Tính số cột: Bữa ăn + Tên món ăn + các cột dinh dưỡng
    const numNutritionCols = currentDisplayConfig.visible_columns.length;
    const totalCols = 2 + numNutritionCols; // 2 cột cố định + cột dinh dưỡng

    // Tiêu đề chính (merge toàn bộ)
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = menu.name || 'THỰC ĐƠN CHI TIẾT';
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.font = { bold: true, size: 16 };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
    };

    // Header row
    let headerRow = ws.getRow(2);
    let headerValues = ['Bữa ăn', 'Tên món ăn'];

    // Thêm header cho các cột dinh dưỡng
    currentDisplayConfig.visible_columns.forEach(columnKey => {
        const column = availableColumns[columnKey];
        if (column) {
            headerValues.push(column.label);
        }
    });

    headerRow.values = headerValues;

    // Style cho header
    for (let i = 1; i <= totalCols; i++) {
        const cell = headerRow.getCell(i);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // Dữ liệu chi tiết
    let rowIndex = 3;
    let allFoods = []; // Lưu tất cả thực phẩm để tính tổng

    menu.detail.forEach(menuTime => {
        const courses = Array.isArray(menuTime.courses) ? menuTime.courses : [];
        const listFood = menuTime.listFood || [];

        if (listFood.length === 0) return;

        // Đảm bảo có course
        if (courses.length === 0) {
            courses.push({ id: 1, name: '' });
        }

        // Tính tổng số hàng cho menuTime này
        let totalRows = courses.length + listFood.length;
        const startRow = rowIndex;

        // Merge cell cho cột "Bữa ăn"
        ws.mergeCells(rowIndex, 1, rowIndex + totalRows - 1, 1);
        const mealCell = ws.getCell(rowIndex, 1);
        mealCell.value = menuTime.name || '';
        mealCell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
        mealCell.font = { bold: true, size: 12 };
        mealCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCE4D6' }
        };

        // Ghi dữ liệu theo từng course
        courses.forEach(course => {
            const courseFoods = listFood.filter(f => f.course_id == course.id);

            // Dòng tên món ăn (course header)
            const courseRow = ws.getRow(rowIndex);
            courseRow.getCell(2).value = course.name || '';
            courseRow.getCell(2).font = { bold: true, italic: true };
            courseRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
            courseRow.getCell(2).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF2CC' }
            };

            // Các cột dinh dưỡng để trống cho dòng course header
            for (let i = 3; i <= totalCols; i++) {
                courseRow.getCell(i).value = '';
                courseRow.getCell(i).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFF2CC' }
                };
            }

            rowIndex++;

            // Ghi từng thực phẩm trong course
            courseFoods.forEach(food => {
                const foodRow = ws.getRow(rowIndex);

                // Cột tên thực phẩm
                foodRow.getCell(2).value = food.name || '';
                foodRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

                // Các cột dinh dưỡng
                let colIndex = 3;
                currentDisplayConfig.visible_columns.forEach(columnKey => {
                    let value = food[columnKey];

                    if (value !== null && value !== undefined && value !== '') {
                        if (!isNaN(value)) {
                            value = parseFloat(value);
                        }
                    } else {
                        value = 0;
                    }

                    foodRow.getCell(colIndex).value = value;
                    foodRow.getCell(colIndex).alignment = { horizontal: 'center', vertical: 'middle' };

                    // Format số cho các cột số
                    if (typeof value === 'number') {
                        foodRow.getCell(colIndex).numFmt = '0.00';
                    }

                    colIndex++;
                });

                allFoods.push(food);
                rowIndex++;
            });
        });

        // Border cho toàn bộ menuTime
        for (let r = startRow; r < rowIndex; r++) {
            for (let c = 1; c <= totalCols; c++) {
                const cell = ws.getCell(r, c);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }
    });

    // Tính tổng
    if (allFoods.length > 0) {
        const totals = {};
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            totals[columnKey] = 0;
        });

        allFoods.forEach(food => {
            currentDisplayConfig.visible_columns.forEach(columnKey => {
                if (food[columnKey] !== undefined && food[columnKey] !== null && food[columnKey] !== '') {
                    const value = parseFloat(food[columnKey]) || 0;
                    totals[columnKey] += value;
                }
            });
        });

        // Dòng tổng
        const totalRow = ws.getRow(rowIndex);
        totalRow.getCell(1).value = 'TỔNG';
        totalRow.getCell(1).font = { bold: true, size: 12 };
        totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        totalRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        totalRow.getCell(2).value = '';
        totalRow.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        let colIndex = 3;
        currentDisplayConfig.visible_columns.forEach(columnKey => {
            const cell = totalRow.getCell(colIndex);

            if (columnKey === 'weight') {
                cell.value = '';
            } else {
                const total = totals[columnKey] || 0;
                cell.value = total;
                if (typeof total === 'number') {
                    cell.numFmt = '0.00';
                }
            }

            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };

            colIndex++;
        });

        // Border cho dòng tổng
        for (let c = 1; c <= totalCols; c++) {
            totalRow.getCell(c).border = {
                top: { style: 'medium' },
                left: { style: 'thin' },
                bottom: { style: 'medium' },
                right: { style: 'thin' }
            };
        }

        rowIndex++;

        // Dòng phần trăm (nếu có energy, protein, fat, carbohydrate)
        const hasEnergy = currentDisplayConfig.visible_columns.includes('energy');
        const hasProtein = currentDisplayConfig.visible_columns.includes('protein');
        const hasFat = currentDisplayConfig.visible_columns.includes('fat');
        const hasCarb = currentDisplayConfig.visible_columns.includes('carbohydrate');

        if (hasEnergy && totals.energy > 0 && (hasProtein || hasFat || hasCarb)) {
            const percentRow = ws.getRow(rowIndex);
            percentRow.getCell(1).value = '% Năng lượng';
            percentRow.getCell(1).font = { bold: true, italic: true };
            percentRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            percentRow.getCell(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF2CC' }
            };

            percentRow.getCell(2).value = '';
            percentRow.getCell(2).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFF2CC' }
            };

            let colIndex = 3;
            currentDisplayConfig.visible_columns.forEach(columnKey => {
                const cell = percentRow.getCell(colIndex);
                let percentValue = '';

                if (columnKey === 'protein' && totals.protein) {
                    percentValue = ((totals.protein * 4 * 100) / totals.energy).toFixed(2) + '%';
                } else if (columnKey === 'fat' && totals.fat) {
                    percentValue = ((totals.fat * 9 * 100) / totals.energy).toFixed(2) + '%';
                } else if (columnKey === 'carbohydrate' && totals.carbohydrate) {
                    percentValue = ((totals.carbohydrate * 4 * 100) / totals.energy).toFixed(2) + '%';
                }

                cell.value = percentValue;
                cell.font = { italic: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFF2CC' }
                };

                colIndex++;
            });

            // Border cho dòng phần trăm
            for (let c = 1; c <= totalCols; c++) {
                percentRow.getCell(c).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'medium' },
                    right: { style: 'thin' }
                };
            }
        }
    }

    // Thiết lập độ rộng cột
    ws.getColumn(1).width = 12; // Bữa ăn
    ws.getColumn(2).width = 35; // Tên món ăn

    // Các cột dinh dưỡng
    for (let i = 3; i <= totalCols; i++) {
        ws.getColumn(i).width = 15;
    }

    return ws;
}

/**
 * Xuất bảng thực đơn ra file Excel với đầy đủ thông tin dinh dưỡng
 * Bao gồm tất cả các cột được chọn hiển thị trên bảng
 */
function exportMenuTableExcel() {
    try {
        // Kiểm tra dữ liệu
        const menu_id = parseInt($('#menu_id').val());
        if (!menu_id) {
            toarstError('Vui lòng chọn thực đơn để xuất!');
            return;
        }

        // Tìm menu hiện tại
        let currentMenu = null;
        for (let menu of menuExamine) {
            if (menu.id == menu_id) {
                currentMenu = menu;
                break;
            }
        }

        if (!currentMenu || !currentMenu.detail || currentMenu.detail.length === 0) {
            toarstError('Không có dữ liệu thực đơn để xuất!');
            return;
        }

        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            toarstError('Không tìm thấy ExcelJS trên trình duyệt!');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        // Tạo worksheet cho menu
        createMenuWorksheet(wb, currentMenu);

        // Xuất file
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Thuc_Don_Chi_Tiet_${timestamp}.xlsx`;

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
            toarstMessage('Đã xuất bảng thực đơn chi tiết ra file Excel thành công!');
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            toarstError('Có lỗi khi xuất bằng ExcelJS.');
        });

    } catch (error) {
        console.error('Error exporting menu table to Excel:', error);
        toarstError('Có lỗi xảy ra khi xuất file Excel: ' + error.message);
    }
}

/**
 * Xuất TẤT CẢ thực đơn ra file Excel, mỗi thực đơn là một sheet
 */
function exportAllMenusTableExcel() {
    try {
        if (!menuExamine || menuExamine.length === 0) {
            toarstError('Không có thực đơn nào để xuất!');
            return;
        }

        if (!(typeof window !== 'undefined' && window.ExcelJS)) {
            toarstError('Không tìm thấy ExcelJS trên trình duyệt!');
            return;
        }

        const ExcelJS = window.ExcelJS;
        const wb = new ExcelJS.Workbook();

        let createdSheets = 0;

        // Tạo worksheet cho từng menu
        menuExamine.forEach((menu, index) => {
            if (menu && menu.detail && menu.detail.length > 0) {
                createMenuWorksheet(wb, menu);
                createdSheets++;
            }
        });

        if (createdSheets === 0) {
            toarstError('Không có thực đơn nào có dữ liệu để xuất!');
            return;
        }

        // Xuất file
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const fileName = `Tat_Ca_Thuc_Don_${timestamp}.xlsx`;

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
            toarstMessage(`Đã xuất ${createdSheets} thực đơn ra file Excel thành công!`);
        }).catch((err) => {
            console.error('ExcelJS export error:', err);
            toarstError('Có lỗi khi xuất bằng ExcelJS.');
        });

    } catch (error) {
        console.error('Error exporting all menus to Excel:', error);
        toarstError('Có lỗi xảy ra khi xuất file Excel: ' + error.message);
    }
}

function checkMenuExamine() {
    if (menuExamine && menuExamine.length > 0) {
        menuExamine.forEach(m => {
            if (m.detail && m.detail.length > 0) {
                m.detail.forEach(mt => {
                    if (!mt.courses || mt.courses.length == 0) {
                        mt.courses = [{ id: 1, name: mt.name_course || '' }];
                    }
                    if (mt.listFood && mt.listFood.length > 0) {
                        mt.listFood.forEach(f => {
                            if (!f.course_id) {
                                f.course_id = 1;
                            }
                        });
                    }
                });
            }
        });
    }
}
