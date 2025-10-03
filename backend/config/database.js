const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[auth] Connected to MongoDB');
  } catch (error) {
    console.error('[auth] Failed to connect to MongoDB', error);
    throw error;
  }
};

module.exports = { connectDatabase };
