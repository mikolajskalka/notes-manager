const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

// Helper to get basePath
function getBasePath(req) {
    return req.app && req.app.get('basePath') ? req.app.get('basePath') : '';
}

// Login routes
router.get('/login', authController.loginForm);
router.post('/login', authController.login);

// Register routes
router.get('/register', authController.registerForm);
router.post('/register', authController.register);

// Logout route
router.get('/logout', (req, res) => {
    req.logout(() => {
        req.flash('success', 'Wylogowano pomyślnie.');
        const basePath = getBasePath(req);
        res.redirect(basePath + '/auth/login');
    });
});

// Microsoft OAuth routes
router.get('/microsoft', authController.microsoftAuth);
router.get('/microsoft/callback', authController.microsoftCallback);

module.exports = router;