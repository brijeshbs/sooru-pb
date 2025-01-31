const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const app = require('../src/server');

let server;

beforeAll(async () => {
  await connect();
  server = app.listen(0); // Use random available port
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
  await server.close();
});

describe('Floor Plan API', () => {
  const sampleFloorPlan = {
    name: "3BHK Modern House",
    dimensions: {
      width: 12,
      length: 15
    },
    createdBy: "user123",
    rooms: [
      {
        name: "Living Room",
        type: "living",
        dimensions: { width: 5, length: 6 },
        position: { x: 0, y: 0 }
      }
    ]
  };

  describe('POST /api/floorplans', () => {
    it('should create a new floor plan', async () => {
      const response = await request(app)
        .post('/api/floorplans')
        .send(sampleFloorPlan);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(sampleFloorPlan.name);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/floorplans')
        .send({ name: "Invalid Plan" });

      expect(response.status).toBe(400);
    });
  });
});