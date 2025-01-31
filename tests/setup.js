const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const connect = async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const mongooseOpts = {
      autoIndex: true,
    };

    await mongoose.connect(uri, mongooseOpts);
  } catch (err) {
    console.error('Error connecting to test database:', err);
    throw err;
  }
};

const closeDatabase = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error closing test database:', err);
    throw err;
  }
};

const clearDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      const { collections } = mongoose.connection;
      const promises = Object.values(collections).map((collection) =>
        collection.deleteMany({})
      );
      await Promise.all(promises);
    }
  } catch (err) {
    console.error('Error clearing test database:', err);
    throw err;
  }
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
};