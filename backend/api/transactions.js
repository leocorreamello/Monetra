require('dotenv').config();
const { connectDatabase } = require('../api/src/database');
const { listarTransacoes, removerPorMes, removerTudo } = require('../src/services/transactions');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res) => {
  // Configurar headers CORS PRIMEIRO
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('[transactions] Handling OPTIONS preflight');
    return res.status(204).end();
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Autenticar usuário
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      console.log('[transactions] No authorization header');
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[transactions] No token provided');
      return res.status(401).json({ message: 'Not authorized' });
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.sub);
      
      if (!user) {
        console.log('[transactions] User not found');
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      console.log('[transactions] User authenticated:', user.email);
    } catch (jwtError) {
      console.error('[transactions] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Not authorized' });
    }

    // GET /transactions - Listar transações
    if (req.method === 'GET') {
      // Verificar se é para deletar por mês/ano (query params)
      const { mes, ano } = req.query || {};
      
      if (mes && ano) {
        // DELETE por query string (legacy)
        const removidas = await removerPorMes(user.id, mes, ano);
        
        if (removidas === 0) {
          return res.status(404).json({ 
            error: 'Nenhuma transação encontrada para o período informado.' 
          });
        }
        
        return res.status(200).json({ 
          message: 'Transações excluídas com sucesso.', 
          removidas 
        });
      }
      
      // Listar todas as transações
      const transacoes = await listarTransacoes(user.id);
      return res.status(200).json(transacoes);
    }

    // DELETE /transactions - Deletar transações
    if (req.method === 'DELETE') {
      const { mes, ano } = req.query || {};
      
      // DELETE /transactions?mes=X&ano=Y - Deletar por mês/ano
      if (mes && ano) {
        const removidas = await removerPorMes(user.id, mes, ano);
        
        if (removidas === 0) {
          return res.status(404).json({ 
            error: 'Nenhuma transação encontrada para o período informado.' 
          });
        }
        
        return res.status(200).json({ 
          message: 'Transações excluídas com sucesso.', 
          removidas 
        });
      }
      
      // DELETE /transactions (sem query) - Deletar todas
      const removidas = await removerTudo(user.id);
      
      if (removidas === 0) {
        return res.status(200).json({ 
          message: 'Nenhuma transação encontrada para remover.', 
          removidas 
        });
      }
      
      return res.status(200).json({ 
        message: 'Transações removidas com sucesso.', 
        removidas 
      });
    }

    // PUT /transactions/:id/categoria - Atualizar categoria
    if (req.method === 'PUT') {
      // Extrair ID da URL
      const urlParts = req.url.split('/');
      const idIndex = urlParts.indexOf('transactions') + 1;
      const id = urlParts[idIndex];
      const action = urlParts[idIndex + 1];
      
      if (!id || action !== 'categoria') {
        return res.status(400).json({ error: 'URL inválida. Use /transactions/:id/categoria' });
      }
      
      const { categoria } = req.body;
      
      if (!categoria) {
        return res.status(400).json({ error: 'Categoria é obrigatória.' });
      }
      
      const resultado = await Transaction.findOneAndUpdate(
        { _id: id, user: user.id },
        { categoria },
        { new: true }
      ).lean();
      
      if (!resultado) {
        return res.status(404).json({ error: 'Transação não encontrada.' });
      }
      
      return res.status(200).json({ message: 'Categoria atualizada com sucesso.' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('[transactions] Error:', error);
    return res.status(500).json({ 
      message: 'Failed to process request.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
