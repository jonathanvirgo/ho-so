var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const hepatitisMt1 = require('../controllers/hepstitisMt1Controller');

// Viêm gan Mt1 - with security middleware
router.get('/:patient_id/:type',
    commonService.isAuthenticated,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.index
);

router.post("/create/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1'),
    hepatitisMt1.createHepatitis
);

router.post("/update/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1'),
    hepatitisMt1.editHepatitis
);

router.post('/add-time/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1-time'),
    hepatitisMt1.addTimes
);

router.post('/update-time/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1-time'),
    hepatitisMt1.updateTimes
);

router.post("/delete/time/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-mt1-time'),
    hepatitisMt1.deleteTime
);

router.post("/data-time/:patient_id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.dataTime
);

// Viêm gan MT1 - list/add/update/delete khẩu phần ăn (ăn ngoại trú)
router.post("/list/:patient_id/:type",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.getListKPA
);

router.post('/get-broading/:id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'read'),
    hepatitisMt1.dataBroadingKPA
);

router.post('/add-broading/:patient_id/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('CREATE', 'viem-gan-mt1-broading'),
    hepatitisMt1.addBroadingKPA
);

router.post('/update-broading/:type',
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'viem-gan-mt1-broading'),
    hepatitisMt1.updateBroadingKPA
);

router.post("/delete/broading/:id/:type",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('viem-gan-mt1', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'viem-gan-mt1-broading'),
    hepatitisMt1.deleteBroadingKPA
);

module.exports = router;
