const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  console.log('[db] Connecting to MongoDB...');

  if (!MONGODB_URI) {
    console.error('[db] MONGODB_URI is not defined in the environment.');
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (cached.conn) {
    console.log('[db] Reusing existing MongoDB connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[db] Creating a new MongoDB connection...');

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000
      })
      .then((connection) => {
        cached.conn = connection;
        console.log('[db] Connected to MongoDB successfully.');
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('[db] Failed to connect to MongoDB:', error);
        throw error;
      });
  }

  return cached.promise;
};

module.exports = { connectDatabase };
