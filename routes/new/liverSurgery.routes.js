var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const liverSurgery = require('../controllers/liverSurgeryController');

// Cắt gan nhỏ (Hội chẩn) - with security middleware
router.get('/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.index
);

router.post("/list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.getListTable
);

router.post('/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'read'),
    liverSurgery.dataBroading
);

router.post('/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'write'),
    auditService.createAuditMiddleware('CREATE', 'hoi-chan-broading'),
    liverSurgery.addBroading
);

router.post('/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'hoi-chan-broading'),
    liverSurgery.updateBroading
);

router.post("/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('hoi-chan', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'hoi-chan-broading'),
    liverSurgery.deleteBroading
);

module.exports = router;
