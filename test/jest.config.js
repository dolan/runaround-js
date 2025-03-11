module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    rootDir: './',
    verbose: true,
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
  };