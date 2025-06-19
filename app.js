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
const labelsRoutes = require('./routes/labels');

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
    const basePath = process.env.BASE_PATH || '';
    res.locals.basePath = basePath;
    req.app.set('basePath', basePath);
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/notes', isAuthenticated, notesRoutes); // Protect notes routes
app.use('/labels', isAuthenticated, labelsRoutes); // Protect labels routes

// Home route
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/notes');
    }
    res.redirect('/auth/login');
});

// Initialize database and start server
const db = require('./models');
const MigrationManager = require('./db/migrationManager');

// Initialize and run database migrations
const initializeDatabase = async () => {
    try {
        // Initialize migration manager
        const migrationManager = new MigrationManager(db.sequelize, db);
        await migrationManager.init();

        // Load and run migrations first
        const migrationsDir = path.join(__dirname, 'db', 'migrations');
        await migrationManager.loadMigrationsFromDirectory(migrationsDir);
        await migrationManager.runMigrations();

        // Then sync the models to ensure all schema elements are in place
        await db.sequelize.sync({ alter: false });
        console.log('Database synchronized after migrations');

        // Check if schema is up to date
        const isUpToDate = await migrationManager.checkSchemaUpToDate();
        if (!isUpToDate) {
            console.warn('Warning: Database schema is not fully up to date with model definitions');
        } else {
            console.log('Database schema is up to date with model definitions');
        }

        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
};

// Start the application
initializeDatabase()
    .then((success) => {
        if (success) {
            app.listen(PORT, () => {
                console.log(`Server started on http://localhost:${PORT}`);
            });
        } else {
            console.error('Failed to initialize database, application not started');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Unexpected error during initialization:', err);
        process.exit(1);
    });