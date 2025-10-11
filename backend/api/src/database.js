const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  console.log("[db] Iniciando conexão com o MongoDB...");

  if (!MONGODB_URI) {
    console.error("[db] MONGODB_URI não está definida no ambiente.");
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (cached.conn) {
    console.log("[db] Já existe uma conexão, retornando...");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[db] Criando uma nova conexão...");

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        connectTimeoutMS: 5000,  // Tempo limite de 5 segundos para conectar ao banco
        socketTimeoutMS: 5000,   // Timeout de socket de 5 segundos
      })
      .then((connection) => {
        cached.conn = connection;
        console.log('[db] Conectado ao MongoDB com sucesso');
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('[db] Falha ao conectar ao MongoDB:', error);
        throw error;
      });
  }

  return cached.promise;
};

module.exports = { connectDatabase };
