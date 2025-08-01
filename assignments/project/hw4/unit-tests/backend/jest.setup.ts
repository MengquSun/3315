/**
 * Jest setup file for backend unit tests
 * Global test configuration and utilities
 */

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '10';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidEmail(): R;
      toBeValidTaskTitle(): R;
      toBeValidPriority(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => 
        pass 
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid date`,
      pass,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
      pass,
    };
  },

  toBeValidTaskTitle(received: string) {
    const pass = typeof received === 'string' && 
                 received.trim().length > 0 && 
                 received.length <= 200;
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid task title`
          : `expected ${received} to be a valid task title (1-200 characters)`,
      pass,
    };
  },

  toBeValidPriority(received: string) {
    const validPriorities = ['low', 'medium', 'high'];
    const pass = validPriorities.includes(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid priority`
          : `expected ${received} to be one of: ${validPriorities.join(', ')}`,
      pass,
    };
  }
});

// Mock Firebase Admin SDK for testing
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn()
    }))
  }))
}));

// Mock bcrypt for consistent test results
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('test-salt'),
  hash: jest.fn().mockResolvedValue('test-hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jsonwebtoken for consistent test results
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id' })
}));

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

export const createMockUserSchema = (overrides = {}) => ({
  ...createMockUser(),
  passwordHash: 'test-hashed-password',
  isActive: true,
  ...overrides
});

export const createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  userId: 'test-user-id',
  title: 'Test Task',
  description: 'Test task description',
  dueDate: new Date('2025-02-01T00:00:00Z'),
  priority: 'medium',
  status: 'active',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

export const createMockTaskInput = (overrides = {}) => ({
  title: 'Test Task',
  description: 'Test task description',
  dueDate: new Date('2025-02-01T00:00:00Z'),
  priority: 'medium',
  ...overrides
});

export const createMockAuthResult = (overrides = {}) => ({
  user: createMockUser(),
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresIn: 3600,
  ...overrides
});

// Test helper functions
export const mockRequest = (options = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  cookies: {},
  ...options
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Database test helpers
export const createMockDatabaseService = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  getStats: jest.fn()
});

// Error assertion helpers
export const expectAppError = (error: any, type: string, code: string) => {
  expect(error).toBeInstanceOf(Error);
  expect(error.type).toBe(type);
  expect(error.code).toBe(code);
};

// Time helpers for testing
export const freezeTime = (date: string | Date) => {
  const frozenDate = new Date(date);
  jest.spyOn(Date, 'now').mockReturnValue(frozenDate.getTime());
  jest.spyOn(global, 'Date').mockImplementation(() => frozenDate);
  return frozenDate;
};

export const unfreezeTime = () => {
  jest.restoreAllMocks();
};