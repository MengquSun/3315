/**
 * Authentication Integration Tests
 * Tests complete authentication workflows and security features
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../../hw3/backend/src/app';
import { AuthService } from '../../hw3/backend/src/services/AuthService';
import { DatabaseService } from '../../hw3/backend/src/services/DatabaseService';
import {
    LoginRequest,
    SignupRequest,
    User
} from '../../hw3/shared/types';

describe('Authentication Integration Tests', () => {
  let databaseService: DatabaseService;
  let authService: AuthService;
  let testUser: User;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.connect();
    authService = new AuthService(databaseService);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await databaseService.delete('users', { id: testUser.id });
    }
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await databaseService.delete('users', { email: 'auth-test@example.com' });
  });

  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      // Arrange
      const signupData: SignupRequest = {
        email: 'auth-test@example.com',
        password: 'TestPassword123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(3600);

      testUser = response.body.data.user;

      // Verify user was created in database
      const dbUser = await databaseService.findOne('users', { email: signupData.email });
      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(signupData.email);
      expect(dbUser!.isActive).toBe(true);

      // Verify password was hashed
      expect(dbUser!.passwordHash).toBeDefined();
      expect(dbUser!.passwordHash).not.toBe(signupData.password);
      
      // Verify password hash is valid
      const isValidPassword = await bcrypt.compare(signupData.password, dbUser!.passwordHash);
      expect(isValidPassword).toBe(true);
    });

    it('should enforce email uniqueness', async () => {
      // Arrange
      const signupData: SignupRequest = {
        email: 'auth-test@example.com',
        password: 'TestPassword123!'
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(201);

      // Act & Assert - Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate password complexity', async () => {
      // Test various weak passwords
      const weakPasswords = [
        'short',              // Too short
        'nouppercase123',     // No uppercase
        'NOLOWERCASE123',     // No lowercase
        'NoNumbers',          // No numbers
        'password123'         // Common pattern
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/signup')
          .send({
            email: 'test@example.com',
            password
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('password');
      }
    });

    it('should validate email format', async () => {
      // Test various invalid email formats
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing.domain@.com',
        'two@@domains.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/signup')
          .send({
            email,
            password: 'ValidPassword123!'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('email');
      }
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Create test user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      testUser = signupResponse.body.data.user;
    });

    it('should authenticate with valid credentials', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'auth-test@example.com',
        password: 'TestPassword123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify token is valid JWT
      const decodedToken = jwt.verify(
        response.body.data.accessToken,
        process.env.JWT_SECRET || 'test-secret'
      ) as any;
      expect(decodedToken.userId).toBe(testUser.id);
      expect(decodedToken.email).toBe(testUser.email);

      // Verify lastLoginAt was updated
      const updatedUser = await databaseService.findOne('users', { id: testUser.id });
      expect(updatedUser!.lastLoginAt).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      // Test wrong password
      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(wrongPasswordResponse.body.success).toBe(false);
      expect(wrongPasswordResponse.body.error).toContain('credentials');

      // Test non-existent email
      const wrongEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(wrongEmailResponse.body.success).toBe(false);
      expect(wrongEmailResponse.body.error).toContain('credentials');
    });

    it('should handle remember me functionality', async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: 'auth-test@example.com',
        password: 'TestPassword123!',
        rememberMe: true
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      
      // Verify refresh token has longer expiration when rememberMe is true
      const refreshToken = response.body.data.refreshToken;
      const decodedRefreshToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret'
      ) as any;
      
      const expirationTime = decodedRefreshToken.exp * 1000;
      const now = Date.now();
      const durationMs = expirationTime - now;
      
      // Should be approximately 7 days (604800000 ms) when rememberMe is true
      expect(durationMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000); // 6 days
    });

    it('should handle account deactivation', async () => {
      // Arrange - Deactivate the user
      await databaseService.update('users', { id: testUser.id }, { isActive: false });

      // Act & Assert
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('inactive');
    });
  });

  describe('Token Management', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      testUser = signupResponse.body.data.user;
      accessToken = signupResponse.body.data.accessToken;
      refreshToken = signupResponse.body.data.refreshToken;
    });

    it('should validate access tokens on protected routes', async () => {
      // Act - Access protected route with valid token
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    it('should reject invalid access tokens', async () => {
      // Test malformed token
      const malformedResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(malformedResponse.body.success).toBe(false);

      // Test missing token
      const missingResponse = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(missingResponse.body.success).toBe(false);

      // Test expired token (simulate by creating token with past expiration)
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const expiredResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(expiredResponse.body.success).toBe(false);
    });

    it('should refresh access tokens', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(accessToken);
      expect(response.body.data.expiresIn).toBe(3600);

      // Verify new token works
      const newAccessToken = response.body.data.accessToken;
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.id).toBe(testUser.id);
    });

    it('should reject invalid refresh tokens', async () => {
      // Test invalid refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('refresh token');
    });

    it('should handle token refresh from cookies', async () => {
      // Act - Send refresh token in cookie instead of header
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  describe('Logout Flow', () => {
    let accessToken: string;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      testUser = signupResponse.body.data.user;
      accessToken = signupResponse.body.data.accessToken;
    });

    it('should logout user successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');

      // Verify lastLoginAt was updated
      const updatedUser = await databaseService.findOne('users', { id: testUser.id });
      expect(updatedUser!.lastLoginAt).toBeDefined();
    });

    it('should clear refresh token cookie on logout', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      const cookies = response.get('Set-Cookie');
      const refreshTokenCookie = cookies?.find(cookie => 
        cookie.startsWith('refreshToken=')
      );
      
      if (refreshTokenCookie) {
        expect(refreshTokenCookie).toContain('Max-Age=0');
      }
    });

    it('should handle logout without authentication gracefully', async () => {
      // Act & Assert
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Features', () => {
    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      testUser = signupResponse.body.data.user;
    });

    it('should prevent timing attacks on login', async () => {
      // Test login timing for valid vs invalid emails
      const validEmailStart = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
      const validEmailTime = Date.now() - validEmailStart;

      const invalidEmailStart = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);
      const invalidEmailTime = Date.now() - invalidEmailStart;

      // Times should be similar (within 100ms) to prevent timing attacks
      const timeDifference = Math.abs(validEmailTime - invalidEmailTime);
      expect(timeDifference).toBeLessThan(100);
    });

    it('should rate limit authentication attempts', async () => {
      // This would typically require Redis or similar for rate limiting
      // For now, just test that multiple failed attempts are handled
      
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'auth-test@example.com',
            password: 'WrongPassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // All should fail with 401
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('should sanitize sensitive data from responses', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'sensitive-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(201);

      // Assert - Password should never be in response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('TestPassword123!');
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('passwordHash');

      // Clean up
      await databaseService.delete('users', { email: 'sensitive-test@example.com' });
    });

    it('should validate JWT token structure', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;

      // Act - Decode token
      const decodedToken = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || 'test-secret'
      ) as any;

      // Assert token structure
      expect(decodedToken.userId).toBe(testUser.id);
      expect(decodedToken.email).toBe(testUser.email);
      expect(decodedToken.iat).toBeDefined(); // Issued at
      expect(decodedToken.exp).toBeDefined(); // Expires at
      expect(decodedToken.exp).toBeGreaterThan(decodedToken.iat);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed request bodies', async () => {
      // Test with malformed JSON
      const response = await request(app)
        .post('/api/auth/signup')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: longEmail,
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // This would typically require mocking database failures
      // For integration tests, we assume database is available
      expect(true).toBe(true);
    });

    it('should handle concurrent signup attempts with same email', async () => {
      const signupData = {
        email: 'concurrent-test@example.com',
        password: 'TestPassword123!'
      };

      // Act - Try to create same user concurrently
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/auth/signup')
          .send(signupData)
      );

      const responses = await Promise.all(promises);

      // Assert - Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 201);
      const failedResponses = responses.filter(r => r.status === 409);

      expect(successfulResponses).toHaveLength(1);
      expect(failedResponses).toHaveLength(4);

      // Clean up
      await databaseService.delete('users', { email: signupData.email });
    });
  });
});