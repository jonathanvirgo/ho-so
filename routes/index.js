var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const foodService = require("../services/foodService");
const home = require('../controllers/homeController');
const user = require('../controllers/userController');
const device = require('../controllers/deviceController');
const hepatitis = require('../controllers/hepatitisController');
const hepatitisMt1 = require('../controllers/hepstitisMt1Controller');
const patient = require('../controllers/patientController');
const tetanus = require('../controllers/tetanusController');
const liverSurgery = require('../controllers/liverSurgeryController');
const foodRation = require('../controllers/foodRationController');
const research = require('../controllers/researchController');
const standard = require('../controllers/standardController');
const dishController = require('../controllers/dishController');
const projectController = require('../controllers/projectController');
const surveyConfigController = require('../controllers/surveyConfigController');
const surveyController = require('../controllers/surveyController');
const importFoodController = require('../controllers/importFoodController');
const menuBuild = require('../controllers/menuBuildController');
const inventoryController = require('../controllers/inventoryController');

// Multer for photo uploads
const multer = require('multer');
const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Import route modules
// const authRoutes = require('./auth.routes');
// const deviceRoutes = require('./device.routes');
// const patientRoutes = require('./patient.routes');
// const hepatitisRoutes = require('./hepatitis.routes');
// const tetanusRoutes = require('./tetanus.routes');
// const liverSurgeryRoutes = require('./liverSurgery.routes');
// const hepatitisMt1Routes = require('./hepatitisMt1.routes');
// const foodRationRoutes = require('./foodRation.routes');
// const menuBuildRoutes = require('./menuBuild.routes');
// const inventoryRoutes = require('./inventory.routes');
// const researchRoutes = require('./research.routes');
// const standardRoutes = require('./standard.routes');
// const projectRoutes = require('./project.routes');
// const surveyRoutes = require('./survey.routes');

// // Use route modules
// router.use("/auth", authRoutes);
// router.use("/devices", deviceRoutes);
// router.use("/patient", patientRoutes);
// router.use("/viem-gan", hepatitisRoutes);
// router.use("/uon-van", tetanusRoutes);
// router.use("/hoi-chan", liverSurgeryRoutes);
// router.use("/viem-gan-mt1", hepatitisMt1Routes);
// router.use("/khau-phan-an", foodRationRoutes);
// router.use("/menu-build", menuBuildRoutes);
// router.use("/inventory", inventoryRoutes);
// router.use("/research", researchRoutes);
// router.use("/standard", standardRoutes);
// router.use("/projects", projectRoutes);
// router.use("/survey", surveyRoutes);

// Index
router.get("/", commonService.isAuthenticated, home.index);
router.post("/chat", home.chat);
router.post("/chat-open-route", home.chatopenroute);

// Device Management
router.get("/devices", commonService.isAuthenticated, device.getActiveDevices);
router.get("/devices-page", commonService.isAuthenticated, (req, res) => {
    res.render('devices', { user: req.user, errors: [] });
});
router.post("/devices/logout", commonService.isAuthenticatedPost, device.logoutDevice);
router.post("/devices/logout-all-others", commonService.isAuthenticatedPost, device.logoutAllOtherDevices);
router.get("/devices/settings", commonService.isAuthenticated, device.getSessionSettings);
router.post("/devices/settings", commonService.isAuthenticatedPost, device.updateSessionSettings);

// Viêm Gan - with proper authorization
router.get("/viem-gan",
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan', 'read'),
    patient.getlist);
router.get("/uon-van",
    commonService.isAuthenticated,
    securityService.requirePermission('uon-van', 'read'),
    patient.getlist);
router.get("/hoi-chan",
    commonService.isAuthenticated,
    securityService.requirePermission('hoi-chan', 'read'),
    patient.getlist);
router.get("/viem-gan-mt1",
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    patient.getlist);
router.get("/standard",
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    patient.getlist);

// Menu Build Routes
router.get("/menu-build",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.index);

router.post("/menu-build/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.listData);

router.get("/menu-build/create",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'create'),
    menuBuild.create);

router.get("/menu-build/edit/:id",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'update'),
    menuBuild.edit);

router.get("/menu-build/edit-day/:menuId/:week/:day",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'update'),
    menuBuild.editDay);

router.get("/menu-build/ingredients/:menuId/:week/:day",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateIngredients);

router.get("/menu-build/ingredients/:menuId/:week/:day/:mealTimeId",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateIngredientsByMealTime);

// New route for week-level ingredients calculation
router.get("/menu-build/ingredients-week/:menuId/:week",
    commonService.isAuthenticated,
    securityService.requirePermission('menu-build', 'read'),
    menuBuild.calculateWeekIngredients);

router.post("/menu-build/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('menu-build', 'create'),
    menuBuild.save);

router.post("/menu-build/delete/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('menu-build', 'delete'),
    menuBuild.delete);

router.get("/api/menu-build/menu-times",
    commonService.isAuthenticated,
    menuBuild.getMenuTimes);

router.get("/api/menu-build/dish-categories",
    commonService.isAuthenticated,
    menuBuild.getDishCategories);

router.get("/api/menu-build/day-detail",
    commonService.isAuthenticated,
    menuBuild.getDayDetail);

router.post("/api/menu-build/update-detail-food",
    commonService.isAuthenticated,
    menuBuild.updateDetailFood);

router.get("/api/foods-for-select",
    commonService.isAuthenticated,
    menuBuild.getFoodsForSelect);

// ==================== INVENTORY ROUTES ====================
// Warehouse management
router.get("/inventory/warehouses",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.warehouseList);

router.post("/inventory/warehouse/upsert",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.warehouseUpsert);

// Stock management
router.get("/inventory/stock/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.stockSummary);

router.get("/inventory/stock-detail/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.stockDetail);

// Receipt (Nhập kho)
router.get("/inventory/receipt/create/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.receiptCreate);

router.post("/inventory/receipt/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.receiptSave);

// Issue (Xuất kho)
router.get("/inventory/issue/create/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.issueCreate);

router.post("/inventory/issue/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.issueSave);

// Receipt list
router.get("/inventory/receipts/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.receiptList);

router.get("/api/inventory/receipts/:warehouseId",
    commonService.isAuthenticated,
    inventoryController.getReceiptListApi);

router.get("/inventory/receipt/export/:receiptId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.exportReceiptExcel);

// Issue list
router.get("/inventory/issues/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.issueList);

router.get("/api/inventory/issues/:warehouseId",
    commonService.isAuthenticated,
    inventoryController.getIssueListApi);

router.get("/inventory/issue/export/:issueId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.exportIssueExcel);

// API endpoints
router.get("/api/inventory/stock-summary/:warehouseId",
    commonService.isAuthenticated,
    inventoryController.getStockSummaryApi);

router.get("/api/inventory/warehouses",
    commonService.isAuthenticated,
    inventoryController.getWarehousesApi);

router.post("/api/inventory/create-issue-from-menu",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.createIssueFromMenu);

router.get("/khau-phan-an/detail/:patient_id",
    commonService.isAuthenticated,
    securityService.requirePermission('khau-phan-an', 'read'),
    foodRation.index);
router.get("/khau-phan-an/food-name",
    commonService.isAuthenticated,
    securityService.requirePermission('khau-phan-an', 'read'),
    foodRation.foodName);
// API chung cho việc lấy thực phẩm với filter và search
router.get("/api/food-search", commonService.isAuthenticated, async (req, res) => {
    const type = req.query.type;
    const type_year = req.query.type_year;
    const search = req.query.search;
    const result = await foodService.getFoodForSelect(type, type_year, search);
    res.json(result);
});

// API lấy danh sách món ăn cho client
router.get("/api/dishes-for-select", commonService.isAuthenticated, dishController.getDishesForSelect);
router.get("/api/dishes-for-select-by-category", commonService.isAuthenticated, dishController.getDishesForSelectByCategory);
router.get("/api/dish-foods/:id", commonService.isAuthenticated, dishController.getDishFoods);

// API cho hệ thống khác gọi - có xác thực bằng API key
router.get("/api/external/dish-foods/:dishId", commonService.checkAPIKey, dishController.getDishFoodsExternal);
router.get("/api/external/dishes-for-select", commonService.checkAPIKey, dishController.getDishesForSelectExternal);
router.get("/api/external/food-name", commonService.checkAPIKey, dishController.getFoodNameExternal);
router.get("/api/external/menu-examples", commonService.checkAPIKey, menuBuild.getMenuExamplesExternal);
router.post("/api/external/menu-examples", commonService.checkAPIKey, foodRation.externalCreateMenuExample);

router.post("/khau-phan-an/save-menu", commonService.isAuthenticatedPost, foodRation.saveMenu);
router.post("/khau-phan-an/save-table-config", commonService.isAuthenticatedPost, patient.saveTableDisplayConfig);
router.get("/khau-phan-an/get-table-config", commonService.isAuthenticated, patient.getTableDisplayConfig);

router.post('/api/import-food', importFoodController.importFood);
router.post('/api/update-food', importFoodController.updateFood);

router.get("/patient/add/:path",
    commonService.isAuthenticated,
    patient.getCreate);
router.get("/patient/edit/:path/:id",
    commonService.isAuthenticated,
    patient.getEdit)
router.post("/patient/add",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware('CREATE', 'patient'),
    patient.create);
router.post("/patient/update",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware('UPDATE', 'patient'),
    patient.update);
router.post("/patient/list",
    commonService.isAuthenticatedPostList,
    patient.list);
router.post("/patient/active",
    commonService.isAuthenticatedPost,
    auditService.createAuditMiddleware('AcTIVE', 'patient-status'),
    patient.active);
router.get("/patient/detail/:path/:id",
    commonService.isAuthenticated,
    patient.detail);

// Export patient data to Excel
router.get("/patient/export/:path",
    commonService.isAuthenticated,
    patient.exportToExcel);

// ==================== PATIENT PHOTO ROUTES ====================
router.get("/patient/:id/photos",
    commonService.isAuthenticated,
    patient.getPhotos);

router.post("/patient/:id/upload-photo",
    commonService.isAuthenticatedPost,
    photoUpload.single('photo'),
    patient.uploadPhoto);

router.delete("/patient/:id/photo/:photoId",
    commonService.isAuthenticatedPost,
    patient.deletePhoto);

// Viêm gan - with security middleware
router.get('/viem-gan/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.index
);

router.post("/viem-gan-create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan'),
    hepatitis.createHepatitis
);

router.post("/viem-gan-update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan'),
    hepatitis.editHepatitis
);

router.post("/viem-gan-list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.getListTable
);

router.post('/viem-gan/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.dataBroading
);

router.post('/viem-gan/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-broading'),
    hepatitis.addBroading
);

router.post('/viem-gan/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-broading'),
    hepatitis.updateBroading
);

router.post("/viem-gan/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-broading'),
    hepatitis.deleteBroading
);

router.post('/viem-gan/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-time'),
    hepatitis.addTimes
);

router.post('/viem-gan/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-time'),
    hepatitis.updateTimes
);

router.post("/viem-gan/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-time'),
    hepatitis.deleteTime
);

router.post("/viem-gan/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.dataTime
);
// Uốn ván - with security middleware
router.get('/uon-van/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.index
);

router.post("/uon-van-create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van'),
    tetanus.createTetanus
);

router.post("/uon-van-update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van'),
    tetanus.editTetanus
);

router.post("/uon-van-list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.getListTable
);

router.post('/uon-van/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.dataBroading
);

router.post('/uon-van/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van-broading'),
    tetanus.addBroading
);

router.post('/uon-van/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van-broading'),
    tetanus.updateBroading
);

router.post("/uon-van/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'uon-van-broading'),
    tetanus.deleteBroading
);

router.post('/uon-van/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van-time'),
    tetanus.addTimes
);

router.post('/uon-van/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van-time'),
    tetanus.updateTimes
);

router.post("/uon-van/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'uon-van-time'),
    tetanus.deleteTime
);

router.post("/uon-van/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.dataTime
);

// Cắt gan nhỏ (Hội chẩn) - with security middleware
router.get('/hoi-chan/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.index
);

router.post("/hoi-chan-list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.getListTable
);

router.post('/hoi-chan/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.dataBroading
);

router.post('/hoi-chan/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'hoi-chan-broading'),
    liverSurgery.addBroading
);

router.post('/hoi-chan/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'hoi-chan-broading'),
    liverSurgery.updateBroading
);

router.post("/hoi-chan/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'hoi-chan-broading'),
    liverSurgery.deleteBroading
);

// Viêm gan Mt1 - with security middleware
router.get('/viem-gan-mt1/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.index
);

router.post("/viem-gan-mt1-create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1'),
    hepatitisMt1.createHepatitis
);

router.post("/viem-gan-mt1-update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1'),
    hepatitisMt1.editHepatitis
);

router.post('/viem-gan-mt1/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1-time'),
    hepatitisMt1.addTimes
);

router.post('/viem-gan-mt1/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1-time'),
    hepatitisMt1.updateTimes
);

router.post("/viem-gan-mt1/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-mt1-time'),
    hepatitisMt1.deleteTime
);

router.post("/viem-gan-mt1/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.dataTime
);

// Viêm gan MT1 - list/add/update/delete khẩu phần ăn (ăn ngoại trú) tương tự viêm gan
router.post("/viem-gan-mt1-list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.getListKPA
);

router.post('/viem-gan-mt1/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.dataBroadingKPA
);

router.post('/viem-gan-mt1/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1-broading'),
    hepatitisMt1.addBroadingKPA
);

router.post('/viem-gan-mt1/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1-broading'),
    hepatitisMt1.updateBroadingKPA
);

router.post("/viem-gan-mt1/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-mt1-broading'),
    hepatitisMt1.deleteBroadingKPA
);

// Đánh giá khẩu phần ăn
//router.get('/khau-phan-an/:patient_id/:type', commonService.isAuthenticated, foodRation.index);

// Research - with security middleware
router.get('/research',
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.getlist
);

router.post("/research/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('research', 'read'),
    research.getListTable
);

router.post("/research/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('CREATE', 'research'),
    research.add
);

router.post("/research/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research'),
    research.update
);

router.post("/research/active",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-status'),
    research.active
);

router.get('/research/detail/:id',
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.detail
);

router.post('/research/patient/list',
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('research', 'read'),
    research.patientList
);

router.post("/research/patient/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('CREATE', 'research-patient'),
    research.patientAdd
);

router.post("/research/patient/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-patient'),
    research.patientUpdate
);

router.post("/research/patient/active",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-patient-status'),
    research.patientActive
);

router.get("/research/export-excel/:research_id",
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.exportExcel
);

router.post("/research/export-excel/:research_id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'read'),
    auditService.createAuditMiddleware('EXPORT', 'research'),
    research.exportExcel
);

// Phiếu hội chẩn (Standard) - with security middleware
router.get('/standard/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.index
);

router.post("/standard-create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('CREATE', 'standard'),
    standard.createStandard
);

router.post("/standard-update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'standard'),
    standard.editStandard
);

router.post('/standard/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('CREATE', 'standard-time'),
    standard.addTimes
);

router.post('/standard/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'standard-time'),
    standard.updateTimes
);

router.post("/standard/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'standard-time'),
    standard.deleteTime
);

router.post("/standard/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'read'),
    standard.dataTime
);

router.get('/standard-download/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadStandard
);

router.get('/standard-download-template/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadStandardTemplate
);

router.get('/hoichan-download/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadHoichan
);

// ===== SURVEY SYSTEM ROUTES =====

// Project Management Routes - with proper authorization
router.get("/projects",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getList);

router.post("/projects/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('projects', 'read'),
    projectController.getListTable);

router.get("/projects/create",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'write'),
    projectController.getCreate);

router.post("/projects/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'write'),
    auditService.createAuditMiddleware('CREATE', 'project'),
    projectController.create);

router.get("/projects/:id/edit",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'write'),
    projectController.getEdit);

router.post("/projects/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'project'),
    projectController.update);

router.post("/projects/:id/delete",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'project'),
    projectController.delete);

router.get("/projects/:id/detail",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getDetail);

// Survey Configuration Routes - with proper authorization
router.get("/projects/:projectId/surveys",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getList);

router.post("/projects/:projectId/surveys/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getListTable);

router.get("/projects/:projectId/surveys/create",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getCreate);

router.post("/survey-configs/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('CREATE', 'survey-config'),
    surveyConfigController.create);

router.get("/survey-configs/:id/edit",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getEdit);

router.get("/survey-configs/:id/fields",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getFieldsConfig);

router.get("/survey-configs/:id/form-builder",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getFormBuilder);

router.get("/survey-configs/:id/form-config",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getFormConfig);

router.post("/survey-configs/:id/save-form-config",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-form-config'),
    surveyConfigController.saveFormConfig);

router.post("/survey-configs/save-fields",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-fields'),
    surveyConfigController.saveFieldsConfig);

router.delete("/survey-fields/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-field'),
    surveyConfigController.deleteField);

router.post("/survey-configs/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-config'),
    surveyConfigController.update);

router.get("/survey-configs/:id/responses",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getResponses);

router.delete("/survey-configs/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-config'),
    surveyConfigController.delete);

router.get("/survey-configs/templates",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getTemplates);

// Survey Data Management Routes - with proper authorization
const surveyDataController = require('../controllers/surveyDataController');

router.get("/projects/:projectId/survey-data",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getList);

router.post("/projects/:projectId/survey-data/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getListTable);

router.get("/projects/:projectId/survey-data/:responseId",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getDetail);

router.put("/projects/:projectId/survey-data/:responseId",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-response'),
    surveyDataController.update);

router.delete("/projects/:projectId/survey-data/:responseId",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-response'),
    surveyDataController.delete);

router.get("/projects/:projectId/survey/export",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.exportExcel);

// Analytics API Routes
router.get("/projects/:projectId/analytics/overview",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getAnalyticsOverview);

router.get("/projects/:projectId/analytics/response-trend",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getResponseTrend);

router.get("/projects/:projectId/analytics/field-analysis",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getFieldAnalysis);

router.get("/projects/:projectId/analytics/response-time",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getResponseTime);

router.get("/projects/:projectId/analytics/recent-responses",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getRecentResponses);

router.get("/projects/:projectId/analytics/geographic",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getGeographicAnalysis);

router.get("/projects/:projectId/analytics/export",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.exportAnalytics);

// File Upload Routes
const fileUploadController = require('../controllers/fileUploadController');

router.post("/api/upload",
    commonService.isAuthenticatedPost,
    fileUploadController.uploadSingle);

router.post("/api/upload/multiple",
    commonService.isAuthenticatedPost,
    fileUploadController.uploadMultiple);

router.get("/api/files/:fileId/download",
    commonService.isAuthenticated,
    fileUploadController.downloadFile);

router.get("/api/files/:fileId/info",
    commonService.isAuthenticated,
    fileUploadController.getFileInfo);

router.delete("/api/files/:fileId",
    commonService.isAuthenticatedPost,
    fileUploadController.deleteFile);

// Automation Routes đã được loại bỏ vì không cần thiết cho hệ thống khảo sát đơn giản

// Public Survey Routes - NO AUTHENTICATION REQUIRED
router.get("/survey/:slug", surveyController.getPublicSurvey);
router.post("/survey/:slug/submit", surveyController.submitPublicSurvey);

// Đăng nhập
router.get("/login", user.getLogin);
router.get("/dang-ky", user.getSignUp);
router.post('/sign-up', user.signUp);
router.post('/login', user.login);
router.get('/logout', user.logout);
// Kiểm tra đăng nhập

// Thêm route test
router.get('/test-session', commonService.isAuthenticated, (req, res) => {
    res.json({
        user: req.user,
        authenticated: !!req.user,
        tokenId: req.user?.tokenId
    });
});

// Privacy policy route for Google Auth
router.get('/dieu-khoan', (user, res) => {
    res.render('dieu-khoan');
});

module.exports = router;
