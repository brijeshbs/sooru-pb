const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('./setup');
const FloorPlan = require('../src/models/FloorPlan');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Floor Plan Model', () => {
  const validFloorPlanData = {
    name: "Test House",
    dimensions: {
      width: 10,
      length: 12
    },
    createdBy: "user123",
    rooms: [
      {
        name: "Living Room",
        type: "living",
        dimensions: { width: 4, length: 5 },
        position: { x: 0, y: 0 }
      }
    ]
  };

  it('should create & save floor plan successfully', async () => {
    const floorPlan = new FloorPlan(validFloorPlanData);
    const savedFloorPlan = await floorPlan.save();
    
    expect(savedFloorPlan._id).toBeDefined();
    expect(savedFloorPlan.name).toBe(validFloorPlanData.name);
    expect(savedFloorPlan.status).toBe('draft'); // default value
  });

  it('should fail to save without required fields', async () => {
    const floorPlan = new FloorPlan({ name: "Invalid Plan" });
    
    let err;
    try {
      await floorPlan.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should enforce valid status values', async () => {
    const floorPlan = new FloorPlan({
      ...validFloorPlanData,
      status: 'invalid-status'
    });
    
    let err;
    try {
      await floorPlan.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should update timestamp on modification', async () => {
    const floorPlan = await FloorPlan.create(validFloorPlanData);
    const createdAt = floorPlan.createdAt;
    
    // Wait 1 second to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    floorPlan.name = "Updated Name";
    await floorPlan.save();
    
    expect(floorPlan.createdAt).toEqual(createdAt);
    expect(floorPlan.updatedAt).not.toEqual(createdAt);
  });
});