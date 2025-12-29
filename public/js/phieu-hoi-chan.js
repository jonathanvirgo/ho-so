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

    createLinkList('/standard');
})

function createStandard(patient_id, type, href = ''){
    return new Promise((resolve, reject) => {
        let url = `/standard-create/${patient_id}/${type}`;
    
        let errors = [];
        let param = getDataStandard(type);
    
        if(type == 'danh-gia' && !timeActive){
            toarstError('Vui lòng thêm ngày!');
            errors.push(1);
        }
        if(errors.length > 0){
            return;
        } else {
            if(standardId){
                url = `/standard-update/${patient_id}/${type}`;
                param['id'] = standardId;
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
                            standardId = result.data.insertId;
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

function getDataStandard(type){
    switch(type){
        case 'thong-tin-chung':
            return thongTinChung();
        case 'danh-gia':
            return danhGia();
        default: break;
    }
}

function thongTinChung(){
    return {
        cn: $('#cn').val(),
        cc: $('#cc').val(),
        ctc: $('#ctc').val(),
        chuan_doan_ls: $('#chuan_doan_ls').val(),
        ngay_hoi_chan: $('#ngay_hoi_chan input').val(),
        cn_1_thang: $('#cn_1_thang').val(),
        khau_phan_an: $('#khau_phan_an').val(),
        trieu_chung_th: $('#trieu_chung_th').val(),
        giam_chuc_nang_hd: $('#giam_chuc_nang_hd').val(),
        nhu_cau_chuyen_hoa: $('#nhu_cau_chuyen_hoa').val(),
        kham_lam_sang: $('#kham_lam_sang').val(),
        chon_tt_1: $('[name="chon_tt_1"]:radio:checked').val(),
        tien_su_benh: $('#tien_su_benh').val(),
        tinh_trang_nguoi_benh: $('#tinh_trang_nguoi_benh').val(),
        khau_phan_an_24h: $('#khau_phan_an_24h').val(),
        tieu_hoa: $('#tieu_hoa').val(),
        che_do_dinh_duong: $('#che_do_dinh_duong').val(),
        che_do_dinh_duong_note: $('#che_do_dinh_duong_note').val(),
        duong_nuoi: $('#duong_nuoi').val(),
        dich_vao: $('#dich_vao').val(),
        dich_ra: $('#dich_ra').val(),
        e_nckn: $('#e_nckn').val(),
        can_thiep_kcal: $('#can_thiep_kcal').val(),
        can_thiep_kg: $('#can_thiep_kg').val(),
        can_thiep_note: $('#can_thiep_note').val(),
        ket_qua_can_lam_sang: $('#ket_qua_can_lam_sang').val(),
        bo_sung: $('#bo_sung').val(),
        chu_y: $('#chu_y').val(),
    }
}

function danhGia(){
    return {
        tinh_trang_nguoi_benh: $('#tinh_trang_nguoi_benh').val(),
        khau_phan_an_24h: $('#khau_phan_an_24h').val(),
        tieu_hoa:   $('#tieu_hoa').val(),
        danh_gia: $('#danh_gia').val(),
        ket_qua_can_lam_sang: $('#ket_qua_can_lam_sang').val(),
        can_thiep_kcal: $('#can_thiep_kcal').val(),
        can_thiep_kg: $('#can_thiep_kg').val(),
        can_thiep_note: $('#can_thiep_note').val(),
        che_do_dinh_duong: $('#che_do_dinh_duong').val(),
        che_do_dinh_duong_note: $('#che_do_dinh_duong_note').val(),
        bo_sung: $('#bo_sung').val(),
        chu_y: $('#chu_y').val(),
        time_id: timeActive
    }
}

function addTimes(patient_id, type, dateStr){
    let url = `/standard/add-time/${patient_id}/${type}`; 
    let param = {
        // 2025-01-11 22:11:32
        time: moment(dateStr).format('YYYY-MM-DD HH:mm:ss')
    }
    if(isEditTime){
        param['timeActive'] = idEditTime;
        url = `/standard/update-time/${type}`; 
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

function deleteTime(id){
    let date = $('#time_' + id).text();
    confirmDialog('Xác nhận', `Bạn có muốn xóa ngày ` + date).then(responseData =>{
        if(responseData.isConfirmed && id){
            let type = document.getElementById('type').value;
            $.ajax({
                type: 'POST',
                url: `/standard/delete/time/${id}/${type}`,
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
                    await createStandard(patient_id, type);
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
        url: `/standard/data-time/${patient_id}/${type}`,
        data: {time_id: time_id},
        beforeSend: function () {
            loading.show();
        },
        success: function (result) {
            if (result.success) {
                if(result.data){
                    let data = result.data;
                    setDataTime(type, data);
                    standardId = data.id;
                    isChangeInput = false;
                    setTimeout(() => {
                        loading.hide();
                    }, 300);
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
        case 'danh-gia': setDataTimeDanhGia(data);
            break;
        default: break;
    }
}

function setDataTimeDanhGia(data){
    $('#tinh_trang_nguoi_benh').val(data.tinh_trang_nguoi_benh ? data.tinh_trang_nguoi_benh : '');
    $('#khau_phan_an_24h').val(data.khau_phan_an_24h ? data.khau_phan_an_24h : '');
    $('#tieu_hoa').val(data.tieu_hoa ? data.tieu_hoa : '');
    $('#danh_gia').val(data.danh_gia ? data.danh_gia : '');
    $('#ket_qua_can_lam_sang').val(data.ket_qua_can_lam_sang ? data.ket_qua_can_lam_sang : '');
    $('#can_thiep_kcal').val(data.can_thiep_kcal ? data.can_thiep_kcal : '');
    $('#can_thiep_kg').val(data.can_thiep_kg ? data.can_thiep_kg : '');
    $('#can_thiep_note').val(data.can_thiep_note ? data.can_thiep_note : '');
    document.querySelector('#che_do_dinh_duong').setValue(data.che_do_dinh_duong ? data.che_do_dinh_duong : '');
    $('#bo_sung').val(data.bo_sung ? data.bo_sung : '');
    $('#chu_y').val(data.chu_y ? data.chu_y : '');
    const canThiepKcal = data.can_thiep_kcal && !isNaN(data.can_thiep_kcal) ? parseInt(data.can_thiep_kcal) : 0;
    const canThiepKg = data.can_thiep_kg && !isNaN(data.can_thiep_kg) ? parseInt(data.can_thiep_kg) : 0;

    if(canThiepKcal > 0 && canThiepKg > 0){
        $('#can_thiep_total').text((canThiepKcal * canThiepKg).toFixed(0));
    }else{
        $('#can_thiep_total').text('');
    }
}

function changeStandardPage(event, target, patient_id, type){
    event.preventDefault();
    let href = target.getAttribute('href');
    if(isChangeInput){
        confirmDialog('Xác nhận lưu','Bạn có muốn lưu dữ liệu?').then(async responseData =>{
            if(responseData.isConfirmed){
                await createStandard(patient_id, type, href);
            }else{
                window.location.href = href;
            }
        })
    }else{
        window.location.href = href;
    }
}

function downloadStandard() {
    const patient_id = document.getElementById('patient_id').value;
    if(!patient_id){
        toarstError('Vui lòng chọn bệnh nhân');
        return;
    }
    window.location.href = `/standard-download/${patient_id}`;
}

async function downloadStandardTemplate() {
  try {
    const patient_id = document.getElementById('patient_id').value;
    if(!patient_id){
        toarstError('Vui lòng chọn bệnh nhân');
        return;
    }
    const response = await fetch(`/standard-download-template/${patient_id}`);

    const contentType = response.headers.get("Content-Type");

    if (contentType.includes("application/json")) {
      // Trường hợp lỗi từ server
      const error = await response.json();
      toarstError(error.message || "Tải file thất bại!");
      return;
    }

    if (!response.ok) {
      toarstError("Có lỗi xảy ra khi tải file!");
      return;
    }

    const blob = await response.blob();
    const filename = `phieu-hoi-chan-${patient_id}.docx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Lỗi khi tải file:", err);
    toarstError("Không thể kết nối đến máy chủ.");
  }
}
