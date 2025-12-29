/**
 * Responsive Table Utility
 * Automatically adds data-label attributes to table cells for mobile card layout
 */

class ResponsiveTable {
    constructor() {
        this.init();
    }

    init() {
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTables());
        } else {
            this.setupTables();
        }
    }

    setupTables() {
        // Find all DataTables
        const tables = document.querySelectorAll('table.table');
        tables.forEach(table => this.processTable(table));
    }

    processTable(table) {
        console.log('processTable', table);
        const headers = table.querySelectorAll('thead th');
        const headerTexts = Array.from(headers).map(th => th.textContent.trim());

        // Process existing rows
        this.addDataLabelsToRows(table, headerTexts);

        // Setup observer for dynamically added rows (DataTables)
        this.setupRowObserver(table, headerTexts);
    }

    addDataLabelsToRows(table, headerTexts) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headerTexts[index]) {
                    cell.setAttribute('data-label', headerTexts[index]);
                }
            });
        });
    }



    setupRowObserver(table, headerTexts) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TR') {
                        const cells = node.querySelectorAll('td');
                        cells.forEach((cell, index) => {
                            if (headerTexts[index]) {
                                cell.setAttribute('data-label', headerTexts[index]);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(tbody, {
            childList: true,
            subtree: true
        });
    }

    // Method to manually refresh a specific table
    refreshTable(tableId) {
        const table = document.getElementById(tableId);
        if (table) {
            this.processTable(table);
        }
    }

    // Method to get common Vietnamese labels for standard columns
    getVietnameseLabels() {
        return {
            'actions': 'Thao tác',
            'name': 'Tên',
            'fullname': 'Họ tên',
            'phone': 'Số điện thoại',
            'email': 'Email',
            'address': 'Địa chỉ',
            'date': 'Ngày',
            'created_at': 'Ngày tạo',
            'updated_at': 'Ngày cập nhật',
            'status': 'Trạng thái',
            'description': 'Mô tả',
            'room': 'Số phòng',
            'diagnosis': 'Chẩn đoán',
            'department': 'Khoa',
            'doctor': 'Bác sĩ',
            'patient': 'Bệnh nhân',
            'age': 'Tuổi',
            'gender': 'Giới tính',
            'id': 'ID'
        };
    }
}

// Initialize responsive table utility
const responsiveTable = new ResponsiveTable();

// Make it globally available
window.ResponsiveTable = ResponsiveTable;
window.responsiveTable = responsiveTable;

// jQuery integration for DataTables
// if (typeof $ !== 'undefined') {
//     $(document).ready(function() {
//         // Hook into DataTables draw event
//         $(document).on('draw.dt', 'table.dataTable', function() {
//             const table = this;
//             setTimeout(() => {
//                 responsiveTable.processTable(table);
//             }, 100);
//         });
//     });
// }
