var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const research = require('../controllers/researchController');

// Research - with security middleware
router.get('/',
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.getlist
);

router.post("/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('research', 'read'),
    research.getListTable
);

router.post("/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('CREATE', 'research'),
    research.add
);

router.post("/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research'),
    research.update
);

router.post("/active",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-status'),
    research.active
);

router.get('/detail/:id',
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.detail
);

router.post('/patient/list',
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('research', 'read'),
    research.patientList
);

router.post("/patient/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('CREATE', 'research-patient'),
    research.patientAdd
);

router.post("/patient/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-patient'),
    research.patientUpdate
);

router.post("/patient/active",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'research-patient-status'),
    research.patientActive
);

router.get("/export-excel/:research_id",
    commonService.isAuthenticated,
    securityService.requirePermission('research', 'read'),
    research.exportExcel
);

router.post("/export-excel/:research_id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('research', 'read'),
    auditService.createAuditMiddleware('EXPORT', 'research'),
    research.exportExcel
);

module.exports = router;
