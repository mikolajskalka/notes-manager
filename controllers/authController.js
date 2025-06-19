const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.User;

// Display login form
exports.loginForm = (req, res) => {
    res.render('auth/login', {
        error: req.flash('error'),
        success: req.flash('success')
    });
};

// Process login
exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message || 'Nieprawidłowe dane logowania');
            const basePath = req.app && req.app.get('basePath') ? req.app.get('basePath') : '';
            return res.redirect(basePath + '/auth/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            const basePath = req.app && req.app.get('basePath') ? req.app.get('basePath') : '';
            res.redirect(basePath + '/notes');
        });
    })(req, res, next);
};

// Display register form
exports.registerForm = (req, res) => {
    res.render('auth/register', {
        error: req.flash('error')
    });
};

// Process register
exports.register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validation
        if (password !== confirmPassword) {
            req.flash('error', 'Hasła nie są zgodne');
            return res.redirect('/auth/register');
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            req.flash('error', 'Użytkownik o podanym loginie lub adresie email już istnieje');
            return res.redirect('/auth/register');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await User.create({
            username,
            email,
            password: hashedPassword
        });

        req.flash('success', 'Konto zostało utworzone. Możesz się teraz zalogować.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Wystąpił błąd podczas rejestracji');
        res.redirect('/auth/register');
    }
};

// Logout
exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/notes');
        }
        req.flash('success', 'Wylogowano pomyślnie');
        res.redirect('/auth/login');
    });
};

// Microsoft authentication
exports.microsoftAuth = passport.authenticate('microsoft', {
    scope: ['user.read']
});

exports.microsoftCallback = passport.authenticate('microsoft', {
    successRedirect: '/notes',
    failureRedirect: '/auth/login',
    failureFlash: true,
    successFlash: 'Pomyślnie zalogowano przez konto Microsoft!'
});