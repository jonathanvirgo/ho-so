var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const inventoryController = require('../controllers/inventoryController');

// ==================== INVENTORY ROUTES ====================

// Warehouse management
router.get("/warehouses",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.warehouseList);

router.post("/warehouse/upsert",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.warehouseUpsert);

// Stock management
router.get("/stock/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.stockSummary);

router.get("/stock-detail/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'read'),
    inventoryController.stockDetail);

// Receipt (Nhập kho)
router.get("/receipt/create/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.receiptCreate);

router.post("/receipt/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.receiptSave);

// Issue (Xuất kho)
router.get("/issue/create/:warehouseId",
    commonService.isAuthenticated,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.issueCreate);

router.post("/issue/save",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('inventory', 'create'),
    inventoryController.issueSave);

module.exports = router;
