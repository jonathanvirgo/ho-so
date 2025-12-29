var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const tetanus = require('../controllers/tetanusController');

// Uốn ván - with security middleware
router.get('/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.index
);

router.post("/create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van'),
    tetanus.createTetanus
);

router.post("/update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van'),
    tetanus.editTetanus
);

router.post("/list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.getListTable
);

router.post('/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.dataBroading
);

router.post('/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van-broading'),
    tetanus.addBroading
);

router.post('/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van-broading'),
    tetanus.updateBroading
);

router.post("/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'uon-van-broading'),
    tetanus.deleteBroading
);

router.post('/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('CREATE', 'uon-van-time'),
    tetanus.addTimes
);

router.post('/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'uon-van-time'),
    tetanus.updateTimes
);

router.post("/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'uon-van-time'),
    tetanus.deleteTime
);

router.post("/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('uon-van', 'read'),
    tetanus.dataTime
);

module.exports = router;
