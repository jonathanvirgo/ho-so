var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const securityService = require("../services/securityService");
const auditService = require("../services/auditService");
const projectController = require('../controllers/projectController');

// Project Management Routes - with proper authorization
router.get("/",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getList);

router.post("/list",
    commonService.isAuthenticatedPostList,
    securityService.requirePermission('projects', 'read'),
    projectController.getListTable);

router.get("/create",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'write'),
    projectController.getCreate);

router.post("/create",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'write'),
    auditService.createAuditMiddleware('CREATE', 'project'),
    projectController.create);

router.get("/:id/edit",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'write'),
    projectController.getEdit);

router.post("/update",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'write'),
    auditService.createAuditMiddleware('UPDATE', 'project'),
    projectController.update);

router.post("/:id/delete",
    commonService.isAuthenticatedPost,
    securityService.requirePermission('projects', 'delete'),
    auditService.createAuditMiddleware('DELETE', 'project'),
    projectController.delete);

router.get("/:id/detail",
    commonService.isAuthenticated,
    securityService.requirePermission('projects', 'read'),
    projectController.getDetail);

module.exports = router;
