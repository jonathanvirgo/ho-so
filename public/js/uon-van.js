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

    createLinkList('/uon-van');
})

function createTetanus(patient_id, type, href = ''){
    return new Promise((resolve, reject) => {
        let url = `/uon-van-create/${patient_id}/${type}`;
    
        let errors = [];
        let param = getDataTetanus(type);
    
        // if(!param.fullname){
        //     toggleErrorHtml('fullname', false, 'Vui lòng nhập họ và tên', true);
        //     errors.push(1);
        // }
        // if(!param.ma_benh_an){
        //     toggleErrorHtml('ma_benh_an', false, 'Vui lòng nhập mã bệnh án', true);
        //     errors.push(1);
        // }
        if(['lam-sang', 'tinh-trang-tieu-hoa', 'sga'].includes(type) && !timeActive){
            toarstError('Vui lòng thêm ngày!');
            errors.push(1);
        }
        if(errors.length > 0){
            return;
        } else {
            if(tetanusId){
                url = `/uon-van-update/${patient_id}/${type}`;
                param['id'] = tetanusId;
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
                            tetanusId = result.data.insertId;
                        }
                        if(href && href.length > 0) window.location.href = href;
                        else toarstMessage('Lưu thành công');
                    } else {
                        toarstError(result.message);
                    }
                    isChangeInput = false;
                    resolve(1)
                },
                error: function (jqXHR, exception, error) {
                    loading.hide();
                    resolve(0)
                    ajax_call_error(jqXHR, exception);
                }
            });
        }
    })
}

function getDataTetanus(type){
    switch(type){
        case 'lam-sang':
            return lamSang();
        case 'tinh-trang-tieu-hoa':
            return tinhTrangTieuHoa();
        case 'sga':
            return sga();
        default: break;
    }
}

function lamSang(){
    return {
        cn: $('#cn').val(),
        cc: $('#cc').val(),
        vong_bap_chan: $('#vong_bap_chan').val(),
        albumin: $('#albumin').val(),
        pre_albumin: $('#pre_albumin').val(),
        hemoglobin: $('#hemoglobin').val(),
        protein: $('#protein').val(),
        phospho: $('#phospho').val(),
        glucose: $('#glucose').val(),
        magie: $('#magie').val(),
        kali: $('#kali').val(),
        ck: $('#ck').val(),
        ure: $('#ure').val(),
        bilirubin: $('#bilirubin').val(),
        creatinin: $('#creatinin').val(),
        benh_ly: $('#benh_ly').val(),
        thuoc: getMed(),
        time_id: timeActive
    }
}

function tinhTrangTieuHoa(){
    return {
        chuong_bung: $('#chuong_bung').val(),
        trao_nguoc: $('[name="trao_nguoc"]:radio:checked').val(),
        tao_bon: $('[name="tao_bon"]:radio:checked').val(),
        phan_long_3_ngay: $('[name="phan_long_3_ngay"]:radio:checked').val(),
        duong_mau_10: $('[name="duong_mau_10"]:radio:checked').val(),
        duong_mau_20: $('[name="duong_mau_20"]:radio:checked').val(),
        so_lan_di_ngoai: $('#so_lan_di_ngoai').val(),
        tinh_trang_phan: $('#tinh_trang_phan').val(),
        dich_ton_du: $('#dich_ton_du').val(),
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

function getMed(){
    let inputMed = document.querySelectorAll('input[name="uon-van-med"]');
    let listMed = [];
    if(inputMed && inputMed.length > 0){
        for(let item of inputMed){
            listMed.push({
                "id": item.getAttribute('data-id'),
                "name": item.getAttribute('data-name'),
                "ham_luong": item.value
            })
        }
    }
    return JSON.stringify(listMed);
}

function addTimes(patient_id, type, dateStr){
    let url = `/uon-van/add-time/${patient_id}/${type}`; 
    let param = {
        // 2025-01-11 22:11:32
        time: moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
    }
    if(isEditTime){
        param['timeActive'] = idEditTime;
        url = `/uon-van/update-time/${type}`; 
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
                        if(listTime.length == 4 && document.getElementById('type').value == 'lam-sang') document.getElementById('datepicker').parentElement.classList.toggle('d-none', true);
                        else  document.getElementById('datepicker').classList.toggle('d-none', false);
                    }
                    timeActive = result.insertId;
                    document.getElementById('list-date').insertAdjacentHTML('beforeend', `
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

function addBroading(patient_id, type){
    let url = `/uon-van/add-broading/${patient_id}/${type}`;
    
    let errors = [];
    let param = getDataBroading(type);
    if(boardingId){
        param['id'] = boardingId;
        url = `/uon-van/update-broading/${type}`;
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
    return khauPhanAn();
}

function khauPhanAn(){
    return {
        date: $('#ngay input').val(),
        nd_duong_th: $('#nd_duong_th').val(),
        nd_tinh_mac: $('#nd_tinh_mac').val(),
        note: $('#note').val(),
    }
}

function deleteBoarding(id, type, date){
    confirmDialog('Xác nhận', `Bạn có muốn xóa theo dõi ${type == 'che-do-an-noi-tru' ? 'nội trú' : 'ngoại trú'}:` + moment(date).format('DD/MM/YYYY')).then(responseData =>{
        if(responseData.isConfirmed && id){
            $.ajax({
                type: 'POST',
                url: `/uon-van/delete/broading/${id}/${type}`,
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
                url: `/uon-van/delete/time/${id}/${type}`,
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
            url: `/uon-van/get-broading/${id}/${type}`,
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
                        $('#nd_duong_th').val(data.nd_duong_th);
                        $('#nd_tinh_mac').val(data.nd_tinh_mac);
                        
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
    $('#nd_duong_th').val('');
    $('#nd_tinh_mac').val('');
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
                    await createTetanus(patient_id, type);
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
        url: `/uon-van/data-time/${patient_id}/${type}`,
        data: {time_id: time_id},
        beforeSend: function () {
            loading.show();
        },
        success: function (result) {
            if (result.success) {
                if(result.data){
                    let data = result.data;
                    setDataTime(type, data);
                    tetanusId = data.id;
                    isChangeInput = false;
                    setTimeout(() => {
                        loading.hide();
                    }, 500);
                }else{
                    loading.hide();
                }
            } else {
                loading.hide();
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
        case 'lam-sang': setDataTimeLamSang(data);
            hideInputLamSang();
            break;
        case 'tinh-trang-tieu-hoa': setDataTimeTieuHoa(data)
            break;
        case 'sga': setDataTimeSga(data)
            break;
        default: break;
    }
}

function setDataTimeLamSang(data){
    $('#cn').val(data.cn ? data.cn : '');
    $('#cc').val(data.cc ? data.cc : '');
    $('#vong_bap_chan').val(data.vong_bap_chan ? data.vong_bap_chan : '');
    $('#albumin').val(data.albumin ? data.albumin : '');
    $('#pre_albumin').val(data.pre_albumin ? data.pre_albumin : '');
    $('#hemoglobin').val(data.hemoglobin ? data.hemoglobin : '');
    $('#protein').val(data.protein ? data.protein : '');
    $('#phospho').val(data.phospho ? data.phospho : '');
    $('#glucose').val(data.glucose ? data.glucose : '');
    $('#magie').val(data.magie ? data.magie : '');
    $('#kali').val(data.kali ? data.kali : '');
    $('#ck').val(data.ck ? data.ck : '');
    $('#ure').val(data.ure ? data.ure : '');
    $('#bilirubin').val(data.bilirubin ? data.bilirubin : '');
    $('#creatinin').val(data.creatinin ? data.creatinin : '');
    $('#benh_ly').val(data.benh_ly ? data.benh_ly : '');
    setDataTimeMed(data.thuoc);
}

function setDataTimeTieuHoa(data){
    document.querySelector('#chuong_bung').setValue(data.chuong_bung ? data.chuong_bung : '');
    if(data.trao_nguoc){
        $(`input[name="trao_nguoc"][value="${data.trao_nguoc}"]`).prop('checked', true);
    }else{
        $(`input[name="trao_nguoc"]`).prop('checked', false);
    }
    if(data.tao_bon){
        $(`input[name="tao_bon"][value="${data.tao_bon}"]`).prop('checked', true);
    }else{
        $(`input[name="tao_bon"]`).prop('checked', false);
    }
    if(data.phan_long_3_ngay){
        $(`input[name="phan_long_3_ngay"][value="${data.phan_long_3_ngay}"]`).prop('checked', true);
    }else{
        $(`input[name="phan_long_3_ngay"]`).prop('checked', false);
    }
    if(data.duong_mau_10){
        $(`input[name="duong_mau_10"][value="${data.duong_mau_10}"]`).prop('checked', true);
    }else{
        $(`input[name="duong_mau_10"]`).prop('checked', false);
    }
    if(data.duong_mau_20){
        $(`input[name="duong_mau_20"][value="${data.duong_mau_20}"]`).prop('checked', true);
    }else{
        $(`input[name="duong_mau_20"]`).prop('checked', false);
    }
    
    $('#so_lan_di_ngoai').val(data.so_lan_di_ngoai ? data.so_lan_di_ngoai : '');
    
    $('#tinh_trang_phan').val(data.tinh_trang_phan ? data.tinh_trang_phan : '');
    $('#dich_ton_du').val(data.dich_ton_du ? data.dich_ton_du : '');
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

function setDataTimeMed(data){
    document.querySelectorAll('input[name="uon-van-med"]').forEach(item => item.value = '');
    if(data && isJSON(data)){
        data = JSON.parse(data);
        if(data.length > 0){
            for(let item of data){
                document.querySelector(`input[data-id="${item.id}"]`).value = item.ham_luong;
            }
        }
    }
} 

function changeTetanusPage(event, target, patient_id, type){
    event.preventDefault();
    let pathName = window.location.pathname;
    let href = target.getAttribute('href');
    if(pathName == 'khau-phan-an'){
        window.location.href = href;
    }else{
        if(isChangeInput){
            confirmDialog('Xác nhận lưu','Bạn có muốn lưu dữ liệu?').then(async responseData =>{
                if(responseData.isConfirmed){
                    await createTetanus(patient_id, type, href);
                }else{
                    window.location.href = href;
                }
            })
        }else{
            window.location.href = href;
        }
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