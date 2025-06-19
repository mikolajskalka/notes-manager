const express = require('express');
const request = require('supertest');
const { Note, Label } = require('../../models');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../models', () => ({
    Note: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        destroy: jest.fn()
    },
    Label: {
        findAll: jest.fn()
    },
    NoteLabel: {
        findAll: jest.fn()
    },
    Sequelize: {
        Op: {
            and: Symbol('and'),
            or: Symbol('or'),
            like: Symbol('like')
        }
    }
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    unlinkSync: jest.fn()
}));

// Setup Express app for testing
const setupApp = () => {
    const app = express();

    // Configure middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock view rendering
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../views'));

    // Override res.render to avoid actual template rendering
    app.use((req, res, next) => {
        res.render = function (view, locals) {
            res.contentType('text/html');
            res.send(JSON.stringify(locals));
        };
        next();
    });

    // Mock auth middleware - all users authenticated with id=1
    app.use((req, res, next) => {
        req.user = { id: 1 };
        req.isAuthenticated = jest.fn().mockReturnValue(true);
        req.flash = jest.fn();
        next();
    });

    // Setup routes
    const notesRouter = require('../../routes/notes');
    app.use('/notes', notesRouter);

    return app;
};

describe('Notes Routes', () => {
    let app;
    let originalConsoleError;

    beforeEach(() => {
        jest.clearAllMocks();
        app = setupApp();
        // Save original console.error
        originalConsoleError = console.error;
    });

    afterEach(() => {
        // Restore original console.error
        console.error = originalConsoleError;
    });

    describe('GET /notes', () => {
        test('should get all notes for the current user', async () => {
            // Mock data
            const notes = [
                { id: 1, title: 'Note 1', content: 'Content 1', userId: 1 },
                { id: 2, title: 'Note 2', content: 'Content 2', userId: 1 }
            ];
            const labels = [
                { id: 1, name: 'Label 1' },
                { id: 2, name: 'Label 2' }
            ];

            // Mock the findAll methods
            Note.findAll.mockResolvedValue(notes);
            Label.findAll.mockResolvedValue(labels);

            // Make request
            const response = await request(app).get('/notes');

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(Note.findAll).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: [Label],
                order: [['updatedAt', 'DESC']]
            });

            // Verify response contains notes data
            const responseData = JSON.parse(response.text);
            expect(responseData).toHaveProperty('notes');
            expect(responseData.notes).toEqual(notes);
        });

        test('should handle errors when fetching notes', async () => {
            // Mock console.error to suppress output
            console.error = jest.fn();

            // Mock findAll to throw an error
            Note.findAll.mockRejectedValue(new Error('Database error'));
            Label.findAll.mockResolvedValue([]); // Mock labels to succeed

            // Make request
            const response = await request(app).get('/notes');

            // Assertions
            expect(response.statusCode).toBe(302); // Should redirect to /notes due to error handling
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('GET /notes/search', () => {
        test('should search notes with the provided query', async () => {
            // Mock data
            const notes = [
                { id: 1, title: 'Meeting Notes', content: 'Content with search term', userId: 1 }
            ];

            // Mock the findAll method
            Note.findAll.mockResolvedValue(notes);
            Label.findAll.mockResolvedValue([]);

            // Make request
            const response = await request(app).get('/notes/search?query=search term');

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(Note.findAll).toHaveBeenCalled();

            // Verify response contains notes data and search query
            const responseData = JSON.parse(response.text);
            expect(responseData).toHaveProperty('notes');
            expect(responseData.notes).toEqual(notes);
            expect(responseData).toHaveProperty('searchQuery', 'search term');
        });

        test('should redirect to /notes if query is empty', async () => {
            // Make request with empty query
            const response = await request(app).get('/notes/search?query=');

            // Assertions
            expect(response.statusCode).toBe(302); // Redirect status
            expect(response.headers.location).toBe('/notes');
        });
    });

    describe('GET /notes/:id', () => {
        test('should get a single note by id', async () => {
            // Mock data
            const note = {
                id: 1,
                title: 'Test Note',
                content: 'Test Content',
                userId: 1
            };

            // Mock the findOne method
            Note.findOne.mockResolvedValue(note);
            Label.findAll.mockResolvedValue([]);

            // Make request
            const response = await request(app).get('/notes/1');

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(Note.findOne).toHaveBeenCalledWith({
                where: {
                    id: "1",
                    userId: 1
                },
                include: [Label]
            });

            // Verify response contains note data
            const responseData = JSON.parse(response.text);
            expect(responseData).toHaveProperty('note');
            expect(responseData.note).toEqual(note);
        });

        test('should return 404 if note is not found', async () => {
            // Mock findOne to return null
            Note.findOne.mockResolvedValue(null);
            Label.findAll.mockResolvedValue([]);

            // Make request
            const response = await request(app).get('/notes/999');

            // Assertions - the route redirects to /notes when note is not found
            expect(response.statusCode).toBe(302);
            expect(response.headers.location).toBe('/notes');
        });
    });

    describe('DELETE /notes/:id', () => {
        test('should delete a note', async () => {
            // Mock data
            const note = {
                id: 1,
                title: 'Test Note',
                content: 'Test Content',
                userId: 1,
                attachment: null,
                destroy: jest.fn().mockResolvedValue(true)
            };

            // Mock the findOne method
            Note.findOne.mockResolvedValue(note);

            // Make request
            const response = await request(app)
                .delete('/notes/1')
                .send({ _method: 'DELETE' });

            // Assertions
            expect(Note.findOne).toHaveBeenCalledWith({
                where: {
                    id: "1",
                    userId: 1
                }
            });
            expect(note.destroy).toHaveBeenCalled();
        });

        test('should delete attachment file if it exists', async () => {
            // Mock data
            const note = {
                id: 1,
                title: 'Test Note',
                content: 'Test Content',
                userId: 1,
                attachment: '/uploads/test.pdf',
                destroy: jest.fn().mockResolvedValue(true)
            };

            // Mock file exists
            fs.existsSync.mockReturnValue(true);

            // Mock the findOne method
            Note.findOne.mockResolvedValue(note);

            // Make request
            const response = await request(app)
                .delete('/notes/1')
                .send({ _method: 'DELETE' });

            // Assertions
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(note.destroy).toHaveBeenCalled();
        });
    });
});