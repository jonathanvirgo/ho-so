var isChangeInput = false;

readyDom(() => {
    if (document.getElementById('ngay_input')) {
        ngay_fp = document.querySelector("#ngay")._flatpickr;
        // document.querySelector("#ngay_input").addEventListener("change", function () {
        //     if(this.value){
        //         let checkDuplicate = isDateInList(moment(this.value, '"DD/MM/YYYY"') , listBroading);
        //         if(checkDuplicate){
        //             toarstError('Ngày bạn chọn đã tồn tại!');
        //             ngay_fp.clear();
        //         }
        //     }
        // });
    }
    isChangeInput = false;
})

function addBroading(patient_id, type) {
    let url = `/hoi-chan/add-broading/${patient_id}/${type}`;

    let errors = [];
    let param = getDataBroading(type);
    if (boardingId) {
        param['id'] = boardingId;
        url = `/hoi-chan/update-broading/${type}`;
    }
    if (errors.length > 0) {
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

function getDataBroading(type) {
    return khauPhanAn();
}

function khauPhanAn() {
    return {
        date: $('#ngay input').val(),
        nd_duong_th: $('#nd_duong_th').val(),
        nd_tinh_mac: $('#nd_tinh_mac').val(),
        note: $('#note').val(),
        xet_nghiem: $('#xet_nghiem').val(),
        y_kien_bs: $('#y_kien_bs').val()
    }
}

function deleteBoarding(id, type, date) {
    confirmDialog('Xác nhận', `Bạn có muốn xóa theo dõi ${type == 'che-do-an-noi-tru' ? 'nội trú' : 'ngoại trú'}:` + moment(date).format('DD/MM/YYYY')).then(responseData => {
        if (responseData.isConfirmed && id) {
            $.ajax({
                type: 'POST',
                url: `/hoi-chan/delete/broading/${id}/${type}`,
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

function openModalEditBoarding(id, type) {
    boardingId = id;
    if (id && type) {
        $('#modal-add-broading').modal('show');
        $.ajax({
            type: 'POST',
            url: `/hoi-chan/get-broading/${id}/${type}`,
            data: {},
            beforeSend: function () {
                loading.show();
            },
            success: function (result) {
                loading.hide();
                if (result.success) {
                    if (result.data) {
                        let data = result.data;
                        ngay_fp.setDate(data.time);
                        $('#note').val(data.note);
                        $('#nd_duong_th').val(data.nd_duong_th);
                        $('#nd_tinh_mac').val(data.nd_tinh_mac);
                        $('#xet_nghiem').val(data.xet_nghiem);
                        $('#y_kien_bs').val(data.y_kien_bs);
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

function openModalCreateBoarding(type) {
    resetBoardingEl(type);
    $('#modal-add-broading').modal('show');
}

function resetBoardingEl() {
    boardingId = '';
    ngay_fp.clear();
    $('#note').val('');
    $('#nd_duong_th').val('');
    $('#nd_tinh_mac').val('');
    $('#xet_nghiem').val('');
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

// =====================================================
// OCR Upload Functions
// =====================================================

/**
 * Xử lý upload ảnh và OCR
 * @param {HTMLInputElement} inputElement - File input element
 */
async function handleOCRUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const targetId = inputElement.dataset.target;
    const statusEl = document.getElementById(`ocr_status_${targetId}`);
    const textareaEl = document.getElementById(targetId);

    // Validate file
    if (!file.type.startsWith('image/')) {
        toarstError('Vui lòng chọn file ảnh!');
        return;
    }

    // Show loading status
    statusEl.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span> Đang xử lý OCR...';
    statusEl.className = 'ocr-status ms-2 text-primary';

    try {
        const result = await processOCR(file);

        if (result.success && result.data?.text) {
            let ocrText = result.data.text;

            // Xử lý ký tự \\n literal thành newline thực sự (nếu còn sót từ API)
            ocrText = ocrText.replace(/\\n/g, '\n');

            // Append text to textarea (không ghi đè nội dung cũ)
            const currentValue = textareaEl.value.trim();
            textareaEl.value = currentValue
                ? currentValue + '\n' + ocrText
                : ocrText;

            // Show success
            statusEl.innerHTML = '<i class="fas fa-check-circle text-success"></i> Thành công!';
            statusEl.className = 'ocr-status ms-2 text-success';

            // Auto-resize textarea
            textareaEl.style.height = 'auto';
            textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px';

            toarstMessage('OCR thành công!');
        } else {
            throw new Error(result.message || 'Không thể đọc được nội dung từ ảnh');
        }
    } catch (error) {
        console.error('OCR Error:', error);
        statusEl.innerHTML = '<i class="fas fa-times-circle text-danger"></i> Thất bại';
        statusEl.className = 'ocr-status ms-2 text-danger';
        toarstError(error.message || 'Có lỗi xảy ra khi xử lý OCR');
    }

    // Reset input để có thể chọn lại cùng file
    inputElement.value = '';

    // Clear status after 3s
    setTimeout(() => {
        statusEl.innerHTML = '';
    }, 3000);
}

/**
 * Gọi API OCR qua backend proxy
 * @param {File} file - File ảnh cần OCR
 * @returns {Promise<Object>} - Kết quả OCR
 */
async function processOCR(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}