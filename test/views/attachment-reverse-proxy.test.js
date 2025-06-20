/**
 * Tests for attachment URL handling with reverse proxy
 */

const { createUrl } = require('../../utils/urlHelper');

describe('Attachment URLs with Reverse Proxy', () => {
    // Store original BASE_PATH
    const originalBasePath = process.env.BASE_PATH;

    afterEach(() => {
        // Restore original BASE_PATH after each test
        if (originalBasePath) {
            process.env.BASE_PATH = originalBasePath;
        } else {
            delete process.env.BASE_PATH;
        }
    });

    describe('createUrl function with attachment paths', () => {
        test('should return attachment path as-is when BASE_PATH is not set', () => {
            delete process.env.BASE_PATH;

            expect(createUrl('/uploads/test-file.pdf')).toBe('/uploads/test-file.pdf');
            expect(createUrl('/uploads/document.docx')).toBe('/uploads/document.docx');
        });

        test('should prepend BASE_PATH to attachment paths for reverse proxy', () => {
            process.env.BASE_PATH = '/12040';

            expect(createUrl('/uploads/test-file.pdf')).toBe('/12040/uploads/test-file.pdf');
            expect(createUrl('/uploads/document.docx')).toBe('/12040/uploads/document.docx');
        });

        test('should handle different BASE_PATH values', () => {
            process.env.BASE_PATH = '/8080';

            expect(createUrl('/uploads/image.jpg')).toBe('/8080/uploads/image.jpg');

            process.env.BASE_PATH = '/reverse-proxy';

            expect(createUrl('/uploads/file.txt')).toBe('/reverse-proxy/uploads/file.txt');
        });

        test('should handle empty BASE_PATH', () => {
            process.env.BASE_PATH = '';

            expect(createUrl('/uploads/test-file.pdf')).toBe('/uploads/test-file.pdf');
        });
    });

    describe('attachment URL verification in templates', () => {
        test('should confirm templates now use createUrl for attachments', () => {
            const fs = require('fs');
            const path = require('path');

            // Read the show.ejs template
            const showTemplate = fs.readFileSync(
                path.join(__dirname, '../../views/notes/show.ejs'),
                'utf8'
            );

            // Read the edit.ejs template
            const editTemplate = fs.readFileSync(
                path.join(__dirname, '../../views/notes/edit.ejs'),
                'utf8'
            );

            // Verify that attachment URLs now use createUrl
            expect(showTemplate).toContain('createUrl(note.attachment)');
            expect(editTemplate).toContain('createUrl(note.attachment)');

            // Verify that the old direct attachment references are gone
            expect(showTemplate).not.toContain('href="<%= note.attachment %>"');
            expect(editTemplate).not.toContain('href="<%= note.attachment %>"');
        });
    });
});
