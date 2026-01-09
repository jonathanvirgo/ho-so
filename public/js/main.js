var initializedFlags = {};
var loading = $("#loading-page");
  let cropper = null;
let currentPhotoId = null;
let patientPhotos = [];
let lightbox = null;


function readyDom(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

readyDom(() =>{
    initVirtualSelect('[data-plugin="virtual-select"]');
    initFlatpickr('[data-plugin="flatpickr"]');
    expandTextarea();
    setupTableViewToggle();
})

function initVirtualSelect(query){
    // Khởi tạo virtual select
    const elVirtualSelect = document.querySelectorAll(query);
    Array.prototype.forEach.call(elVirtualSelect, (el) => {
        const id = el.id; // Lấy ID để làm khóa
        // Đánh dấu trạng thái khởi tạo là false
        initializedFlags[id] = false;
        let defaults = {
            ele: el,
            search: false,
            position: "auto"
        };
        // Set options
        let options = el.getAttribute('data-options');
        if(isJSON(options)) options = JSON.parse(options);
        else options = [];
        options = options && Array.isArray(options) && options.length > 0 ? options : [];
        if(options.length > 0) defaults['options'] = options;
        
        // Set Value
        let value = el.getAttribute('data-value');
        let configAttr = el.getAttribute('data-config');
        
        // Parse config attribute safely
        let parsedConfig = {};
        if(isJSON(configAttr)) {
            parsedConfig = JSON.parse(configAttr);
        }
        
        if(value){
            if(parsedConfig.multiple && isJSON(value)){
                defaults['selectedValue'] = JSON.parse(value);
            } else {
                defaults['selectedValue'] = value;
            }
        } 
        
        // Config - sử dụng parsedConfig thay vì parse lại
        let config = extendObject({}, defaults, parsedConfig);
        VirtualSelect.init(config);
    });
}

// ================== Generic Toggle List/Grid for tables ==================
function setupTableViewToggle(){
    try{
        const containers = document.querySelectorAll('.table-responsive');
        containers.forEach((container, idx) => {
            if(container.getAttribute('data-toggle-initialized') === '1') return;
            const table = container.querySelector('table.table');
            if(!table) return;

            // Identify table key for persistence
            const tableId = table.id && table.id.length > 0 ? table.id : `table-index-${idx}`;
            const LS_KEY = `table_view_mode_${tableId}`; // values: list|grid

            // Inject toolbar before the table container if not present
            const toolbarClass = 'toggle-view-toolbar';
            let toolbar = container.previousElementSibling;
            const needCreate = !(toolbar && toolbar.classList && toolbar.classList.contains(toolbarClass));
            if(needCreate){
                const wrapper = document.createElement('div');
                wrapper.className = `${toolbarClass} d-flex justify-content-end mb-2`;
                wrapper.innerHTML = `
                    <div class="btn-group d-xl-none" role="group" aria-label="Toggle view">
                        <button type="button" class="btn btn-outline-secondary btn-sm btn-list-view"><i class="fas fa-list-ul me-1"></i>Danh sách</button>
                        <button type="button" class="btn btn-outline-secondary btn-sm btn-grid-view"><i class="fas fa-th-large me-1"></i>Grid</button>
                    </div>`;
                container.parentNode.insertBefore(wrapper, container);
                toolbar = wrapper;
            }

            const btnList = toolbar.querySelector('.btn-list-view');
            const btnGrid = toolbar.querySelector('.btn-grid-view');

            function applyMode(mode){
                if(mode === 'grid'){
                    container.classList.add('grid-mode');
                    btnGrid.classList.add('btn-primary');
                    btnGrid.classList.remove('btn-outline-secondary');
                    btnList.classList.add('btn-outline-secondary');
                    btnList.classList.remove('btn-primary');
                }else{
                    container.classList.remove('grid-mode');
                    btnList.classList.add('btn-primary');
                    btnList.classList.remove('btn-outline-secondary');
                    btnGrid.classList.add('btn-outline-secondary');
                    btnGrid.classList.remove('btn-primary');
                }
                if(window.responsiveTable){
                    window.responsiveTable.processTable(table);
                }
            }

            // Restore saved mode
            const saved = localStorage.getItem(LS_KEY) || 'list';
            applyMode(saved);

            btnList.addEventListener('click', () => {
                localStorage.setItem(LS_KEY, 'list');
                applyMode('list');
            });
            btnGrid.addEventListener('click', () => {
                localStorage.setItem(LS_KEY, 'grid');
                applyMode('grid');
            });

            // Re-apply after DataTable draw
            if(window.jQuery && typeof jQuery.fn.DataTable !== 'undefined'){
                jQuery(table).on('draw.dt', function(){
                    const mode = localStorage.getItem(LS_KEY) || 'list';
                    applyMode(mode);
                });
            }

            // Mark as initialized
            container.setAttribute('data-toggle-initialized', '1');
        });
    }catch(err){
        console.error('setupTableViewToggle error', err);
    }
}

// Expose helper for manual usage if needed
window.applyViewModeForTable = function(tableId, mode){
    const table = document.getElementById(tableId);
    if(!table) return;
    const container = table.closest('.table-responsive');
    if(!container) return;
    const toolbar = container.previousElementSibling && container.previousElementSibling.classList.contains('toggle-view-toolbar')
        ? container.previousElementSibling
        : null;
    const btnList = toolbar ? toolbar.querySelector('.btn-list-view') : null;
    const btnGrid = toolbar ? toolbar.querySelector('.btn-grid-view') : null;
    const LS_KEY = `table_view_mode_${tableId}`;
    if(mode !== 'grid') mode = 'list';
    localStorage.setItem(LS_KEY, mode);
    if(mode === 'grid'){
        container.classList.add('grid-mode');
        if(btnGrid){ btnGrid.classList.add('btn-primary'); btnGrid.classList.remove('btn-outline-secondary'); }
        if(btnList){ btnList.classList.add('btn-outline-secondary'); btnList.classList.remove('btn-primary'); }
    }else{
        container.classList.remove('grid-mode');
        if(btnList){ btnList.classList.add('btn-primary'); btnList.classList.remove('btn-outline-secondary'); }
        if(btnGrid){ btnGrid.classList.add('btn-outline-secondary'); btnGrid.classList.remove('btn-primary'); }
    }
    if(window.responsiveTable){ window.responsiveTable.processTable(table); }
}
//'[data-plugin="flatpickr"]'
function initFlatpickr(query){
    const elFlatpickr = document.querySelectorAll(query);
    Array.prototype.forEach.call(elFlatpickr, (el) => {
        let defaults = {
            dateFormat: 'd/m/Y',
            conjunction: ' - ',
            wrap: true,
            animate: false,
            locale: 'vn',
            // altInput: true
        };
        if (el.dataset.parent) {
            defaults.appendTo = document.querySelector(el.dataset.parent);
        }
        let options = extendObject({}, defaults, JSON.parse(el.getAttribute('data-options')));
        flatpickr(el, options);
    });
}

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 2500,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
});

function getDataUrl(name){
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function toarstMessage(message, title = '', timer = 2500){
    Toast.fire({
        icon: "success",
        title: title,
        text: message,
        timer: timer
    });
}

function toarstError(message, title = '', timer = 2500){
    Toast.fire({
        icon: "error",
        title: title,
        text: message,
        timer: timer
    });
}

function toarstWarning(message, title, timer = 2500){
    Toast.fire({
        icon: "warning",
        titleText: title,
        text: message,
        timer: timer
    });
}

function confirmDialog(title, message){
    return new Promise((resolve, reject) => {
        Swal.fire({
            title: title,
            text: message,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#4e73df",
            cancelButtonColor: "#e74a3b",
            confirmButtonText: "Đồng ý!"
        }).then((result) => {
            resolve(result)
        });
    })
}

function toarstInfo(message, title){
    Toast.fire({
        icon: "info",
        title: title,
        text: message
    });
}

function isObject(obj) {
    return obj === Object(obj);
}

function isJSON(str) {
    try {
        JSON.parse(str);
        return true;  // Nếu JSON.parse không ném lỗi, chuỗi hợp lệ
    } catch (e) {
        return false; // Nếu JSON.parse ném lỗi, chuỗi không hợp lệ
    }
}

function checkEmailString(email) {
    let reg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return reg.test(email);
}

function ajax_call_error(jqXHR, exception){
    console.log('ajax_call_error', exception)
    var msg = '';
    if (jqXHR.status === 0) {
        msg = 'Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';
    } else if (jqXHR.status == 404) {
        msg = 'Không tìm thấy trang được yêu cầu. [404]';
    } else if (jqXHR.status == 500) {
        msg = 'Lỗi máy chủ nội bộ [500].';
    } else if (exception === 'parsererror') {
        msg = 'Phân tích cú pháp JSON không thành công.';
    } else if (exception === 'timeout') {
        msg = 'Lỗi hết thời gian.';
    } else if (exception === 'abort') {
        msg = 'Yêu cầu Ajax đã bị hủy bỏ.';
    } else {
        msg = jqXHR.responseText;
    }
}

/* exported extend, ready */
function extendObject(out) {
    out = out || {};

    for (let i = 1; i < arguments.length; i++) {
        if (!arguments[i]) {
            continue;
        }

        for (let key in arguments[i]) {
            if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                out[key] = arguments[i][key];
            }
        }
    }

    return out;
};

function isVietnamesePhoneNumberValid(number) {
    if(number && number.length > 0) number = number.trim();
    return /(^(\+84|0)[35789]\d{8}$)|(^(\+84|0)(2\d{1,2})\d{7}$)/.test(number);
}

function toggleErrorHtml(id, check, text, borderInput = true){
    console.log('toggleErrorHtml', id, check, text, borderInput);
    if(!document.getElementById(id + '_error')) return;
    if(text) document.getElementById(id + '_error').innerText = text;
    if(check){
        // Field đúng ẩn border text
        if (!document.getElementById(id + '_error').classList.contains('d-none')) document.getElementById(id + '_error').classList.add('d-none');
        if(borderInput && document.getElementById(id)){
            if (document.getElementById(id).classList.contains('border-danger')) document.getElementById(id).classList.remove('border-danger');
        }
    }else{
        // Field sai hiện border text
        if (document.getElementById(id + '_error').classList.contains('d-none')) document.getElementById(id + '_error').classList.remove('d-none');
        if(borderInput && document.getElementById(id)){
            if (!document.getElementById(id).classList.contains('border-danger')) document.getElementById(id).classList.add('border-danger');
        }
    }
}

function removeElement(arr, index) {
    if (index > -1 && index < arr.length) {
        arr[index] = arr[arr.length - 1];  // Thay thế phần tử cần xóa bằng phần tử cuối cùng
        arr.pop();  // Xóa phần tử cuối cùng
    }
    return arr;
}

function checkInputEmpty(evt, text, isBorder){
    toggleErrorHtml(evt.target.id, (evt.target.value && evt.target.value !== 'no_value') ? true : false, text, isBorder == 0 ? true : false);
}

function checkEmailInput(evt, text, isBorder){
    toggleErrorHtml(evt.target.id, checkEmailString(evt.target.value) ? true : false, text, isBorder == 0 ? true : false);
}

function checkPhoneInput(evt, text, isBorder){
    toggleErrorHtml(evt.target.id, isVietnamesePhoneNumberValid(evt.target.value) ? true : false, text, isBorder == 0 ? true : false);
}

function formatThreeDigits( integerStr ){
    var len = integerStr.length;
    var formatted = "";

    var breakpoint = (len-1) % 3; // after which index to place the dot

    for(i = 0; i < len; i++){
      formatted += integerStr.charAt(i);
      if(i % 3 === breakpoint){
        if(i < len-1) // don't add dot for last digit
          formatted += ".";
      }
    }

    return formatted;
}

function formatInputNumber(evt, decimal = false){
    let value = evt.target.value;
    let val =  parseInt(value.replace(/[^0-9]/g,''));
    if(decimal) val =  parseInt(value.replace(/[^0-9.]/g,''));
    if(isNaN(val)) val = '';
    let value2 = formatThreeDigits(String(val));
    evt.target.value = value2;
}

function formatInputFloat(evt){
    let value = evt.target.value;

    // Kiểm tra nếu giá trị không phải số hợp lệ
    if (!/^\d*\.?\d*$/.test(value)) {
        evt.target.value = value.slice(0, -1); // Xóa ký tự vừa nhập
    }
}

function convertStringNumber(text){
    if(text){
        let value = parseInt(text.replace(/[^0-9]/g,''));
        return value;
    }else{
        return 0
    }
}

function removeDuplicatesByKey(arr, key) {
    const uniqueArray = [];
    const duplicateArray = [];
    const valueSet = new Set();

    arr.forEach(obj => {
        const value = obj[key]; // Lấy giá trị của key trong object

        // Kiểm tra nếu 'value' đã tồn tại trong Set
        if (valueSet.has(value)) {
            // Nếu trùng, thêm vào mảng duplicateArray
            duplicateArray.push(obj);
        } else {
            // Nếu không trùng, thêm vào Set và uniqueArray
            valueSet.add(value);
            uniqueArray.push(obj);
        }
    });

    return { uniqueArray, duplicateArray };
}

function removeDuplicatesByIndex(arr, index) {
    const uniqueArray = [];
    const duplicateArray = [];
    const valueSet = new Set();

    arr.forEach(subArr => {
        const value = subArr[index]; // Lấy giá trị từ phần tử tại index

        // Kiểm tra nếu 'value' đã tồn tại trong Set
        if (valueSet.has(value)) {
            // Nếu trùng, thêm vào mảng duplicateArray
            duplicateArray.push(subArr);
        } else {
            // Nếu không trùng, thêm vào Set và uniqueArray
            valueSet.add(value);
            uniqueArray.push(subArr);
        }
    });

    return { uniqueArray, duplicateArray };
}

function changeOptionsVirtualSelect(el, id, options){
    if(options && Array.isArray(options)){
        if(el){
            el.setOptions(options, true);
        }else if(id){
            document.querySelector('#' + id).setOptions(options, true);
        }
    }
}

function escapeHtml(string) {
    if (string == null) {
      return '';
    }
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
}

function calculateAge(selectedDate) {
    // Kiểm tra nếu ngày được cung cấp hợp lệ
    if (!selectedDate) {
        console.error("Ngày không hợp lệ!");
        return null;
    }

    // Chuyển đổi ngày sang moment
    const birthDate = moment(selectedDate);
    const today = moment(); // Ngày hiện tại

    // Kiểm tra nếu ngày sinh hợp lệ
    if (!birthDate.isValid()) {
        console.error("Ngày sinh không hợp lệ!");
        return null;
    }

    // Tính tuổi theo năm
    const ageInYears = today.diff(birthDate, 'years');
    
    // Nếu dưới 2 tuổi, tính theo tháng
    if (ageInYears < 2) {
        const ageInMonths = today.diff(birthDate, 'months');
        return `${ageInMonths} tháng`; // Trả về số tháng
    }

    return `${ageInYears} tuổi`; // Trả về số năm
}

function setFormValues(formId, data) {
    // Lấy form element
    const $form = $(`#${formId}`);
    
    // Duyệt qua tất cả các phần tử có attribute name trong form
    $form.find('[name]').each(function() {
        const $element = $(this);
        const name = $element.attr('name');
        const value = data[name] !== undefined ? data[name] : '';
        
        // Kiểm tra xem element có phải là VirtualSelect không
        if ($element.hasClass('vscomp-hidden-input')) {
            // Là hidden input của VirtualSelect
            const virtualSelect = $element.closest('.vscomp-ele')[0];
            if (virtualSelect && virtualSelect.setValue) {
                virtualSelect.setValue(value);
            }
        } else {
            // Xử lý các input thông thường
            const tagName = $element.prop('tagName').toLowerCase();
            const type = $element.attr('type')?.toLowerCase();
            
            if (tagName === 'input' || tagName === 'textarea') {
                if (type === 'checkbox' || type === 'radio') {
                    $element.prop('checked', value === true || value === 'true' || value === 1 || value === '1');
                } else {
                    $element.val(value);
                }
            } else if (tagName === 'select') {
                $element.val(value);
            }
        }
    });
}

// Lấy dữ liệu để gửi Ajax (nếu cần)
function getFormData(formId) {
    const $form = $(`#${formId}`);
    const data = {};
    
    $form.find('[name]').each(function() {
        const $element = $(this);
        const name = $element.attr('name');
        
        if ($element.hasClass('vscomp-hidden-input')) {
            const virtualSelect = $element.closest('.vscomp-ele')[0];
            data[name] = virtualSelect?.getSelectedOptions()?.[0]?.value || '';
        } else {
            const type = $element.attr('type')?.toLowerCase();
            if (type === 'checkbox' || type === 'radio') {
                data[name] = $element.prop('checked');
            } else {
                data[name] = $element.val();
            }
        }
    });
    
    return data;
}

function expandTextarea() {
    $('textarea').each(function () {
        if (this.scrollHeight !== 0) {
            this.setAttribute('style', 'height:' + (this.scrollHeight + 8) + 'px;overflow-y:hidden;');
        } else {
            this.setAttribute('style', 'height:auto;');
        }
    }).on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight + 8) + 'px';
    });
}

function createLinkList(path){
    let tag = document.createElement('a');
    tag.setAttribute('href', path);
    tag.innerHTML = 'Danh sách';
    document.querySelector('#sidebarToggleTop').insertAdjacentElement('afterend', tag);
}



// Hàm hiển thị thông tin chi tiết bệnh nhân trong modal
function displayPatientDetail(patient) {
    const genderText = patient.gender == 1 ? 'Nam' : (patient.gender == 0 ? 'Nữ' : 'Không xác định');
    const trinhDoOptions = ['Dưới THPT', 'THPT', 'Trung cấp/cao đẳng', 'Đại học/sau đại học'];
    const ngheNghiepOptions = ['Công nhân', 'Nông dân', 'Tự do', 'Viên chức', 'Khác'];
    const xepLoaiKTOptions = ['Nghèo', 'Cận nghèo', 'Không xếp loại/Không biết'];
    const danTocOptions = ['Kinh', 'Khác'];

    const formatDate = (dateString) => {
        if (!dateString || dateString === '0000-00-00') return 'Chưa cập nhật';
        return moment(dateString).format('DD/MM/YYYY');
    };

    const formatDateTime = (dateString) => {
        if (!dateString || dateString === '0000-00-00 00:00:00') return 'Chưa cập nhật';
        return moment(dateString).format('DD/MM/YYYY HH:mm');
    };
    const age = calculateAge(patient.birthday);

    let html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">Thông tin cơ bản</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Họ tên:</strong></td>
                                <td>${patient.fullname || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Số điện thoại:</strong></td>
                                <td>${patient.phone || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Giới tính:</strong></td>
                                <td>${genderText}</td>
                            </tr>
                            <tr>
                                <td><strong>Ngày sinh:</strong></td>
                                <td>${formatDate(patient.birthday)} (${age})</td>
                            </tr>
                            <tr>
                                <td><strong>Mã bệnh án:</strong></td>
                                <td>${patient.ma_benh_an || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Ngày nhập viện:</strong></td>
                                <td>${formatDate(patient.ngay_nhap_vien)}</td>
                            </tr>
                            <tr>
                                <td><strong>Phòng điều trị:</strong></td>
                                <td>${patient.phong_dieu_tri || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Dân tộc:</strong></td>
                                <td>${patient.dan_toc ? danTocOptions[parseInt(patient.dan_toc) + 1] || 'Khác' : 'N/A'}${patient.dan_toc_khac ? ' (' + patient.dan_toc_khac + ')' : ''}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">Thông tin bổ sung</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Trình độ học vấn:</strong></td>
                                <td>${patient.trinh_do ? trinhDoOptions[parseInt(patient.trinh_do) + 1] || 'N/A' : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Nghề nghiệp:</strong></td>
                                <td>${patient.nghe_nghiep ? ngheNghiepOptions[ parseInt(patient.nghe_nghiep) + 1] || 'Khác' : 'N/A'}${patient.nghe_nghiep_khac ? ' (' + patient.nghe_nghiep_khac + ')' : ''}</td>
                            </tr>
                            <tr>
                                <td><strong>Nơi ở:</strong></td>
                                <td>${patient.noi_o || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Quê quán:</strong></td>
                                <td>${patient.que_quan || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Xếp loại kinh tế:</strong></td>
                                <td>${patient.xep_loai_kt ? xepLoaiKTOptions[parseInt(patient.xep_loai_kt) + 1] || 'N/A' : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Khoa:</strong></td>
                                <td>${patient.khoa || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Cân nặng:</strong></td>
                                <td>${patient.cn || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Chiều cao:</strong></td>
                                <td>${patient.cc || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">Thông tin y tế</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Chẩn đoán:</strong>
                                <p>${patient.chuan_doan || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Tiền sử bệnh:</strong>
                                <p>${patient.tien_su_benh || 'N/A'}</p>
                            </div>
                        </div>
                        ${patient.dieu_tra_vien ? `
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Điều tra viên:</strong>
                                <p>${patient.dieu_tra_vien}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Ngày hội chẩn:</strong>
                                <p>${formatDateTime(patient.ngay_hoi_chan)}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0">Trạng thái</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <span class="badge ${patient.active == 2 ? 'bg-danger' : 'bg-success'}">
                                    ${patient.active == 2 ? 'Đã ra viện' : 'Đang điều trị'}
                                </span>
                            </div>
                            <div class="col-md-4">
                                <span class="badge ${patient.bien_ban == 1 ? 'bg-primary' : 'bg-secondary'}">
                                    ${patient.bien_ban == 1 ? 'Có biên bản' : 'Chưa có biên bản'}
                                </span>
                            </div>
                            <div class="col-md-4">
                                <small class="text-muted">Tạo lúc: ${formatDateTime(patient.created_at)}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#patientDetailContent').html(html);
}

// Helper parse cho Virtual Select (support string/array)
function parseSelectedValues(val){
    if(val == null) return [];
    if(Array.isArray(val)) return val.map(v => parseInt(v, 10)).filter(v => !Number.isNaN(v));
    if(typeof val === 'string'){
        const trimmed = val.trim();
        if(trimmed.length === 0) return [];
        return trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(v => !Number.isNaN(v));
    }
    return [];
}

function parseNumber(str) {
    if(typeof str !== 'string') return str;
    // Giữ lại số và dấu .
    let cleaned = str.replace(/[^0-9.]/g, "");
  
    if (cleaned === "") return null; // không có số thì trả về null
  
    // Nếu là số nguyên
    if (/^\d+$/.test(cleaned)) {
      return parseInt(cleaned, 10);
    }
  
    // Nếu có dấu thập phân
    return parseFloat(cleaned);
}

  /**
 * Xóa dấu tiếng Việt và chuyển về ký tự ASCII
 * @param {string} str - Chuỗi cần xử lý
 * @returns {string} - Chuỗi đã xóa dấu
 */
function removeVietnameseAccents(str) {
    const from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ" +
                 "ÀÁÃẢẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆĐÙÚỦŨỤƯỪỨỬỮỰÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÌÍỈĨỊÄËÏÎÖÜÛÑÇÝỲỸỴỶ";
    const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy" +
                 "AAAAAAAAAAAAAAAAAEEEEEEEEEEEDUUUUUUUUUUUOOOOOOOOOOOOOOOOOIIIIIAEIIOUUNCYYYYY";
    
    let result = str;
    for (let i = 0; i < from.length; i++) {
        result = result.replace(new RegExp(from[i], 'g'), to[i]);
    }
    
    return result;
}
/**
 * Tạo URL slug từ chuỗi tiếng Việt
 * @param {string} text - Chuỗi cần chuyển thành slug
 * @returns {string} - URL slug
 */
function createSlug(text) {
    return removeVietnameseAccents(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/-+/g, '-') // Thay nhiều dấu gạch ngang thành một
        .replace(/^-|-$/g, ''); // Xóa dấu gạch ngang ở đầu và cuối
}

function setupDeleteButton(patientId) {
    const deleteBtn = document.getElementById('glightbox-delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Delete button clicked, currentPhotoId:', currentPhotoId);

            if (!currentPhotoId) {
                toarstError('Không tìm thấy ảnh để xóa');
                return;
            }

            // Use SweetAlert2 directly if confirmDialog not working
            const result = await Swal.fire({
                title: 'Xác nhận xóa',
                text: 'Bạn có chắc muốn xóa ảnh này?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Xóa',
                cancelButtonText: 'Hủy'
            });

            if (!result.isConfirmed) return;

            loading.show();
            try {
                const response = await fetch(`/patient/${id}/photo/${currentPhotoId}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    if (lightbox) lightbox.close();
                    toarstMessage('Đã xóa ảnh');
                    loadPatientPhotos(patientId);
                } else {
                    toarstError(data.message || 'Xóa thất bại');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toarstError('Có lỗi xảy ra khi xóa ảnh');
            } finally {
                loading.hide();
            }
        };
    }
}

async function loadPatientPhotos(patientId) {
    try {
        const response = await fetch(`/patient/${patientId}/photos`);
        const data = await response.json();
        const container = document.getElementById(`gallery-${patientId}`);
        patientPhotos = data.photos || [];

        if (data.success && patientPhotos.length > 0) {
            // Stacked photos display - show max 3 visible + count badge
            const maxVisible = 3;
            const visiblePhotos = patientPhotos.slice(0, maxVisible);
            const remaining = patientPhotos.length - maxVisible;

            let html = '<div class="stacked-photos" onclick="openGallery()" title="Xem ' + patientPhotos.length + ' ảnh">';
            html += visiblePhotos.map((photo, i) =>
                `<img src="${photo.photo_url}" class="gallery-thumb" data-id="${photo.id}">`
            ).join('');

            if (remaining > 0) {
                html += `<span class="photo-count">+${remaining}</span>`;
            }
            html += '</div>';
            container.innerHTML = html;
        } else {
            // container.innerHTML = '<span class="no-photos-badge"><i class="fas fa-image me-1"></i>Chưa có ảnh</span>';
            container.innerHTML = '<span></span>'; // Empty to keep layout clean
        }
    } catch (error) {
        console.error('Load photos error:', error);
    }
}

function openGallery() {
    if (patientPhotos.length === 0) return;

    const deleteBtn = document.getElementById('glightbox-delete-btn');

    // Prepare GLightbox elements
    const elements = patientPhotos.map(photo => ({
        href: photo.photo_url,
        type: 'image'
    }));

    // Initialize GLightbox
    lightbox = GLightbox({
        elements: elements,
        touchNavigation: true,
        loop: true,
        autoplayVideos: false,
        closeButton: true
    });

    // Listen for slide change to update current photo ID
    lightbox.on('slide_changed', ({ prev, current }) => {
        updateCurrentPhotoId(current.index);
    });

    // Listen for close to hide delete button
    lightbox.on('close', () => {
        deleteBtn.style.display = 'none';
        currentPhotoId = null;
    });

    // Open gallery
    lightbox.open();

    // Show delete button after gallery opens
    setTimeout(() => {
        deleteBtn.style.display = 'block';
        updateCurrentPhotoId(0);
    }, 100);
}

function updateCurrentPhotoId(index) {
    if (patientPhotos[index]) {
        currentPhotoId = patientPhotos[index].id;
    }
}

function openPhotoUpload(patientId) {
    document.getElementById(`photo-input-${patientId}`).click();
}

function openCamera(patientId) {
    document.getElementById(`camera-input-${patientId}`).click();
}

function showCropModal(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toarstError('Vui lòng chọn file ảnh');
        input.value = '';
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        toarstError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const cropImage = document.getElementById('crop-image');
        cropImage.src = e.target.result;

        // Destroy existing cropper
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cropPhotoModal'));
        modal.show();

        // Initialize cropper after modal is shown
        document.getElementById('cropPhotoModal').addEventListener('shown.bs.modal', function initCropper() {
            cropper = new Cropper(cropImage, {
                aspectRatio: NaN, // Free-form cropping
                viewMode: 2,
                dragMode: 'move',
                autoCropArea: 0.9,
                cropBoxResizable: true,
                cropBoxMovable: true,
                guides: true,
                center: true,
                highlight: true,
                background: true,
                responsive: true
            });
            this.removeEventListener('shown.bs.modal', initCropper);
        }, { once: true });
    };

    reader.readAsDataURL(file);
    input.value = ''; // Reset input
}

function rotateCropImage(degree) {
    if (cropper) cropper.rotate(degree);
}

function zoomCropImage(ratio) {
    if (cropper) cropper.zoom(ratio);
}

async function uploadCroppedPhoto(patientId) {
    console.log('Uploading cropped photo for patientId:', patientId);
    if (!cropper || !patientId) return;

    // Get cropped canvas (keep user's crop dimensions)
    const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });

    if (!canvas) {
        toarstError('Không thể cắt ảnh');
        return;
    }

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('cropPhotoModal')).hide();

    // Show loading
    loading.show();

    // Convert canvas to blob and upload
    canvas.toBlob(async function (blob) {
        const formData = new FormData();
        formData.append('photo', blob, 'patient-photo.jpg');

        try {
            const response = await fetch(`/patient/${patientId}/upload-photo`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                toarstMessage('Upload ảnh thành công!');
                loadPatientPhotos(patientId);
            } else {
                toarstError(result.message || 'Upload thất bại');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toarstError('Có lỗi xảy ra khi upload ảnh');
        } finally {
            loading.hide();
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        }
    }, 'image/jpeg', 0.85);
}

// viewPhoto and deleteCurrentPhoto functions moved to GLightbox integration above

// Clean up cropper when modal is hidden
document.getElementById('cropPhotoModal')?.addEventListener('hidden.bs.modal', function () {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
});