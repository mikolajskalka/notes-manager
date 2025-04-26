// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');

// Import routes
const notesRoutes = require('./routes/notes');
const authRoutes = require('./routes/auth');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method')); // To support PUT and DELETE in forms

// Session & Flash setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'notes-manager-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(flash());

// Initialize Passport authentication
const { isAuthenticated } = require('./config/passport')(app);

// Make user data available in all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/notes', isAuthenticated, notesRoutes); // Protect notes routes

// Home route
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/notes');
    }
    res.redirect('/auth/login');
});

// Initialize database and start server
const db = require('./models');

// Sync the database without force option for normal operation
db.sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });