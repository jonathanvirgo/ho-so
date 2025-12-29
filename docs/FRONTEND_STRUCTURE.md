# 🎨 Frontend Structure - Giao diện Người dùng

## 📋 Tổng quan Frontend

Hệ thống sử dụng **Server-side Rendering** với EJS templates và **Progressive Enhancement**:
- **Template Engine**: EJS
- **CSS Framework**: Bootstrap 5
- **JavaScript**: jQuery + Vanilla JS
- **UI Components**: DataTables, Virtual Select, Flatpickr
- **PWA Support**: Service Worker + Manifest

## 📁 Views Structure

### 🏠 Core Views
```
views/
├── layout/
│   ├── header.ejs          # Common header
│   ├── footer.ejs          # Common footer
│   ├── sidebar.ejs         # Navigation sidebar
│   └── scripts.ejs         # Common scripts
├── index.ejs               # Dashboard/Home
├── login.ejs               # Login form
├── sign-up.ejs             # Registration form
├── error.ejs               # Error pages
└── default.ejs             # Default template
```

### 🏥 Medical Specialty Views
```
views/
├── viem-gan/               # Hepatitis module
│   ├── index.ejs           # List view
│   ├── create.ejs          # Create form
│   ├── edit.ejs            # Edit form
│   └── detail.ejs          # Detail view
├── viem-gan-mt1/           # Hepatitis MT1 module
├── uon-van/                # Tetanus module
├── cat-gan-nho/            # Liver surgery module
├── research/               # Research module
└── standard/               # Standards module
```

### 📊 Survey System Views
```
views/
├── projects/
│   ├── index.ejs           # Projects list
│   ├── create.ejs          # Create project
│   ├── edit.ejs            # Edit project
│   └── detail.ejs          # Project details
├── survey-configs/
│   ├── index.ejs           # Survey configs list
│   ├── create.ejs          # Create survey config
│   ├── edit.ejs            # Edit survey config
│   ├── fields-config.ejs   # Drag & drop field builder
│   └── responses.ejs       # View responses
├── survey/
│   ├── public-form.ejs     # Public survey form
│   └── thank-you.ejs       # Completion page
└── survey-data/
    ├── analytics.ejs       # Data analytics
    └── export.ejs          # Export options
```

### 🍽️ Food Management Views
```
views/
├── khau-phan-an/           # Food rations
│   ├── index.ejs
│   ├── create.ejs
│   └── nutrition.ejs       # Nutrition calculator
└── dishes/                 # Dish management
    ├── index.ejs
    ├── create.ejs
    └── recipe.ejs          # Recipe builder
```

### 👤 Admin Views
```
views/
├── admin/
│   ├── dashboard.ejs       # Admin dashboard
│   ├── users.ejs           # User management
│   ├── roles.ejs           # Role management
│   ├── audit-logs.ejs      # Audit trail
│   └── system-config.ejs   # System settings
└── devices.ejs             # Device management
```

## 🎨 CSS Architecture

### 📁 CSS Structure
```
public/css/
├── bootstrap.min.css       # Bootstrap framework
├── datatables.min.css      # DataTables styling
├── virtual-select.min.css  # Virtual Select component
├── flatpickr.min.css       # Date picker
├── survey-system.css       # Survey-specific styles
├── responsive-tables.css   # Responsive table styles
├── medical-forms.css       # Medical form styles
└── custom.css              # Global custom styles
```

### 🎯 Responsive Design
```css
/* Mobile-first approach */
.table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

/* DataTables responsive configuration */
.dataTables_wrapper .dataTables_length,
.dataTables_wrapper .dataTables_filter {
    display: block;
    text-align: left;
}

@media (max-width: 768px) {
    .dataTables_wrapper .dataTables_length,
    .dataTables_wrapper .dataTables_filter {
        float: none;
        text-align: center;
    }
}
```

### 🎨 Theme System
```css
/* CSS Variables for theming */
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #17a2b8;
    
    --sidebar-bg: #343a40;
    --sidebar-text: #ffffff;
    --content-bg: #f8f9fa;
}

/* Dark mode support */
[data-theme="dark"] {
    --primary-color: #0d6efd;
    --content-bg: #212529;
    --text-color: #ffffff;
}
```

## 📱 JavaScript Architecture

### 📁 JavaScript Structure
```
public/js/
├── vendor/                 # Third-party libraries
│   ├── jquery.min.js
│   ├── bootstrap.bundle.min.js
│   ├── datatables.min.js
│   ├── virtual-select.min.js
│   └── flatpickr.min.js
├── components/             # Reusable components
│   ├── datatable-config.js
│   ├── form-validation.js
│   ├── modal-handler.js
│   └── notification.js
├── modules/                # Feature-specific modules
│   ├── survey-builder.js
│   ├── medical-forms.js
│   ├── food-calculator.js
│   └── analytics.js
├── survey-system.js        # Survey system main
├── app.js                  # Main application
└── sw.js                   # Service Worker
```

### 🔧 Component System
```javascript
// datatable-config.js - Reusable DataTable configuration
const DataTableConfig = {
    defaultOptions: {
        responsive: true,
        processing: true,
        serverSide: true,
        pageLength: 25,
        language: {
            url: '/js/datatables-vietnamese.json'
        },
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    },
    
    initTable: function(tableId, ajaxUrl, columns, options = {}) {
        const config = Object.assign({}, this.defaultOptions, {
            ajax: {
                url: ajaxUrl,
                type: 'GET',
                data: function(d) {
                    // Add custom filters
                    d.campaign_id = $('#campaign-filter').val();
                    d.status = $('#status-filter').val();
                }
            },
            columns: columns
        }, options);
        
        return $(tableId).DataTable(config);
    }
};
```

### 🎯 Survey Builder Component
```javascript
// survey-builder.js - Drag & drop survey builder
class SurveyBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.fields = [];
        this.init();
    }
    
    init() {
        this.setupDragAndDrop();
        this.setupFieldTypes();
        this.setupPreview();
    }
    
    setupDragAndDrop() {
        // Sortable.js integration for drag & drop
        new Sortable(this.container, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                this.updateFieldOrder();
            }
        });
    }
    
    addField(type) {
        const field = this.createField(type);
        this.fields.push(field);
        this.renderField(field);
        this.updatePreview();
    }
    
    createField(type) {
        return {
            id: this.generateId(),
            type: type,
            label: `New ${type} field`,
            required: false,
            options: type === 'select' ? ['Option 1', 'Option 2'] : null,
            validation: {}
        };
    }
}
```

### 📊 Analytics Dashboard
```javascript
// analytics.js - Survey analytics
class SurveyAnalytics {
    constructor(projectId) {
        this.projectId = projectId;
        this.charts = {};
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.renderCharts();
        this.setupRealTimeUpdates();
    }
    
    async loadData() {
        const response = await fetch(`/projects/${this.projectId}/analytics/data`);
        this.data = await response.json();
    }
    
    renderCharts() {
        // Response count over time
        this.charts.responseCount = new Chart(
            document.getElementById('response-count-chart'), {
                type: 'line',
                data: this.data.responseCountData,
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
        
        // Field response distribution
        this.charts.fieldDistribution = new Chart(
            document.getElementById('field-distribution-chart'), {
                type: 'doughnut',
                data: this.data.fieldDistributionData,
                options: {
                    responsive: true
                }
            }
        );
    }
}
```

## 📱 Progressive Web App (PWA)

### 🔧 Service Worker
```javascript
// sw.js - Service Worker for offline support
const CACHE_NAME = 'patients-app-v1';
const urlsToCache = [
    '/',
    '/css/bootstrap.min.css',
    '/css/custom.css',
    '/js/app.js',
    '/js/vendor/jquery.min.js',
    '/images/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});
```

### 📱 Web App Manifest
```json
// manifest.json
{
    "name": "Patients Management System",
    "short_name": "Patients",
    "description": "Medical patient and survey management system",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#007bff",
    "icons": [
        {
            "src": "/images/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/images/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

## 🎯 User Experience Features

### 🔄 Real-time Updates
```javascript
// Real-time notifications using WebSocket
class NotificationSystem {
    constructor() {
        this.socket = io();
        this.init();
    }
    
    init() {
        this.socket.on('survey_response', (data) => {
            this.showNotification('New survey response received', 'info');
            this.updateDashboard();
        });
        
        this.socket.on('system_alert', (data) => {
            this.showNotification(data.message, data.type);
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.getElementById('notification-container').appendChild(notification);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}
```

### 📱 Mobile Optimization
```javascript
// Mobile-specific optimizations
class MobileOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }
    
    init() {
        if (this.isMobile) {
            this.optimizeDataTables();
            this.optimizeForms();
            this.setupTouchGestures();
        }
    }
    
    optimizeDataTables() {
        // Hide less important columns on mobile
        $('.datatable').DataTable().columns([3, 4, 5]).visible(false);
        
        // Enable responsive extension
        $('.datatable').DataTable().responsive.recalc();
    }
    
    optimizeForms() {
        // Larger touch targets
        $('input, select, textarea').addClass('form-control-lg');
        
        // Auto-focus prevention on mobile
        $('input[autofocus]').removeAttr('autofocus');
    }
}
```

## 🎨 UI/UX Patterns

### 📋 Form Patterns
- **Progressive disclosure**: Complex forms broken into steps
- **Inline validation**: Real-time field validation
- **Auto-save**: Draft saving for long forms
- **Accessibility**: ARIA labels and keyboard navigation

### 📊 Data Visualization
- **Responsive charts**: Chart.js with mobile optimization
- **Interactive tables**: DataTables with advanced filtering
- **Real-time updates**: Live data refresh
- **Export options**: PDF, Excel, CSV export

### 🔔 Notification System
- **Toast notifications**: Non-intrusive alerts
- **Progress indicators**: Loading states
- **Error handling**: User-friendly error messages
- **Success feedback**: Confirmation messages
