/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@testing-library/jest-dom$': '<rootDir>/node_modules/@testing-library/jest-dom',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock heavy dependencies to reduce memory footprint
    '^html5-qrcode$': '<rootDir>/src/__mocks__/html5-qrcode.ts',
    '^recharts$': '<rootDir>/src/__mocks__/recharts.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|identity-obj-proxy))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Memory and concurrency settings to prevent OOM
  maxWorkers: 1,
  workerIdleMemoryLimit: 512 * 1024 * 1024, // 512MB per worker
  testTimeout: 60000, // Increased timeout for complex integration tests
  // Force garbage collection between tests
  forceExit: true,
  detectOpenHandles: true,
  // Setup files for proper cleanup
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};