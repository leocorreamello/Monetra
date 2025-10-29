const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

// Cache global para reutilizar conexões entre invocações serverless
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error('[db] MONGODB_URI is not defined in the environment.');
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  // Se já tiver uma conexão ativa, reutilizar
  if (cached.conn) {
    console.log('[db] Reusing existing MongoDB connection.');
    return cached.conn;
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (!cached.promise) {
    console.log('[db] Creating a new MongoDB connection...');

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[db] Connected to MongoDB successfully.');
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('[db] Failed to connect to MongoDB:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

module.exports = { connectDatabase };

