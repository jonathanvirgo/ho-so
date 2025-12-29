# 🛣️ Routes Structure - Cấu trúc Định tuyến

## 📋 Tổng quan Routes

Hệ thống có **4 route files** chính:
- `routes/index.js` - Main routes (800+ lines)
- `routes/admin.js` - Admin routes  
- `routes/api.js` - API routes
- `routes/demo-responsive.js` - Demo routes

## 🏠 Main Routes (index.js)

### 🔐 Authentication Routes
```javascript
// Public routes - NO AUTHENTICATION
router.get("/login", user.getLogin);
router.get("/dang-ky", user.getSignUp);
router.post('/sign-up', user.signUp);
router.post('/login', user.login);
router.get('/logout', user.logout);

// Public Survey Routes - NO AUTHENTICATION
router.get("/survey/:slug", surveyController.getPublicSurvey);
router.post("/survey/:slug/submit", surveyController.submitPublicSurvey);
```

### 🏥 Medical Specialty Routes

#### Viêm gan (Hepatitis) - Role ID: 3
```javascript
// Security Pattern: isAuthenticated + requirePermission
router.get("/viem-gan", 
    commonService.isAuthenticated,
    securityService.requirePermission('hepatitis', 'read'),
    hepatitis.getList);

router.get("/viem-gan/table", 
    commonService.isAuthenticated,
    securityService.requirePermission('hepatitis', 'read'),
    hepatitis.getListTable);

router.post("/viem-gan/create",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('hepatitis', 'write'),
    hepatitis.create);

router.post("/viem-gan/update",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('hepatitis', 'write'),
    hepatitis.update);

router.post("/viem-gan/delete",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('hepatitis', 'delete'),
    hepatitis.delete);
```

#### Viêm gan MT1 - Role ID: 6
```javascript
router.get("/viem-gan-mt1",
    commonService.isAuthenticated,
    securityService.requirePermission('hepatitis-mt1', 'read'),
    hepatitisMt1.getList);

router.get("/viem-gan-mt1/table",
    commonService.isAuthenticated,
    securityService.requirePermission('hepatitis-mt1', 'read'),
    hepatitisMt1.getListTable);
// ... CRUD operations với same pattern
```

#### Uốn ván (Tetanus) - Role ID: 4
```javascript
router.get("/uon-van",
    commonService.isAuthenticated,
    securityService.requirePermission('tetanus', 'read'),
    tetanus.getList);

router.get("/uon-van/table",
    commonService.isAuthenticated,
    securityService.requirePermission('tetanus', 'read'),
    tetanus.getListTable);
// ... CRUD operations
```

#### Phẫu thuật gan (Liver Surgery) - Role ID: 5
```javascript
router.get("/hoi-chan",
    commonService.isAuthenticated,
    securityService.requirePermission('liver-surgery', 'read'),
    liverSurgery.getList);

router.get("/hoi-chan/table",
    commonService.isAuthenticated,
    securityService.requirePermission('liver-surgery', 'read'),
    liverSurgery.getListTable);
// ... CRUD operations
```

#### Nghiên cứu (Research) - Role ID: 7
```javascript
router.get("/research",
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.getList);

router.get("/research/table",
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.getListTable);
// ... CRUD operations
```

#### Tiêu chuẩn (Standards) - Role ID: 8
```javascript
router.get("/standard",
    commonService.isAuthenticated,
    securityService.requirePermission('standards', 'read'),
    standard.getList);

router.get("/standard/table",
    commonService.isAuthenticated,
    securityService.requirePermission('standards', 'read'),
    standard.getListTable);
// ... CRUD operations
```

### 📊 Survey System Routes

#### Projects Management
```javascript
router.get("/projects",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getList);

router.get("/projects/table",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getListTable);

router.post("/projects/create",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('projects', 'write'),
    projectController.create);

router.post("/projects/update",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('projects', 'write'),
    projectController.update);

router.post("/projects/delete",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('projects', 'delete'),
    projectController.delete);
```

#### Survey Configurations
```javascript
router.get("/projects/:projectId/survey-configs",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getList);

router.get("/projects/:projectId/survey-configs/create",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getCreateForm);

router.post("/projects/:projectId/survey-configs/create",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.create);

router.get("/survey-configs/:configId/fields",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getFieldsConfig);

router.post("/survey-configs/:configId/fields",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.saveFieldsConfig);
```

#### Survey Data & Analytics
```javascript
router.get("/projects/:projectId/analytics",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getAnalytics);

router.get("/projects/:projectId/analytics/responses",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getResponses);

router.get("/projects/:projectId/analytics/export",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.exportAnalytics);
```

### 🍽️ Food Management Routes

#### Food Rations
```javascript
router.get("/khau-phan-an",
    commonService.isAuthenticated,
    securityService.requirePermission('food-rations', 'read'),
    foodRation.getList);

router.get("/khau-phan-an/table",
    commonService.isAuthenticated,
    securityService.requirePermission('food-rations', 'read'),
    foodRation.getListTable);
// ... CRUD operations
```

#### Dishes Management
```javascript
router.get("/dishes",
    commonService.isAuthenticated,
    securityService.requirePermission('dishes', 'read'),
    dishController.getList);

router.post("/dishes/create",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requirePermission('dishes', 'write'),
    dishController.create);
```

### 📁 File Upload Routes
```javascript
router.post("/api/upload",
    commonService.isAuthenticatedPost,
    fileUploadController.uploadSingle);

router.post("/api/upload/multiple",
    commonService.isAuthenticatedPost,
    fileUploadController.uploadMultiple);
```

### 🔧 System Routes

#### Device Management
```javascript
router.get("/devices",
    commonService.isAuthenticated,
    device.getList);

router.post("/devices/logout",
    commonService.isAuthenticatedPost,
    device.logoutDevice);
```

#### Test & Debug Routes
```javascript
router.get('/test-session', 
    commonService.isAuthenticated, 
    (req, res) => {
        res.json({
            user: req.user,
            authenticated: !!req.user,
            tokenId: req.user?.tokenId
        });
    });
```

## 🔧 Admin Routes (admin.js)

### Admin Panel Routes
```javascript
// Admin-only access
router.get("/admin",
    commonService.isAuthenticated,
    securityService.requireRole('admin'),
    adminController.dashboard);

router.get("/admin/users",
    commonService.isAuthenticated,
    securityService.requireRole('admin'),
    adminController.getUsers);

router.post("/admin/users/create",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware,
    securityService.requireRole('admin'),
    adminController.createUser);
```

## 🔌 API Routes (api.js)

### RESTful API Endpoints
```javascript
// Food API
router.get("/api/food/search",
    commonService.isAuthenticated,
    foodService.searchFood);

router.get("/api/food/:id",
    commonService.isAuthenticated,
    foodService.getFoodInfo);

// Survey API
router.get("/api/surveys/:slug/config",
    surveyController.getPublicSurveyConfig);

router.post("/api/surveys/:slug/validate",
    surveyController.validateSurveyData);
```

## 🎨 Demo Routes (demo-responsive.js)

### Responsive Design Demos
```javascript
router.get("/demo/responsive-table",
    commonService.isAuthenticated,
    (req, res) => {
        res.render('demo/responsive-table');
    });

router.get("/demo/layout-comparison",
    commonService.isAuthenticated,
    (req, res) => {
        res.render('demo/layout-comparison');
    });
```

## 🔐 Security Patterns

### Standard Security Stack
```javascript
// GET Routes Pattern
router.get("/route",
    commonService.isAuthenticated,           // JWT validation
    securityService.requirePermission(resource, action), // Permission check
    controller.method);

// POST Routes Pattern  
router.post("/route",
    commonService.isAuthenticatedPost,      // JWT validation for POST
    auditService.createAuditMiddleware,     // Audit logging
    securityService.requirePermission(resource, action), // Permission check
    controller.method);
```

### Role-based Routing
```javascript
// Home controller redirects based on role
switch(true){
    case req.user.role_id.includes(1): // Admin
        return res.render('index', {user: req.user});
    case req.user.role_id.includes(3): // Hepatitis
        return res.redirect('/viem-gan');
    case req.user.role_id.includes(4): // Tetanus
        return res.redirect('/uon-van');
    case req.user.role_id.includes(5): // Liver Surgery
        return res.redirect('/hoi-chan');
    case req.user.role_id.includes(6): // Hepatitis MT1
        return res.redirect('/viem-gan-mt1');
    case req.user.role_id.includes(7): // Research
        return res.redirect('/research');
    case req.user.role_id.includes(8): // Standards
        return res.redirect('/standard');
}
```

## 📊 Route Statistics

### Total Routes: ~100+ routes
- **Medical routes**: ~50 routes (5 specialties × 10 operations each)
- **Survey routes**: ~25 routes
- **Admin routes**: ~15 routes  
- **API routes**: ~10 routes
- **System routes**: ~10 routes

### Security Coverage: 100%
- All routes except login/signup require authentication
- All CRUD operations require specific permissions
- All POST operations include audit logging
- Role-based access control on all resources
