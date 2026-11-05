import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_categories_test';

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

describe('Phase 3: Categories Taxonomy Management (DEC-007, DEC-008)', () => {
  let userToken;

  beforeEach(async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Aditi Rao',
      email: 'aditi.rao@example.com',
      password: 'Password123!',
    });
    userToken = reg.body.token;
  });

  describe('GET /api/v1/categories', () => {
    it('returns seeded default categories and supports type filtering', async () => {
      const allRes = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(allRes.status).toBe(200);
      expect(allRes.body.count).toBe(17); // 10 expense + 7 income

      // Filter by expense
      const expenseRes = await request(app)
        .get('/api/v1/categories?type=expense')
        .set('Authorization', `Bearer ${userToken}`);

      expect(expenseRes.status).toBe(200);
      expect(expenseRes.body.count).toBe(10);
      expect(expenseRes.body.categories.every((c) => c.type === 'expense')).toBe(true);

      // Filter by income
      const incomeRes = await request(app)
        .get('/api/v1/categories?type=income')
        .set('Authorization', `Bearer ${userToken}`);

      expect(incomeRes.status).toBe(200);
      expect(incomeRes.body.count).toBe(7);
      expect(incomeRes.body.categories.every((c) => c.type === 'income')).toBe(true);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('creates custom category with color and icon', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Pet Care & Veterinary',
          type: 'expense',
          icon: 'Dog',
          color: '#ec4899',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe('Pet Care & Veterinary');
      expect(res.body.category.type).toBe('expense');
      expect(res.body.category.isDefault).toBe(false);
    });

    it('rejects duplicate category name for the same type with 409 Conflict', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Cryptocurrency Trading',
          type: 'income',
        });

      const duplicateRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Cryptocurrency Trading',
          type: 'income',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error).toContain('already exists');
    });
  });

  describe('PATCH & DELETE /api/v1/categories/:id', () => {
    it('updates custom category name and color', async () => {
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Books & Subscriptions',
          type: 'expense',
        });

      const categoryId = createRes.body.category._id;

      const updateRes = await request(app)
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Books & Audiobooks',
          color: '#8b5cf6',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.category.name).toBe('Books & Audiobooks');
      expect(updateRes.body.category.color).toBe('#8b5cf6');
    });

    it('prevents deletion of default system categories with 403 Forbidden', async () => {
      const listRes = await request(app)
        .get('/api/v1/categories?type=expense')
        .set('Authorization', `Bearer ${userToken}`);

      const defaultCategory = listRes.body.categories.find((c) => c.isDefault);

      const deleteRes = await request(app)
        .delete(`/api/v1/categories/${defaultCategory._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toContain('Default categories cannot be deleted');
    });

    it('allows deleting custom user categories', async () => {
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Temporary Experiment',
          type: 'expense',
        });

      const customCategoryId = createRes.body.category._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/categories/${customCategoryId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('deleted successfully');
    });
  });
});
