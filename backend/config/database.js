const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((connection) => {
        cached.conn = connection;
        console.log('[db] Connected to MongoDB');
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('[db] Failed to connect to MongoDB', error);
        throw error;
      });
  }

  return cached.promise;
};

module.exports = { connectDatabase };
