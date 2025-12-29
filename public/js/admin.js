function deleteUser(id, name){
    confirmDialog('Xác nhận', `Bạn có muốn xóa tài khoản ` + name).then(responseData =>{
        if(responseData.isConfirmed && id){
            $.ajax({
                type: 'POST',
                url: `/admin/user/delete/${id}`,
                data: {},
                beforeSend: function () {
                    loading.show();
                },
                success: function (result) {
                    loading.hide();
                    if (result.success) {
                        toarstMessage(`Xóa thành công`);
                        $("#dataTable").DataTable().ajax.reload();
                    } else {
                        toarstError(result.message);
                    }
                },
                error: function (jqXHR, exception) {
                    loading.hide();
                    ajax_call_error(jqXHR, exception);
                }
            });
        }
    })
}

function openModalEditTable( table, id){
    if(id){
        modalDataTable(table, 1);
        setIdEdit(table, id);
        $.ajax({
            type: 'POST',
            url: `/admin/data-table`,
            data: {id: id, table: table},
            beforeSend: function () {
                loading.show();
            },
            success: function (result) {
                loading.hide();
                if (result.success) {
                    if(result.data){
                        let data = result.data;
                        setDataFrom(table, data);
                    }
                } else {
                    toarstError(result.message);
                }
            },
            error: function (jqXHR, exception) {
                loading.hide();
                ajax_call_error(jqXHR, exception);
            }
        });
    }
}

function openModalCreateTable(table){
    setIdEdit(table, '');
    resetTableEl(table, 1);
}

function resetTableEl(table, isEdit = 0){
    switch(table){
        case 'user':
            resetFormUser();
            if(isEdit == 1){
                modalDataTable(table, 1);
            }
            break;
        case 'menu_example':
            resetFormMenuExample();
            if(isEdit == 1){
                modalDataTable(table, 1);
            }
            break;
        case 'campaign':
            resetFormCampaign();
            if(isEdit == 1){
                modalDataTable(table, 1);
            }
            break;
        default: break;
    }
}

function addDataTable(table){
    let id = getIdEdit(table);
    let errors = [];
    let param = getDataForm(table);
    if(id && id.length > 0){
        param['id'] = id;
    } 
    if(errors.length > 0){
        return;
    } else {
        $.ajax({
            type: 'POST',
            url: param.url,
            data: param,
            beforeSend: function () {
                loading.show();
            },
            success: function (result) {
                loading.hide();
                if (result.success) {
                    toarstMessage('Lưu thành công');
                    modalDataTable(table, 0);
                    $("#dataTable").DataTable().ajax.reload();
                } else {
                    toarstError(result.message);
                }
            },
            error: function (jqXHR, exception, error) {
                loading.hide();
                ajax_call_error(jqXHR, exception);
            }
        });
    }
}

function modalDataTable(table, show){
    switch(table){
        case 'user':
            $('#modal-add-user').modal(show ? 'show' : 'hide');
            break;
        case 'menu_example':
            $('#modal-add-menu-example').modal(show ? 'show' : 'hide');
            break;
        case 'campaign':
            $('#modal-add-campaign').modal(show ? 'show' : 'hide');
            break;
        default: break;
    }
}

function getDataForm(table){
    switch(table){
        case 'user':
            return getDataUser();
        case 'menu_example':
            return getDataMenuExample();
        case 'campaign':
            return getDataCampaign();
        default: break;
    }
}

function getDataUser(){
    return {
        fullname: $('#fullname').val(),
        email: $('#email').val(),
        phone: $('#phone').val(),
        password: $('#password').val(),
        gender: $('#gender').val(),
        role:  $('#role').val(),
        campaign_id: $('#campaign').val(),
        active: $('#active').val(),
        // url: id && id.length > 0 ? '/admin/user/update' : '/admin/user/create'
        url: '/admin/user/upsert/'
    }
}

function resetFormUser(){
    $('#fullname').val('');
    $('#email').val('');
    $('#phone').val('');
    $('#password').val('');
    $('#modal-add-user .modal-title').html('Thêm tài khoản');
    document.querySelector('#role').setValue(['2']);
    document.querySelector('#role').setValue('');
    document.querySelector('#gender').setValue('');
    document.querySelector('#active').setValue('0');
}

function setDataFrom(table, data){
    switch(table){
        case 'user':
            setDataFormUser(data);
            break;
        case 'menu_example':
            setDataFormMenuExample(data);
            break;
        case 'campaign':
            setDataFormCampaign(data);
            break;
        default: break;
    }
}

function setDataFormUser(data){
    $('#fullname').val(data.fullname);
    $('#email').val(data.email);
    $('#phone').val(data.phone);
    $('#password').val('');
    document.querySelector('#gender').setValue(String(data.gender));
    if (Array.isArray(data.role)) {
        document.querySelector('#role').setValue(data.role);
    } else {
        document.querySelector('#role').setValue([data.role]);
    }
    document.querySelector('#campaign').setValue(data.campaign_id);
    document.querySelector('#active').setValue(String(data.active));
    $('#modal-add-user .modal-title').html('Sửa tài khoản');
}

function getIdEdit(table){
    switch(table){
        case 'user':
            return  $('#user_select_edit').val();
        case 'menu_example':
            return  $('#menu_example_select_edit').val();
        case 'campaign':
            return  $('#campaign_select_edit').val();
        default: break;
    }
}

function setIdEdit(table, id){
    switch(table){
        case 'user':
            $('#user_select_edit').val(id);
            break;
        case 'menu_example':
            $('#menu_example_select_edit').val(id);
            break;
        case 'campaign':
            $('#campaign_select_edit').val(id);
            break;
        default: break;
    }
}

// Thực đơn mẫu functions
function deleteMenuExample(id, name){
    confirmDialog('Xác nhận', `Bạn có muốn xóa thực đơn mẫu ` + name).then(responseData =>{
        if(responseData.isConfirmed && id){
            $.ajax({
                type: 'POST',
                url: `/admin/thuc-don-mau/delete/${id}`,
                data: {},
                beforeSend: function () {
                    loading.show();
                },
                success: function (result) {
                    loading.hide();
                    if (result.success) {
                        toarstMessage(`Xóa thành công`);
                        $("#dataTable").DataTable().ajax.reload();
                    } else {
                        toarstError(result.message);
                    }
                },
                error: function (jqXHR, exception) {
                    loading.hide();
                    ajax_call_error(jqXHR, exception);
                }
            });
        }
    })
}

function getDataMenuExample(){
    // Tạo detail mặc định với menuTime
    let defaultDetail = [];
    if (window.listMenuTime && window.listMenuTime.length > 0) {
        defaultDetail = window.listMenuTime.map(time => ({
            id: time.id,
            name: time.name,
            name_course: "",
            listFood: []
        }));
    }
    
    return {
        name_menu: $('#name_menu_modal').val(),
        share: $('#share').val(),
        detail: JSON.stringify(defaultDetail),
        url: '/admin/thuc-don-mau/upsert/'
    }
}

function resetFormMenuExample(){
    $('#name_menu_modal').val('');
    $('#modal-add-menu-example .modal-title').html('Thêm thực đơn mẫu');
    document.querySelector('#share').setValue('0');
}

function setDataFormMenuExample(data){
    $('#name_menu_modal').val(data.name_menu);
    document.querySelector('#share').setValue(String(data.share));
    $('#modal-add-menu-example .modal-title').html('Sửa thực đơn mẫu');
}

// Campaign functions
function getDataCampaign(){
    return {
        name: $('#name').val(),
        active: $('#active').val(),
        url: '/admin/campaign/upsert/'
    }
}

function resetFormCampaign(){
    $('#name').val('');
    $('#modal-add-campaign .modal-title').html('Thêm chiến dịch');
    document.querySelector('#active').setValue('1');
}

function setDataFormCampaign(data){
    $('#name').val(data.name);
    document.querySelector('#active').setValue(String(data.active));
    $('#modal-add-campaign .modal-title').html('Sửa chiến dịch');
}

