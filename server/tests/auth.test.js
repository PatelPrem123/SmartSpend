import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_auth_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
});

describe('Phase 2: Authentication & User Management (DEC-007)', () => {
  const validUser = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a user, hashes password, seeds categories and returns JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user.baseCurrency).toBe('INR');
      expect(res.body.user).not.toHaveProperty('password');

      // Verify password was securely hashed
      const dbUser = await User.findById(res.body.user.id).select('+password');
      expect(dbUser.password).not.toBe(validUser.password);
      expect(dbUser.password).toMatch(/^\$2[aby]\$\d+\$/); // Bcrypt hash format

      // Verify default categories were seeded
      const categories = await Category.find({ userId: res.body.user.id });
      expect(categories.length).toBeGreaterThan(10);
      const hasFood = categories.some((c) => c.name === 'Food & Dining');
      const hasSalary = categories.some((c) => c.name === 'Salary');
      expect(hasFood).toBe(true);
      expect(hasSalary).toBe(true);
    });

    it('rejects registration with duplicate email with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);

      const duplicateRes = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error).toContain('already exists');
    });

    it('rejects passwords shorter than 8 characters or missing required complexity', async () => {
      const shortPassRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'short@example.com', password: 'pass1' });

      expect(shortPassRes.status).toBe(400);
      expect(shortPassRes.body.success).toBe(false);

      const noNumberRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'nonumber@example.com', password: 'passwordonly' });

      expect(noNumberRes.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('logs in successfully with valid credentials and sets HttpOnly cookie', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());

      // Check HttpOnly cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('jwt=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('rejects non-existent email with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me & User Isolation', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send(validUser);
      token = reg.body.token;
      userId = reg.body.user.id;
    });

    it('retrieves user profile when Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.name).toBe(validUser.name);
    });

    it('retrieves user profile when HttpOnly cookie is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`jwt=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(userId);
    });

    it('rejects request without token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access token is missing');
    });

    it('enforces tenant isolation between separate users', async () => {
      // Register a second user
      const user2 = {
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'Password456!',
      };
      const reg2 = await request(app).post('/api/v1/auth/register').send(user2);
      const token2 = reg2.body.token;

      // User 2 queries /me, must receive User 2 data, NOT User 1
      const res2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token2}`);

      expect(res2.status).toBe(200);
      expect(res2.body.user.email).toBe(user2.email.toLowerCase());
      expect(res2.body.user.id).not.toBe(userId);
    });
  });

  describe('PATCH /api/v1/auth/me & Password Updates', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send(validUser);
      token = reg.body.token;
    });

    it('updates user profile details successfully', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Aarav V. Sharma',
          monthlyBudgetLimitMinor: 5000000, // ₹50,000.00
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Aarav V. Sharma');
      expect(res.body.user.monthlyBudgetLimitMinor).toBe(5000000);
    });

    it('updates password and invalidates previous session token', async () => {
      const updatePassRes = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: validUser.password,
          newPassword: 'BrandNewPassword999!',
        });

      expect(updatePassRes.status).toBe(200);
      expect(updatePassRes.body.success).toBe(true);

      // Attempting to access /me with the OLD token should now be rejected
      const oldTokenRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(oldTokenRes.status).toBe(401);
      expect(oldTokenRes.body.error).toContain('Session expired');

      // Login with NEW password must succeed
      const newLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: 'BrandNewPassword999!',
      });
      expect(newLoginRes.status).toBe(200);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears session cookie upon logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('jwt=none'))).toBe(true);
    });
  });
});
