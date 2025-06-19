const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.User;
const { createUrl } = require('../utils/urlHelper');

// Auth middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in to access this page');
    res.redirect(createUrl('/auth/login'));
};

module.exports = (app) => {
    // Only initialize passport if app is provided
    if (app) {
        // Initialize passport
        app.use(passport.initialize());
        app.use(passport.session());

        // Local Strategy (username/password)
        passport.use(new LocalStrategy(async (username, password, done) => {
            try {
                // Find user by username
                const user = await User.findOne({ where: { username: username } });

                if (!user) {
                    return done(null, false, { message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
                }

                // Verify password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
                }

                // All good, return user
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }));

        // Serialize and deserialize user
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findByPk(id);
                done(null, user);
            } catch (err) {
                done(err);
            }
        });
    }

    return { isAuthenticated };
};

// Export isAuthenticated middleware directly for easy import
module.exports.isAuthenticated = isAuthenticated;