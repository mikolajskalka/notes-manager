const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.User;
const { createUrl } = require('../utils/urlHelper');

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
            return res.redirect(createUrl('/auth/login'));
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            res.redirect(createUrl('/notes'));
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
            return res.redirect(createUrl('/auth/register'));
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
            return res.redirect(createUrl('/auth/register'));
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
        res.redirect(createUrl('/auth/login'));
    } catch (err) {
        console.error(err);
        req.flash('error', 'Wystąpił błąd podczas rejestracji');
        res.redirect(createUrl('/auth/register'));
    }
};

// Logout
exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect(createUrl('/notes'));
        }
        req.flash('success', 'Wylogowano pomyślnie');
        res.redirect(createUrl('/auth/login'));
    });
};