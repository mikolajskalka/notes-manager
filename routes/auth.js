const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const { createUrl } = require('../utils/urlHelper');

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
        res.redirect(createUrl('/auth/login'));
    });
});

// Microsoft OAuth routes
router.get('/microsoft', authController.microsoftAuth);
router.get('/microsoft/callback', authController.microsoftCallback);

module.exports = router;