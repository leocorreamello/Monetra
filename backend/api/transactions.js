require('dotenv').config();
const { connectDatabase } = require('./src/database');
const { requireAuth } = require('./src/auth-helper');
const { listarTransacoes, removerPorMes, removerTudo } = require('../src/services/transactions');
const Transaction = require('../models/Transaction');

const handler = async (req, res) => {
  // Configurar headers CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // GET /transactions - Listar transações
    if (req.method === 'GET') {
      // Verificar se é para deletar por mês/ano (query params)
      const { mes, ano } = req.query || {};
      
      if (mes && ano) {
        // DELETE por query string (legacy)
        const removidas = await removerPorMes(req.user.id, mes, ano);
        
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
      const transacoes = await listarTransacoes(req.user.id);
      return res.status(200).json(transacoes);
    }

    // DELETE /transactions - Deletar transações
    if (req.method === 'DELETE') {
      const { mes, ano } = req.query || {};
      
      // DELETE /transactions?mes=X&ano=Y - Deletar por mês/ano
      if (mes && ano) {
        const removidas = await removerPorMes(req.user.id, mes, ano);
        
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
      const removidas = await removerTudo(req.user.id);
      
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
        { _id: id, user: req.user.id },
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

// Exportar com autenticação obrigatória
module.exports = requireAuth(handler);
