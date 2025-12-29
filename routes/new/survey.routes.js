var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const surveyConfigController = require('../controllers/surveyConfigController');
const surveyDataController = require('../controllers/surveyDataController');
const surveyController = require('../controllers/surveyController');

// ===== SURVEY SYSTEM ROUTES =====

// Survey Configuration Routes - with proper authorization
router.get("/:projectId/configs",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getList);

router.post("/:projectId/configs/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getListTable);

router.get("/:projectId/configs/create",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getCreate);

router.post("/configs/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('CREATE', 'survey-config'),
    surveyConfigController.create);

router.get("/configs/:id/edit",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getEdit);

router.get("/configs/:id/fields",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getFieldsConfig);

router.get("/configs/:id/form-builder",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'write'),
    surveyConfigController.getFormBuilder);

router.get("/configs/:id/form-config",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getFormConfig);

router.post("/configs/:id/save-form-config",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-form-config'),
    surveyConfigController.saveFormConfig);

router.post("/configs/save-fields",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-fields'),
    surveyConfigController.saveFieldsConfig);

router.delete("/fields/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-field'),
    surveyConfigController.deleteField);

router.post("/configs/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-config'),
    surveyConfigController.update);

router.get("/configs/:id/responses",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getResponses);

router.delete("/configs/:id",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-config'),
    surveyConfigController.delete);

router.get("/templates",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyConfigController.getTemplates);

// Survey Data Management Routes - with proper authorization
router.get("/:projectId/data",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getList);

router.post("/:projectId/data/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getListTable);

router.get("/:projectId/data/:responseId",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.getDetail);

router.put("/:projectId/data/:responseId",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'survey-response'),
    surveyDataController.update);

router.delete("/:projectId/data/:responseId",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('survey-configs', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'survey-response'),
    surveyDataController.delete);

router.get("/:projectId/export",
    commonService.isAuthenticated,
    securityService.requirePermission('survey-configs', 'read'),
    surveyDataController.exportExcel);

// Public Survey Routes - NO AUTHENTICATION REQUIRED
router.get("/public/:slug", surveyController.getPublicSurvey);
router.post("/public/:slug/submit", surveyController.submitPublicSurvey);

module.exports = router;
