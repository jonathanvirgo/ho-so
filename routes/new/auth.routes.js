var express = require('express');
var router = express.Router();

const user = require('../controllers/userController');

// Authentication routes
router.get("/login", user.getLogin);
router.get("/sign-up", user.getSignUp);
router.post('/sign-up', user.signUp);
router.post('/login', user.login);
router.get('/logout', user.logout);

module.exports = router;
