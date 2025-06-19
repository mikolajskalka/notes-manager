const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
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

                // Check if user has a password (could be OAuth-only user)
                if (!user.password) {
                    return done(null, false, { message: 'To konto używa logowania przez Microsoft' });
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

        // Microsoft Strategy
        // NOTE: You need to replace these with your actual Microsoft app credentials
        passport.use(new MicrosoftStrategy({
            clientID: process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID',
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'YOUR_MICROSOFT_CLIENT_SECRET',
            callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/auth/microsoft/callback',
            scope: ['user.read'],
            tenant: 'common'
        },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists by Microsoft ID
                    let user = await User.findOne({ where: { microsoftId: profile.id } });

                    if (user) {
                        return done(null, user);
                    }

                    // If no user found by Microsoft ID, check by email (for linking accounts)
                    if (profile.emails && profile.emails.length > 0) {
                        const email = profile.emails[0].value;
                        user = await User.findOne({ where: { email: email } });

                        if (user) {
                            // Update existing account with Microsoft ID
                            user.microsoftId = profile.id;
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // Create new user from Microsoft profile
                    const newUser = await User.create({
                        username: profile.displayName || `user_${Date.now()}`,
                        email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.id}@microsoft.com`,
                        microsoftId: profile.id
                    });

                    return done(null, newUser);
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