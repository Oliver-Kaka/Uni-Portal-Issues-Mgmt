/** @type {import('jest').Config} */
export default {
  transform: {},
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    '^sanitize-html$': '<rootDir>/src/__mocks__/sanitize-html.js',
  },
};
