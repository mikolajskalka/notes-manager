const { Sequelize, DataTypes } = require('sequelize');
const UserModel = require('../../models/user');

describe('User Model', () => {
    let sequelize;
    let User;

    beforeEach(() => {
        // Create a new Sequelize instance with in-memory SQLite for tests
        sequelize = new Sequelize('sqlite:memory:', {
            logging: false
        });

        // Initialize the User model with the test Sequelize instance
        User = UserModel(sequelize, DataTypes);
    });

    afterEach(async () => {
        await sequelize.close();
    });

    test('should define the User model with correct structure', () => {
        // Verify model attributes
        expect(User.rawAttributes).toHaveProperty('id');
        expect(User.rawAttributes).toHaveProperty('username');
        expect(User.rawAttributes).toHaveProperty('email');
        expect(User.rawAttributes).toHaveProperty('password');
        expect(User.rawAttributes).toHaveProperty('isAdmin');

        // Verify primary key
        expect(User.rawAttributes.id.primaryKey).toBe(true);

        // Check validations
        expect(User.rawAttributes.username.allowNull).toBe(false);
        expect(User.rawAttributes.email.allowNull).toBe(false);
        expect(User.rawAttributes.email.validate).toHaveProperty('isEmail');

        // Check defaults
        expect(User.rawAttributes.isAdmin.defaultValue).toBe(false);
    });

    test('should create a valid user', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Create a test user
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };

        const user = await User.create(userData);

        // Verify the user was created with correct data
        expect(user.id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.password).toBe(userData.password);
        expect(user.isAdmin).toBe(false);
    });

    test('should validate username is required', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Attempt to create a user without a username
        const userData = {
            email: 'test@example.com',
            password: 'password123'
        };

        await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Attempt to create a user with invalid email
        const userData = {
            username: 'testuser',
            email: 'invalid-email',
            password: 'password123'
        };

        await expect(User.create(userData)).rejects.toThrow();
    });
});