var isChangeInput = false;
var allFields = [
    'cn', 'cc', 'vong_bap_chan', 'glucose', 'triglycerid', 'cholesterol', 'ure', 'creatinin', 'got', 'gpt', 'ggt',
    'hong_cau', 'hemoglobin', 'pre_albumin', 'albumin', 'protein_tp',
    'sat_huyet_thanh', 'ferritin'
];

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
                if(!isEditTime && listTime.length >= 4 && document.getElementById('type').value == 'tinh-trang-dinh-duong'){
                    toarstError('Bạn chỉ có thể thêm tối đa 4 ngày!');
                    flatpickrInstance.close();
                    resetEditTime();
                    return;
                }
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
    if(document.getElementById('ngay_input')){
        ngay_fp = document.querySelector("#ngay")._flatpickr;
        document.querySelector("#ngay_input").addEventListener("change", function () {
            if(this.value){
                let checkDuplicate = isDateInList(moment(this.value, '"DD/MM/YYYY"') , listBroading);
                if(checkDuplicate){
                    toarstError('Ngày bạn chọn đã tồn tại!');
                    ngay_fp.clear();
                }
            }
        });
    }

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

    createLinkList('/viem-gan');
})

function createHepatitis(patient_id, type, href = ''){
    return new Promise((resolve, reject) => {
        let url = `/viem-gan-create/${patient_id}/${type}`;
    
        let errors = [];
        let param = getDataHepatitis(type);

        // if(!param.fullname){
        //     toggleErrorHtml('fullname', false, 'Vui lòng nhập họ và tên', true);
        //     errors.push(1);
        // }
        // if(!param.ma_benh_an){
        //     toggleErrorHtml('ma_benh_an', false, 'Vui lòng nhập mã bệnh án', true);
        //     errors.push(1);
        // }
        if(['tinh-trang-dinh-duong', 'can-thiep-dinh-duong', 'sga'].includes(type) && !timeActive){
            toarstError('Vui lòng thêm ngày!');
            errors.push(1);
        }
        if(errors.length > 0){
            return;
        } else {
            if(hepatitisId){
                url = `/viem-gan-update/${patient_id}/${type}`;
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
        case 'thoi-quen-an-uong':
            return thoiQuenAnUong();
        case 'tinh-trang-dinh-duong':
            return tinhTrangDinhDuong();
        case 'can-thiep-dinh-duong':
            return canThiepDinhDuong();
        case 'sga':
            return sga();
        default: break;
    }
}

function dauHieuNhapVien(){
    return {
        chan_an_met_moi: $('#chan_an_met_moi').val(),
        bieu_hien_tieu_hoa: $('#bieu_hien_tieu_hoa').val(),
        dau_tuc_hsp: $('[name="dau_tuc_hsp"]:radio:checked').val(),
        dau_tuc_hsp_khi: $('#dau_tuc_hsp_khi').val(),
        vang_da_vang_mat: $('[name="vang_da_vang_mat"]:radio:checked').val(),
        bieu_hien_phu: $('#bieu_hien_phu').val(),
        bieu_hien_co_chuong: $('[name="bieu_hien_co_chuong"]:radio:checked').val(),
        ngua_da: $('#ngua_da').val(),
        ngua_da_khac: $('#ngua_da_khac').val(),
        xuat_huyet_tieu_hoa: $('[name="xuat_huyet_tieu_hoa"]:radio:checked').val()
    }
}

function thoiQuenAnUong(){
    return {
        bua_chinh: $('#bua_chinh').val(),
        bua_phu: $('[name="bua_phu"]:radio:checked').val(),
        bua_phu_an: $('#bua_phu_an').val() ? JSON.stringify($('#bua_phu_an').val()) : '',
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
        loai_la_cay: $('#loai_la_cay').val(),
        cham_soc_dd: $('#cham_soc_dd').val(),
        cham_soc_dd_khac: $('#cham_soc_dd_khac').val()
    }
}

function tinhTrangDinhDuong(){
    return {
        cn: $('#cn').val(),
        cc: $('#cc').val(),
        vong_bap_chan: $('#vong_bap_chan').val(),
        glucose: $('#glucose').val(),
        ure: $('#ure').val(),
        creatinin: $('#creatinin').val(),
        got: $('#got').val(),
        gpt: $('#gpt').val(),
        ggt: $('#ggt').val(),
        hong_cau: $('#hong_cau').val(),
        hemoglobin: $('#hemoglobin').val(),
        pre_albumin: $('#pre_albumin').val(),
        albumin: $('#albumin').val(),
        protein_tp: $('#protein_tp').val(),
        sat_huyet_thanh: $('#sat_huyet_thanh').val(),
        ferritin: $('#ferritin').val(),
        time_id: timeActive
    }
}
function canThiepDinhDuong(){
    return {
        chan_an: $('[name="chan_an"]:radio:checked').val(),
        chan_an_note: $('#chan_an_note').val(),
        an_khong_ngon: $('[name="an_khong_ngon"]:radio:checked').val(),
        an_khong_ngon_note: $('#an_khong_ngon_note').val(),
        buon_non: $('[name="buon_non"]:radio:checked').val(),
        buon_non_note: $('#buon_non_note').val(),
        non: $('[name="non"]:radio:checked').val(),
        non_note: $('#non_note').val(),
        tao_bon: $('[name="tao_bon"]:radio:checked').val(),
        tao_bon_note: $('#tao_bon_note').val(),
        tieu_chay: $('[name="tieu_chay"]:radio:checked').val(),
        tieu_chay_note: $('#tieu_chay_note').val(),
        song_phan: $('[name="song_phan"]:radio:checked').val(),
        song_phan_note: $('#song_phan_note').val(),
        nhiet_mieng: $('[name="nhiet_mieng"]:radio:checked').val(),
        nhiet_mieng_note: $('#nhiet_mieng_note').val(),
        thay_doi_vi_giac: $('[name="thay_doi_vi_giac"]:radio:checked').val(),
        thay_doi_vi_giac_note: $('#thay_doi_vi_giac_note').val(),
        khac: $('[name="khac"]:radio:checked').val(),
        khac_note: $('#khac_note').val(),
        co_chuong: $('[name="co_chuong"]:radio:checked').val(),
        co_chuong_note: $('#co_chuong_note').val(),
        met_moi: $('[name="met_moi"]:radio:checked').val(),
        met_moi_note: $('#met_moi_note').val(),
        dau: $('[name="dau"]:radio:checked').val(),
        dau_note: $('#dau_note').val(),
        time_id: timeActive
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

function addTimes(patient_id, type, dateStr){
    let url = `/viem-gan/add-time/${patient_id}/${type}`; 
    let param = {
        // 2025-01-11 22:11:32
        time: moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
    }
    if(isEditTime){
        param['timeActive'] = idEditTime;
        url = `/viem-gan/update-time/${type}`; 
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
                    document.getElementById('list-date').insertAdjacentHTML('beforeend', `
                        <div class="py-2 ws-nowrap card border-left-info text-info shadow">
                            <div class="px-2 cursor-poiter" id="time_${timeActive}" onclick="getDataTime(${timeActive})">${moment(dateStr).format('h:mm D/M/YYYY')}</div>
                            <div class="position-absolute right-4 cursor-poiter text-info px-2" onclick="editTime(${timeActive})"><i class="fas fa-pencil-alt"></i></div>
                        </div>
                    `);
                    listTime.push({id: timeActive, time: moment(dateStr).toISOString()});
                    updateFieldVisibility();
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

function addBroading(patient_id, type){
    let url = `/viem-gan/add-broading/${patient_id}/${type}`;
    
    let errors = [];
    let param = getDataBroading(type);
    if(boardingId){
        param['id'] = boardingId;
        url = `/viem-gan/update-broading/${type}`;
    } 
    if(errors.length > 0){
        return;
    } else {
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
                    $('#modal-add-broading').modal('hide');
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

function getDataBroading(type){
    switch(type){
        case 'che-do-an-noi-tru':
            return cheDoAnNoiTru();
        case 'che-do-an-ngoai-tru':
            return cheDoAnNgoaiTru();
        default: break;
    }
}

function cheDoAnNoiTru(){
    return {
        date: $('#ngay input').val(),
        nd_duong_th: $('#nd_duong_th').val(),
        nd_tinh_mac: $('#nd_tinh_mac').val(),
        note: $('#note').val(),
    }
}

function cheDoAnNgoaiTru(){
    return {
        date: $('#ngay input').val(),
        cn: $('#cn').val(),
        bat_thuong: $('#bat_thuong').val(),
        tu_van: $('#tu_van').val(),
        note: $('#note').val(),
    }
}

function deleteBoarding(id, type, date){
    confirmDialog('Xác nhận', `Bạn có muốn xóa theo dõi ${type == 'che-do-an-noi-tru' ? 'nội trú' : 'ngoại trú'}:` + moment(date).format('DD/MM/YYYY')).then(responseData =>{
        if(responseData.isConfirmed && id){
            $.ajax({
                type: 'POST',
                url: `/viem-gan/delete/broading/${id}/${type}`,
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

function deleteTime(id){
    let date = $('#time_' + id).text();
    confirmDialog('Xác nhận', `Bạn có muốn xóa ngày ` + date).then(responseData =>{
        if(responseData.isConfirmed && id){
            let type = document.getElementById('type').value;
            $.ajax({
                type: 'POST',
                url: `/viem-gan/delete/time/${id}/${type}`,
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

function openModalEditBoarding(id, type){
    boardingId = id;
    if(id && type){
        $('#modal-add-broading').modal('show');
        $.ajax({
            type: 'POST',
            url: `/viem-gan/get-broading/${id}/${type}`,
            data: {},
            beforeSend: function () {
                loading.show();
            },
            success: function (result) {
                loading.hide();
                if (result.success) {
                    if(result.data){
                        let data = result.data;
                        
                        ngay_fp.setDate(data.time);
                        $('#note').val(data.note);
                        if(type == 'che-do-an-noi-tru'){
                            $('#nd_duong_th').val(data.nd_duong_th);
                            $('#nd_tinh_mac').val(data.nd_tinh_mac);
                        }else{
                            $('#cn').val(data.cn);
                            $('#bat_thuong').val(data.bat_thuong);
                            $('#tu_van').val(data.tu_van);
                        }
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

function openModalCreateBoarding(type){
    resetBoardingEl(type);
    $('#modal-add-broading').modal('show');
}

function resetBoardingEl(){
    ngay_fp.clear();
    $('note').val('');
    switch(type){
        case 'che-do-an-noi-tru':
            $('#nd_duong_th').val('');
            $('#nd_tinh_mac').val('');
            break;
        case 'che-do-an-ngoai-tru':
            $('#cn').val('');
            $('#bat_thuong').val('');
            $('#tu_van').val('');
            break;
        default: break;
    }
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
    updateFieldVisibility();
    $.ajax({
        type: 'POST',
        url: `/viem-gan/data-time/${patient_id}/${type}`,
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
        case 'tinh-trang-dinh-duong': setDataTimeTinhTrang(data);
                // hideInputLamSang();
            break;
        case 'can-thiep-dinh-duong': setDataTimeCanThiep(data)
            break;
        case 'sga': setDataTimeSga(data)
            break;
        default: break;
    }
}

function setDataTimeTinhTrang(data){
    $('#cn').val(data.cn ? data.cn : '');
    $('#cc').val(data.cc ? data.cc : '');
    $('#vong_bap_chan').val(data.vong_bap_chan ? data.vong_bap_chan : '');
    $('#glucose').val(data.glucose ? data.glucose : '');
    $('#ure').val(data.ure ? data.ure : '');
    $('#creatinin').val(data.creatinin ? data.creatinin : '');
    $('#got').val(data.got ? data.got : '');
    $('#gpt').val(data.gpt ? data.gpt : '');
    $('#ggt').val(data.ggt ? data.ggt : '');
    $('#hong_cau').val(data.hong_cau ? data.hong_cau : '');
    $('#hemoglobin').val(data.hemoglobin ? data.hemoglobin : '');
    $('#pre_albumin').val(data.pre_albumin ? data.pre_albumin : '');
    $('#albumin').val(data.albumin ? data.albumin : '');
    $('#protein_tp').val(data.protein_tp ? data.protein_tp : '');
    $('#sat_huyet_thanh').val(data.sat_huyet_thanh ? data.sat_huyet_thanh : '');
    $('#ferritin').val(data.ferritin ? data.ferritin : '');
}

function setDataTimeCanThiep(data){
    if(data.chan_an){
        $(`input[name="chan_an"][value="${data.chan_an}"]`).prop('checked', true);
    }else{
        $(`input[name="chan_an"]`).prop('checked', false);
    }
    $('#chan_an_note').val(data.chan_an_note ? data.chan_an_note : '');
    if(data.an_khong_ngon){
        $(`input[name="an_khong_ngon"][value="${data.an_khong_ngon}"]`).prop('checked', true);
    }else{
        $(`input[name="an_khong_ngon"]`).prop('checked', false);
    }
    $('#an_khong_ngon_note').val(data.an_khong_ngon_note ? data.an_khong_ngon_note : '');
    if(data.buon_non){
        $(`input[name="buon_non"][value="${data.chan_an}"]`).prop('checked', true);
    }else{
        $(`input[name="buon_non"]`).prop('checked', false);
    }
    $('#buon_non_note').val(data.buon_non_note ? data.buon_non_note : '');
    if(data.non){
        $(`input[name="non"][value="${data.non}"]`).prop('checked', true);
    }else{
        $(`input[name="non"]`).prop('checked', false);
    }
    $('#non_note').val(data.non_note ? data.non_note : '');
    if(data.tao_bon){
        $(`input[name="tao_bon"][value="${data.tao_bon}"]`).prop('checked', true);
    }else{
        $(`input[name="tao_bon"]`).prop('checked', false);
    }
    $('#tao_bon_note').val(data.tao_bon_note ? data.tao_bon_note : '');
    if(data.tieu_chay){
        $(`input[name="tieu_chay"][value="${data.tieu_chay}"]`).prop('checked', true);
    }else{
        $(`input[name="tieu_chay"]`).prop('checked', false);
    }
    $('#tieu_chay_note').val(data.tieu_chay_note ? data.tieu_chay_note : '');
    if(data.song_phan){
        $(`input[name="song_phan"][value="${data.song_phan}"]`).prop('checked', true);
    }else{
        $(`input[name="song_phan"]`).prop('checked', false);
    }
    $('#song_phan_note').val(data.song_phan_note ? data.song_phan_note : '');
    if(data.nhiet_mieng){
        $(`input[name="nhiet_mieng"][value="${data.nhiet_mieng}"]`).prop('checked', true);
    }else{
        $(`input[name="nhiet_mieng"]`).prop('checked', false);
    }
    $('#nhiet_mieng_note').val(data.nhiet_mieng_note ? data.nhiet_mieng_note : '');
    if(data.thay_doi_vi_giac){
        $(`input[name="thay_doi_vi_giac"][value="${data.thay_doi_vi_giac}"]`).prop('checked', true);
    }else{
        $(`input[name="thay_doi_vi_giac"]`).prop('checked', false);
    }
    $('#thay_doi_vi_giac_note').val(data.thay_doi_vi_giac_note ? data.thay_doi_vi_giac_note : '');
    if(data.khac){
        $(`input[name="khac"][value="${data.khac}"]`).prop('checked', true);
    }else{
        $(`input[name="khac"]`).prop('checked', false);
    }
    $('#khac_note').val(data.khac_note ? data.khac_note : '');
    if(data.co_chuong){
        $(`input[name="co_chuong"][value="${data.co_chuong}"]`).prop('checked', true);
    }else{
        $(`input[name="co_chuong"]`).prop('checked', false);
    }
    $('#co_chuong_note').val(data.co_chuong_note ? data.co_chuong_note : '');
    if(data.met_moi){
        $(`input[name="met_moi"][value="${data.met_moi}"]`).prop('checked', true);
    }else{
        $(`input[name="met_moi"]`).prop('checked', false);
    }
    $('#met_moi_note').val(data.met_moi_note ? data.met_moi_note : '');
    if(data.dau){
        $(`input[name="dau"][value="${data.dau}"]`).prop('checked', true);
    }else{
        $(`input[name="dau"]`).prop('checked', false);
    }
    $('#dau_note').val(data.dau_note ? data.dau_note : '');
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
    let pathName = window.location.pathname;
    let href = target.getAttribute('href');
    if(pathName.includes('che-do-an-ngoai-tru') || pathName.includes('che-do-an-noi-tru')){
        window.location.href = href;
    }else{
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
}

function showFields(fieldsToShow) {
    allFields.forEach(fieldId => {
        const element = $('[data-field="' + fieldId + '"]');
        if (element.length) {
            if (fieldsToShow.includes(fieldId)) {
                element.show();
            } else {
                element.hide();
            }
        }
    });
}

function updateFieldVisibility() {
    if(['dau-hieu-nhap-vien', 'thoi-quen-an-uong', 'che-do-an-noi-tru', 'che-do-an-ngoai-tru'].includes(document.getElementById('menu_type').value)){
        return;
    }
    console.log('Updating field visibility for timeActive:', listTime, timeActive);
    const activeIndex = listTime.findIndex(time => time.id == timeActive);
    
    if (activeIndex === 0) { // Lần 1 - Show all fields
        showFields(allFields);
    } else if (activeIndex === 1) { // Lần 2 - Show only weight, calf circumference, prealbumin
        const fields = ['cn', 'vong_bap_chan', 'pre_albumin'];
        showFields(fields);
    } else if (activeIndex === 2) { // Lần 3 - Show weight, calf circumference, glucose, triglyceride, cholesterol, red blood cell, hemoglobin, prealbumin
        const fields = ['cn', 'vong_bap_chan', 'glucose', 'triglycerid', 'cholesterol', 'hong_cau', 'hemoglobin', 'pre_albumin'];
        showFields(fields);
    } else if (activeIndex === 3) { // Lần 4 - Show weight, calf circumference, glucose, triglyceride, cholesterol, red blood cell, hemoglobin, albumin, total protein
        const fields = ['cn', 'vong_bap_chan', 'glucose', 'triglycerid', 'cholesterol', 'hong_cau', 'hemoglobin', 'albumin', 'protein_tp'];
        showFields(fields);
    } else if (activeIndex > 3) { // Lần 5 trở đi - Same as lần 4
        const fields = ['cn', 'vong_bap_chan', 'glucose', 'triglycerid', 'cholesterol', 'hong_cau', 'hemoglobin', 'albumin', 'protein_tp'];
        showFields(fields);
    } else { // Mặc định hoặc khi thêm mới (activeIndex = -1)
        showFields(allFields);
    }
}

function hideInputLamSang(){
    let index = listTime.findIndex(s => s.id == timeActive);
    switch(index){
        case 0:
            document.getElementById('pre_albumin').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('phospho').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('magie').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('kali').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('ck').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('med1').classList.toggle('d-none', false);
            document.getElementById('med2').classList.toggle('d-none', false);
            document.getElementById('med3').classList.toggle('d-none', false);
            break;
        case 1:
        case 2:
            document.getElementById('pre_albumin').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('ck').closest('.col-sm-6')?.classList.toggle('d-none', false);
            document.getElementById('phospho').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('magie').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('kali').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('med1').classList.toggle('d-none', false);
            document.getElementById('med2').classList.toggle('d-none', false);
            document.getElementById('med3').classList.toggle('d-none', false);
            break;
        case 3:
            document.getElementById('pre_albumin').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('phospho').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('magie').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('kali').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('ck').closest('.col-sm-6')?.classList.toggle('d-none', true);
            document.getElementById('med1').classList.toggle('d-none', true);
            document.getElementById('med2').classList.toggle('d-none', true);
            document.getElementById('med3').classList.toggle('d-none', true);
            break;
        default: break;
    }
}

// Call updateFieldVisibility when the page loads
$(document).ready(function() {
    updateFieldVisibility();
});
