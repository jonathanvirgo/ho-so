var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const patient = require('../controllers/patientController');

// Patient management routes
router.get("/add/:path", 
    commonService.isAuthenticated,
    patient.getCreate);

router.get("/edit/:path/:id", 
    commonService.isAuthenticated,
    patient.getEdit);

router.post("/add", 
    commonService.isAuthenticatedPost, 
    auditService.createAuditMiddleware('CREATE', 'patient'),
    patient.create);

router.post("/update", 
    commonService.isAuthenticatedPost, 
    auditService.createAuditMiddleware('UPDATE', 'patient'),
    patient.update);

router.post("/list", 
    commonService.isAuthenticatedPostList,
    patient.list);

router.post("/active", 
    commonService.isAuthenticatedPost, 
    auditService.createAuditMiddleware('AcTIVE', 'patient-status'),
    patient.active);

router.get("/detail/:path/:id", 
    commonService.isAuthenticated,
    patient.detail);

router.get("/export/:path", 
    commonService.isAuthenticated,
    patient.exportToExcel);

router.post("/save-table-config", commonService.isAuthenticatedPost, patient.saveTableDisplayConfig);
router.get("/get-table-config", commonService.isAuthenticated, patient.getTableDisplayConfig);

module.exports = router;
