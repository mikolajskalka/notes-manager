// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverage: false,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'models/**/*.js',
        'controllers/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**',
    ],
    testMatch: ['**/test/**/*.test.js'],
    verbose: true,
};