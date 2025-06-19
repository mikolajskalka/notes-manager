/**
 * Tests for URL Helper utilities
 */

const { createUrl } = require('../../utils/urlHelper');

describe('URL Helper', () => {
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

    describe('createUrl', () => {
        it('should return path as-is when BASE_PATH is not set', () => {
            delete process.env.BASE_PATH;

            expect(createUrl('/test')).toBe('/test');
            expect(createUrl('/auth/login')).toBe('/auth/login');
            expect(createUrl('/notes')).toBe('/notes');
        });

        it('should prepend BASE_PATH when it is set', () => {
            process.env.BASE_PATH = '/12040';

            expect(createUrl('/test')).toBe('/12040/test');
            expect(createUrl('/auth/login')).toBe('/12040/auth/login');
            expect(createUrl('/notes')).toBe('/12040/notes');
        });

        it('should handle empty string BASE_PATH', () => {
            process.env.BASE_PATH = '';

            expect(createUrl('/test')).toBe('/test');
            expect(createUrl('/auth/login')).toBe('/auth/login');
        });

        it('should handle BASE_PATH with trailing slash', () => {
            process.env.BASE_PATH = '/12040/';

            expect(createUrl('/test')).toBe('/12040//test');
            // Note: This might be a design decision - do we want to handle this case?
        });

        it('should handle relative paths', () => {
            process.env.BASE_PATH = '/12040';

            expect(createUrl('test')).toBe('/12040test');
            expect(createUrl('auth/login')).toBe('/12040auth/login');
        });
    });
});
