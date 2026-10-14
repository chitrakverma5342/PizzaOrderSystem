/**
 * Jest Configuration — Pizza Ordering System STLC Project
 */
module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['**/tests/unit/**/*.test.js'],
    collectCoverageFrom: [
        'src/utils/**/*.js',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};
