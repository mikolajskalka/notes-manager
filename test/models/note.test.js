const { Sequelize, DataTypes } = require('sequelize');
const NoteModel = require('../../models/note');

describe('Note Model', () => {
    let sequelize;
    let Note;

    beforeEach(() => {
        // Create a new Sequelize instance with in-memory SQLite for tests
        sequelize = new Sequelize('sqlite:memory:', {
            logging: false
        });

        // Initialize the Note model with the test Sequelize instance
        Note = NoteModel(sequelize, DataTypes);
    });

    afterEach(async () => {
        await sequelize.close();
    });

    test('should define the Note model with correct structure', () => {
        // Verify model attributes
        expect(Note.rawAttributes).toHaveProperty('id');
        expect(Note.rawAttributes).toHaveProperty('title');
        expect(Note.rawAttributes).toHaveProperty('content');
        expect(Note.rawAttributes).toHaveProperty('attachment');
        expect(Note.rawAttributes).toHaveProperty('userId');
        expect(Note.rawAttributes).toHaveProperty('createdAt');
        expect(Note.rawAttributes).toHaveProperty('updatedAt');

        // Verify primary key
        expect(Note.rawAttributes.id.primaryKey).toBe(true);

        // Check validations
        expect(Note.rawAttributes.title.allowNull).toBe(false);
        expect(Note.rawAttributes.content.allowNull).toBe(false);

        // Check optional fields
        expect(Note.rawAttributes.attachment.allowNull).toBe(true);
    });

    test('should create a valid note', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Create a test note
        const noteData = {
            title: 'Test Note',
            content: 'This is a test note content',
            userId: 1
        };

        const note = await Note.create(noteData);

        // Verify the note was created with correct data
        expect(note.id).toBeDefined();
        expect(note.title).toBe(noteData.title);
        expect(note.content).toBe(noteData.content);
        expect(note.userId).toBe(noteData.userId);
        expect(note.createdAt).toBeDefined();
        expect(note.updatedAt).toBeDefined();
    });

    test('should validate title is required', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Attempt to create a note without a title
        const noteData = {
            content: 'This is a test note content',
            userId: 1
        };

        await expect(Note.create(noteData)).rejects.toThrow();
    });

    test('should validate content is required', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Attempt to create a note without content
        const noteData = {
            title: 'Test Note',
            userId: 1
        };

        await expect(Note.create(noteData)).rejects.toThrow();
    });

    test('should create a note with an attachment', async () => {
        // Sync the model with the database
        await sequelize.sync({ force: true });

        // Create a test note with attachment
        const noteData = {
            title: 'Test Note with Attachment',
            content: 'This is a test note content with attachment',
            attachment: '/uploads/test-file.pdf',
            userId: 1
        };

        const note = await Note.create(noteData);

        // Verify the note was created with correct attachment
        expect(note.attachment).toBe(noteData.attachment);
    });
});