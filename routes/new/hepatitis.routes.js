var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const hepatitis = require('../controllers/hepatitisController');

// Viêm Gan - with security middleware
router.get('/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.index
);

router.post("/create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan'),
    hepatitis.createHepatitis
);

router.post("/update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan'),
    hepatitis.editHepatitis
);

router.post("/list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.getListTable
);

router.post('/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.dataBroading
);

router.post('/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-broading'),
    hepatitis.addBroading
);

router.post('/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-broading'),
    hepatitis.updateBroading
);

router.post("/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-broading'),
    hepatitis.deleteBroading
);

router.post('/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-time'),
    hepatitis.addTimes
);

router.post('/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-time'),
    hepatitis.updateTimes
);

router.post("/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-time'),
    hepatitis.deleteTime
);

router.post("/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan', 'read'),
    hepatitis.dataTime
);

module.exports = router;
