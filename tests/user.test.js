const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const app = require('../src/server');
const User = require('../src/models/User');

let server;

beforeAll(async () => {
  await connect();
  server = app.listen(0);
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
  await server.close();
});

describe('User API', () => {
  describe('Registration', () => {
    const validUser = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123"
    };

    it('should register a new user with correct userId format', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(validUser);

      console.log('Registration response:', response.body); // Debug log

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toMatch(/^JOH\d{3}$/);
      expect(response.body.token).toBeDefined();
    });

    it('should not register user without required fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: "John Doe"
          // missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/users/register')
        .send(validUser);

      // Second registration with same email
      const response = await request(app)
        .post('/api/users/register')
        .send(validUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('Login', () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123"
    };

    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send(userData);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      console.log('Login response:', response.body); // Debug log

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});