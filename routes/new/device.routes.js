var express = require('express');
var router = express.Router();

const commonService = require("../services/commonService");
const device = require('../controllers/deviceController');

// Device Management
router.get("/", commonService.isAuthenticated, device.getActiveDevices);
router.get("/page", commonService.isAuthenticated, (req, res) => {
    res.render('devices', { user: req.user, errors: [] });
});
router.post("/logout", commonService.isAuthenticatedPost, device.logoutDevice);
router.post("/logout-all-others", commonService.isAuthenticatedPost, device.logoutAllOtherDevices);
router.get("/settings", commonService.isAuthenticated, device.getSessionSettings);
router.post("/settings", commonService.isAuthenticatedPost, device.updateSessionSettings);

module.exports = router;
