const bcrypt = require('bcryptjs');
const authController = require('../../controllers/authController');
const { User } = require('../../models');

// Mock dependencies
jest.mock('../../models', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn()
    },
    Sequelize: {
        Op: {
            or: Symbol('or')
        }
    }
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => Promise.resolve('hashedPassword123'))
}));

jest.mock('passport', () => ({
    authenticate: jest.fn(() => (req, res, next) => next())
}));

describe('Auth Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup request and response objects
        req = {
            body: {},
            flash: jest.fn(),
            logout: jest.fn((callback) => callback()),
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    describe('loginForm', () => {
        test('should render login form', () => {
            // Set flash values
            req.flash.mockImplementation((type) => {
                if (type === 'error') return ['Error message'];
                if (type === 'success') return ['Success message'];
                return [];
            });

            // Call the controller method
            authController.loginForm(req, res);

            // Assertions
            expect(res.render).toHaveBeenCalledWith('auth/login', {
                error: ['Error message'],
                success: ['Success message']
            });
        });
    });

    describe('registerForm', () => {
        test('should render register form', () => {
            // Set flash values
            req.flash.mockImplementation((type) => {
                if (type === 'error') return ['Error message'];
                return [];
            });

            // Call the controller method
            authController.registerForm(req, res);

            // Assertions
            expect(res.render).toHaveBeenCalledWith('auth/register', {
                error: ['Error message']
            });
        });
    });

    describe('register', () => {
        test('should create a new user and redirect to login', async () => {
            // Setup request
            req.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            // Mock User.findOne to return null (user does not exist)
            User.findOne.mockResolvedValue(null);

            // Mock User.create
            User.create.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com'
            });

            // Call the controller method
            await authController.register(req, res);

            // Assertions
            expect(User.findOne).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(User.create).toHaveBeenCalledWith({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedPassword123'
            });
            expect(req.flash).toHaveBeenCalledWith('success', 'Konto zostało utworzone. Możesz się teraz zalogować.');
            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        });

        test('should not create user when passwords do not match', async () => {
            // Setup request with mismatched passwords
            req.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'differentPassword'
            };

            // Call the controller method
            await authController.register(req, res);

            // Assertions
            expect(req.flash).toHaveBeenCalledWith('error', 'Hasła nie są zgodne');
            expect(res.redirect).toHaveBeenCalledWith('/auth/register');
            expect(User.create).not.toHaveBeenCalled();
        });

        test('should not create user when username or email already exists', async () => {
            // Setup request
            req.body = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            // Mock User.findOne to return an existing user
            User.findOne.mockResolvedValue({
                id: 1,
                username: 'existinguser',
                email: 'existing@example.com'
            });

            // Call the controller method
            await authController.register(req, res);

            // Assertions
            expect(req.flash).toHaveBeenCalledWith('error', 'Użytkownik o podanym loginie lub adresie email już istnieje');
            expect(res.redirect).toHaveBeenCalledWith('/auth/register');
            expect(User.create).not.toHaveBeenCalled();
        });

        test('should handle errors during registration', async () => {
            // Setup request
            req.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            // Mock User.findOne to throw an error
            User.findOne.mockRejectedValue(new Error('Database error'));

            // Mock console.error
            console.error = jest.fn();

            // Call the controller method
            await authController.register(req, res);

            // Assertions
            expect(console.error).toHaveBeenCalled();
            expect(req.flash).toHaveBeenCalledWith('error', 'Wystąpił błąd podczas rejestracji');
            expect(res.redirect).toHaveBeenCalledWith('/auth/register');
        });
    });

    describe('logout', () => {
        test('should logout user and redirect to login page', () => {
            // Call the controller method
            authController.logout(req, res);

            // Assertions
            expect(req.logout).toHaveBeenCalled();
            expect(req.flash).toHaveBeenCalledWith('success', 'Wylogowano pomyślnie');
            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        });

        test('should handle logout errors', () => {
            // Setup logout to call callback with an error
            req.logout.mockImplementation((callback) => callback(new Error('Logout error')));

            // Mock console.error
            console.error = jest.fn();

            // Call the controller method
            authController.logout(req, res);

            // Assertions
            expect(console.error).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/notes');
        });
    });
});