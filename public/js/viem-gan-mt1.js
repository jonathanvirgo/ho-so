var isChangeInput = false;

if(document.getElementById('datepicker')){
    // Khởi tạo Flatpickr
    flatpickrInstance = flatpickr("#datepicker", {
        dateFormat: "H:i d/m/Y", // Định dạng ngày
        enableTime: true,
        wrap: true,
        animate: false,
        locale: 'vn',
        disableMobile: true,
        conjunction: ' - ',
        onChange: function(selectedDates, dateStr, instance) {
            let checkDuplicate = isDateInList(selectedDates[0], listTime);
            if(checkDuplicate){
                toarstError('Ngày bạn chọn đã tồn tại!');
                flatpickrInstance.close();
                resetEditTime();
            }else{
                flatpickrInstance.close();
                confirmDialog(( isEditTime ? 'Sửa ngày' : 'Thêm ngày'), 'Bạn có muốn ' + (isEditTime ? 'sửa' : 'thêm') + ' ngày: ' + dateStr + ' không?').then(responseData =>{
                    if(responseData.isConfirmed){
                        addTimes(document.getElementById('patient_id').value, document.getElementById('type').value, selectedDates[0]);
                    }else{
                        resetEditTime();
                    }
                })
            }
        }
    });

    // Sự kiện khi nhấn nút
    document.getElementById("datepicker").addEventListener("click", function (e) {
        e.preventDefault(); // Ngăn chặn hành vi mặc định của nút
        flatpickrInstance.open(); // Mở Flatpickr
    });
}

readyDom(()=>{
    // Theo dõi thay đổi trong form
    document.querySelectorAll('input, textarea').forEach((element) => {
        element.addEventListener('input', function () {
            isChangeInput = true;
        });
    });

    const elVirtualSelect = document.querySelectorAll('[data-plugin="virtual-select"]');
    Array.prototype.forEach.call(elVirtualSelect, (el) => {
         // Lắng nghe sự kiện change cho Virtual Select này
         el.addEventListener('change', () => {
            const id = el.id; // Lấy ID để làm khóa
            if (!initializedFlags[id]) {
                initializedFlags[id] = true; // Đánh dấu là đã khởi tạo xong
                return;
            }
        });
        el.addEventListener('afterOpen', () => {
            isChangeInput = true;
        })
    });
    isChangeInput = false;

    createLinkList('/viem-gan-mt1');
})

function createHepatitis(patient_id, type, href = ''){
    return new Promise((resolve, reject) => {
        let url = `/viem-gan-mt1-create/${patient_id}/${type}`;
    
        let errors = [];
        let param = getDataHepatitis(type);
        if(['sga'].includes(type) && !timeActive){
            toarstError('Vui lòng thêm ngày!');
            errors.push(1);
        }
        if(errors.length > 0){
            return;
        } else {
            if(hepatitisId){
                url = `/viem-gan-mt1-update/${patient_id}/${type}`;
                param['id'] = hepatitisId;
            } 
            $.ajax({
                type: 'POST',
                url: url,
                data: param,
                beforeSend: function () {
                    loading.show();
                },
                success: function (result) {
                    loading.hide();
                    if (result.success) {
                        if(result && result.data && result.data.insertId){
                            hepatitisId = result.data.insertId;
                        }
                        if(href && href.length > 0) window.location.href = href;
                        else toarstMessage('Lưu thành công');
                    } else {
                        toarstError(result.message);
                    }
                    isChangeInput = false;
                    resolve(1);
                },
                error: function (jqXHR, exception, error) {
                    loading.hide();
                    ajax_call_error(jqXHR, exception);
                    resolve(0);
                }
            });
        }
    })
}

function getDataHepatitis(type){
    switch(type){
        case 'dau-hieu-nhap-vien':
            return dauHieuNhapVien();
        case 'sga':
            return sga();
        case 'so-gan':
            return soGan();
        default: break;
    }
}

function dauHieuNhapVien(){
    return {
        chan_doan_benh: $('#chan_doan_benh').val(),
        nguyen_nhan: $('#nguyen_nhan').val(),
        nguyen_nhan_khac: $('#nguyen_nhan_khac').val(),
        cn: $('#cn').val(),
        cc: $('#cc').val(),
        vong_bap_chan: $('#vong_bap_chan').val(),
        got: $('#got').val(),
        gpt: $('#gpt').val(),
        hemoglobin: $('#hemoglobin').val(),
        bua_chinh: $('#bua_chinh').val(),
        bua_phu: $('[name="bua_phu"]:radio:checked').val(),
        bua_phu_an: $('#bua_phu_an').val(),
        bua_phu_an_khac: $('#bua_phu_an_khac').val(),
        an_kieng: $('[name="an_kieng"]:radio:checked').val(),
        an_kieng_loai: $('#an_kieng_loai').val() ? JSON.stringify($('#an_kieng_loai').val()) : '',
        an_kieng_loai_khac: $('#an_kieng_loai_khac').val(),
        ruou_bia: $('[name="ruou_bia"]:radio:checked').val(),
        ruou_bia_ts: $('#ruou_bia_ts').val(),
        ml_ruou: $('#ml_ruou').val(),
        ml_bia: $('#ml_bia').val(),
        do_uong_khac: $('[name="do_uong_khac"]:radio:checked').val(),
        do_uong_khac_ts: $('#do_uong_khac_ts').val(),
        loai_do_uong: $('#loai_do_uong').val() ? JSON.stringify($('#loai_do_uong').val()) : '',
        loai_do_uong_khac: $('#loai_do_uong_khac').val(),
        su_dung_la_cay: $('[name="su_dung_la_cay"]:radio:checked').val(),
        loai_la_cay: $('#loai_la_cay').val(),
        note: $('#note').val()
    }
}

function sga(){
    return {
        cn_6_thang: $('#cn_6_thang').val(),
        cn_2_tuan: $('#cn_2_tuan').val(),
        khau_phan_an_ht: $('#khau_phan_an_ht').val(),
        tieu_chung_th: $('#tieu_chung_th').val(),
        giam_chuc_nang: $('#giam_chuc_nang').val(),
        nc_chuyen_hoa: $('#nc_chuyen_hoa').val(),
        mo_duoi_da: $('#mo_duoi_da').val(),
        teo_co: $('#teo_co').val(),
        phu: $('#phu').val(),
        co_chuong: $('#co_chuong').val(),
        phan_loai: $('#phan_loai').val(),
        time_id: timeActive
    }
}

function soGan(){
    return {
        tinh_trang_gan: $('#tinh_trang_gan').val(),
        muc_do_xo_gan: $('#muc_do_xo_gan').val(),
        albumin: $('#albumin').val(),
        tu_van_dd: $('[name="tu_van_dd"]:radio:checked').val(),
        so_bua_moi_ngay: $('#so_bua_moi_ngay').val(),
        bua_dem: $('[name="bua_dem"]:radio:checked').val(),
        benh_ly_kem_theo: $('#benh_ly_kem_theo').val() ? JSON.stringify($('#benh_ly_kem_theo').val()) : '',
        benh_ly_kem_theo_khac: $('#benh_ly_kem_theo_khac').val()
    }
}

function addTimes(patient_id, type, dateStr){
    let url = `/viem-gan-mt1/add-time/${patient_id}/${type}`; 
    let param = {
        // 2025-01-11 22:11:32
        time: moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
    }
    if(isEditTime){
        param['timeActive'] = idEditTime;
        url = `/viem-gan-mt1/update-time/${type}`; 
    } 
    $.ajax({
        type: 'POST',
        url: url,
        data: param,
        beforeSend: function () {
            loading.show();
        },
        success: function (result) {
            loading.hide();
            if (result.success) {
                toarstMessage('Lưu thành công');
                if(isEditTime == false){
                    if(listTime.length > 0){
                        setDataTime(type, {});
                        deactiveTimes();
                    }
                    timeActive = result.insertId;
                    document.getElementById('list-date').insertAdjacentHTML('afterbegin', `
                        <div class="py-2 ws-nowrap card border-left-info text-info shadow">
                            <div class="px-2 cursor-poiter" id="time_${timeActive}" onclick="getDataTime(${timeActive})">${moment(dateStr).format('h:mm D/M/YYYY')}</div>
                            <div class="position-absolute right-1 cursor-poiter text-danger" onclick="deleteTime(${timeActive})"><i class="fas fa-trash"></i></div>
                            <div class="position-absolute right-4 cursor-poiter text-info px-2" onclick="editTime(${timeActive})"><i class="fas fa-pencil-alt"></i></div>
                        </div>
                    `);
                    listTime.push({id: timeActive, time: moment(dateStr).toISOString()});
                }else{
                    if(listTime && listTime.length > 0){
                        for(let item of listTime){
                            if(item.id == idEditTime){
                                item.time = moment(dateStr).toISOString();
                            }
                        }
                    }
                    $('#time_' + idEditTime).text(moment(dateStr).format('h:mm D/M/YYYY'));
                    resetEditTime();
                }
            } else {
                toarstError(result.message);
                resetEditTime();
            }
        },
        error: function (jqXHR, exception, error) {
            loading.hide();
            resetEditTime();
            ajax_call_error(jqXHR, exception);
        }
    });
}

function deactiveTimes(){
    let listTimeEl = document.querySelectorAll('#list-date .card');
    if(listTimeEl && listTimeEl.length > 0){
        for(let item of listTimeEl){
            item.classList.remove('border-left-info', 'text-info', 'shadow');
        }
    }
}

/**
 * Kiểm tra xem ngày đã tồn tại trong danh sách chưa.
 * 
 * @param {string} dateToCheck - Ngày cần kiểm tra (định dạng YYYY-MM-DD).
 * @param {string[]} dateList - Danh sách các ngày (mảng các chuỗi định dạng YYYY-MM-DD).
 * @param {string} format - Định dạng ngày (mặc định là 'YYYY-MM-DD').
 * @returns {boolean} - True nếu ngày tồn tại, False nếu không.
 */
function isDateInList(dateToCheck, dateList, format = 'YYYY-MM-DD HH:mm') {
    // Chuyển đổi ngày cần kiểm tra thành moment object
    const targetDate = moment(dateToCheck).format(format);

    // Kiểm tra ngày trong danh sách
    return dateList.some(date => {
        const currentDate = moment(date.time).format(format);
        return moment(currentDate).isSame(targetDate);
    });
}

function deleteTime(id){
    let date = $('#time_' + id).text();
    confirmDialog('Xác nhận', `Bạn có muốn xóa ngày ` + date).then(responseData =>{
        if(responseData.isConfirmed && id){
            let type = document.getElementById('type').value;
            $.ajax({
                type: 'POST',
                url: `/viem-gan-mt1/delete/time/${id}/${type}`,
                data: {patient_id: document.getElementById('patient_id').value},
                beforeSend: function () {
                    loading.show();
                },
                success: function (result) {
                    loading.hide();
                    if (result.success) {
                        toarstMessage(`Xóa thành công`);
                        // document.getElementById(type + '-' + id).remove();
                        location.reload();
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

function editTime(id){
    isEditTime = true;
    if(listTime && listTime.length > 0){
        for(let item of listTime){
            if(item.id == id){
                flatpickrInstance.setDate(new Date(item.time), false);
                flatpickrInstance.open();
                break;
            }
        }
    }
    idEditTime = id;
}

function resetEditTime(){
    isEditTime = false;
    idEditTime = '';
}

function getDataTime(time_id){
    if(timeActive !== time_id){
        let patient_id = document.getElementById('patient_id').value;
        let type = document.getElementById('type').value;

        deactiveTimes();
        $('#time_' + time_id).parent().addClass( "border-left-info text-info shadow");
        if(isChangeInput){
            confirmDialog('Xác nhận lưu','Bạn có muốn lưu dữ liệu?').then(async responseData =>{
                if(responseData.isConfirmed){
                    await createHepatitis(patient_id, type);
                }
                getDataTimeAjax(patient_id, type, time_id);
            })
        }else{
            getDataTimeAjax(patient_id, type, time_id);
        }
    }
}

function getDataTimeAjax(patient_id, type, time_id){
    timeActive = time_id;
    $.ajax({
        type: 'POST',
        url: `/viem-gan-mt1/data-time/${patient_id}/${type}`,
        data: {time_id: time_id},
        beforeSend: function () {
            loading.show();
        },
        success: function (result) {
            if (result.success) {
                if(result.data){
                    let data = result.data;
                    setDataTime(type, data);
                    hepatitisId = data.id;
                    isChangeInput = false;
                    setTimeout(() => {
                        loading.hide();
                    }, 500);
                }else{
                    loading.hide();
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

function setDataTime(type, data){
    switch(type){
        case 'sga': setDataTimeSga(data)
            break;
        default: break;
    }
}

function setDataTimeSga(data){
    document.querySelector('#cn_6_thang').setValue(data.cn_6_thang ? data.cn_6_thang : '');
    document.querySelector('#cn_2_tuan').setValue(data.cn_2_tuan ? data.cn_2_tuan : '');
    document.querySelector('#khau_phan_an_ht').setValue(data.khau_phan_an_ht ? data.khau_phan_an_ht : '');
    document.querySelector('#tieu_chung_th').setValue(data.tieu_chung_th ? data.tieu_chung_th : '');
    document.querySelector('#giam_chuc_nang').setValue(data.giam_chuc_nang ? data.giam_chuc_nang : '');
    document.querySelector('#nc_chuyen_hoa').setValue(data.nc_chuyen_hoa ? data.nc_chuyen_hoa : '');
    document.querySelector('#mo_duoi_da').setValue(data.mo_duoi_da ? data.mo_duoi_da : '');
    document.querySelector('#teo_co').setValue(data.teo_co ? data.teo_co : '');
    document.querySelector('#phu').setValue(data.phu ? data.phu : '');
    document.querySelector('#co_chuong').setValue(data.co_chuong ? data.co_chuong : '');
    document.querySelector('#phan_loai').setValue(data.phan_loai ? data.phan_loai : '');
}

function changeHepatitisPage(event, target, patient_id, type){
    event.preventDefault();
    let href = target.getAttribute('href');
    if(isChangeInput){
        confirmDialog('Xác nhận lưu','Bạn có muốn lưu dữ liệu?').then(async responseData =>{
            if(responseData.isConfirmed){
                await createHepatitis(patient_id, type, href);
            }else{
                window.location.href = href;
            }
        })
    }else{
        window.location.href = href;
    }
}

// MT1 khẩu phần ăn dùng route riêng, tái sử dụng API của viêm-gan phía server
function addBroadingMt1(patient_id, type){
    let url = `/viem-gan-mt1/add-broading/${patient_id}/${type}`;
    let param = {};
    switch(type){
        case 'khau-phan-an':
            param = {
                date: $('#ngay input').val(),
                nd_duong_th_sang: $('#nd_duong_th_sang').val(),
                nd_duong_th_trua: $('#nd_duong_th_trua').val(),
                nd_duong_th_toi: $('#nd_duong_th_toi').val(),
                nd_duong_th_bua_phu: $('#nd_duong_th_bua_phu').val(),
                nd_tinh_mac: $('#nd_tinh_mac').val(),
                note: $('#note').val(),
            }
            break;
        default: break;
    }

    if(boardingId){
        param['id'] = boardingId;
        url = `/viem-gan-mt1/update-broading/${type}`;
    }
    // gọi chung
    $.ajax({
        type: 'POST',
        url: url,
        data: param,
        beforeSend: function () { loading.show(); },
        success: function (result) {
            loading.hide();
            if (result.success) {
                toarstMessage('Lưu thành công');
                $('#modal-add-broading').modal('hide');
                $("#dataTable").DataTable().ajax.reload();
            } else { toarstError(result.message); }
        },
        error: function (jqXHR, exception, error) {
            loading.hide();
            ajax_call_error(jqXHR, exception);
        }
    });
}

function openModalEditBoardingMt1(id, type){
    boardingId = id;
    if(id && type){
        $('#modal-add-broading').modal('show');
        $.ajax({
            type: 'POST',
            url: `/viem-gan-mt1/get-broading/${id}/${type}`,
            data: {},
            beforeSend: function () { loading.show(); },
            success: function (result) {
                loading.hide();
                if (result.success && result.data) {
                    let data = result.data;
                    ngay_fp.setDate(data.time);
                    $('#note').val(data.note);
                    if(type === 'khau-phan-an'){
                        $('#nd_duong_th_sang').val(data.nd_duong_th_sang);
                        $('#nd_duong_th_trua').val(data.nd_duong_th_trua);
                        $('#nd_duong_th_toi').val(data.nd_duong_th_toi);
                        $('#nd_duong_th_bua_phu').val(data.nd_duong_th_bua_phu);
                        $('#nd_tinh_mac').val(data.nd_tinh_mac);
                    }
                } else { toarstError(result.message); }
            },
            error: function (jqXHR, exception) {
                loading.hide();
                ajax_call_error(jqXHR, exception);
            }
        });
    }
}

function deleteBoardingMt1(id, type, date){
    confirmDialog('Xác nhận', `Bạn có muốn xóa theo dõi nội trú: ` + moment(date).format('DD/MM/YYYY')).then(responseData =>{
        if(responseData.isConfirmed && id){
            $.ajax({
                type: 'POST',
                url: `/viem-gan-mt1/delete/broading/${id}/${type}`,
                data: {},
                beforeSend: function () { loading.show(); },
                success: function (result) {
                    loading.hide();
                    if (result.success) {
                        toarstMessage(`Xóa thành công`);
                        $("#dataTable").DataTable().ajax.reload();
                    } else { toarstError(result.message); }
                },
                error: function (jqXHR, exception) {
                    loading.hide();
                    ajax_call_error(jqXHR, exception);
                }
            });
        }
    })
}

function openModalCreateBoardingMt1(type){
    if($('#ngay').length && document.querySelector('#ngay')._flatpickr){
        ngay_fp = document.querySelector('#ngay')._flatpickr;
        ngay_fp.clear();
    }
    $('#note').val('');
    if(type === 'khau-phan-an'){
        $('#nd_duong_th_sang').val('');
        $('#nd_duong_th_trua').val('');
        $('#nd_duong_th_toi').val('');
        $('#nd_duong_th_bua_phu').val('');
        $('#nd_tinh_mac').val('');
    }
    boardingId = undefined;
    $('#modal-add-broading').modal('show');
}
