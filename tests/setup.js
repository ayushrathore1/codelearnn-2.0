/**
 * Test Setup - Runs before each test file
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

// Clear all collections after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Disconnect and stop MongoDB after all tests
afterAll(async () => {
  // Clean up cache service intervals
  try {
    const caches = require("../services/CacheService");
    if (caches.videoAnalysis?.destroy) caches.videoAnalysis.destroy();
    if (caches.readiness?.destroy) caches.readiness.destroy();
    if (caches.careerData?.destroy) caches.careerData.destroy();
    if (caches.general?.destroy) caches.general.destroy();
  } catch (e) {
    // Cache service may not be loaded
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
