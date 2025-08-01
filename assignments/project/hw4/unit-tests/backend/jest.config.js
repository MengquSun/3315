/**
 * Jest configuration for backend unit tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Test files location
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '../../../hw3/backend/src/**/*.ts',
    '!../../../hw3/backend/src/**/*.d.ts',
    '!../../../hw3/backend/src/app.ts'
  ],
  coverageDirectory: '../../test-results/coverage-reports/backend',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../../hw3/backend/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../../hw3/shared/$1'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../../test-results/test-reports',
        outputName: 'backend-unit-tests.xml',
        suiteName: 'Backend Unit Tests'
      }
    ]
  ]
};