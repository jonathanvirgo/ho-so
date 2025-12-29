var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const standard = require('../controllers/standardController');

// Phiếu hội chẩn (Standard) - with security middleware
router.get('/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.index
);

router.post("/create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('CREATE', 'standard'),
    standard.createStandard
);

router.post("/update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'standard'),
    standard.editStandard
);

router.post('/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('CREATE', 'standard-time'),
    standard.addTimes
);

router.post('/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'standard-time'),
    standard.updateTimes
);

router.post("/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'standard-time'),
    standard.deleteTime
);

router.post("/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('standard', 'read'),
    standard.dataTime
);

router.get('/download/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadStandard
);

router.get('/download-template/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadStandardTemplate
);

router.get('/hoichan-download/:patient_id',
    commonService.isAuthenticated,
    securityService.requirePermission('standard', 'read'),
    standard.downloadHoichan
);

module.exports = router;
