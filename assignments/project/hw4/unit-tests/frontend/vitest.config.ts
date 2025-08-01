/**
 * Vitest configuration for frontend unit tests
 */

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/?(*.)+(spec|test).{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: '../../test-results/coverage-reports/frontend',
      include: [
        '../../../hw3/frontend/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '../../../hw3/frontend/src/**/*.d.ts',
        '../../../hw3/frontend/src/main.tsx',
        '../../../hw3/frontend/src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Mock handling
    clearMocks: true,
    restoreMocks: true,
    
    // Reporter configuration
    reporters: [
      'default',
      'junit'
    ],
    outputFile: {
      junit: '../../test-results/test-reports/frontend-unit-tests.xml'
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../hw3/frontend/src'),
      '@shared': path.resolve(__dirname, '../../../hw3/shared'),
      '@components': path.resolve(__dirname, '../../../hw3/frontend/src/components'),
      '@services': path.resolve(__dirname, '../../../hw3/frontend/src/services'),
      '@pages': path.resolve(__dirname, '../../../hw3/frontend/src/pages'),
      '@hooks': path.resolve(__dirname, '../../../hw3/frontend/src/hooks'),
      '@utils': path.resolve(__dirname, '../../../hw3/frontend/src/utils'),
      '@context': path.resolve(__dirname, '../../../hw3/frontend/src/context')
    }
  },
  
  // Define global variables
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.VITE_API_URL': '"http://localhost:3001"'
  }
});