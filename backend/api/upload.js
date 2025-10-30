require('dotenv').config();
const path = require('path');
const { connectDatabase } = require('../api/src/database');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  detectarDiasExtrato,
  parseCsvContent,
  parseTxtContent,
  removerTransacoesDias,
  salvarTransacoes
} = require('../src/services/transactions');

// Helper para parse multipart/form-data no contexto serverless
const parseMultipartFormData = (req) => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error('Content-Type must be multipart/form-data'));
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('No boundary found in Content-Type'));
    }

    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString('binary');
    });

    req.on('end', () => {
      try {
        const parts = body.split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('Content-Disposition') && part.includes('filename=')) {
            // Extrair nome do arquivo
            const filenameMatch = part.match(/filename="(.+?)"/);
            const filename = filenameMatch ? filenameMatch[1] : '';
            
            // Extrair conteúdo do arquivo
            const contentStartIndex = part.indexOf('\r\n\r\n') + 4;
            const contentEndIndex = part.lastIndexOf('\r\n');
            const fileContent = part.substring(contentStartIndex, contentEndIndex);
            
            // Converter para Buffer
            const buffer = Buffer.from(fileContent, 'binary');
            
            resolve({
              filename,
              buffer
            });
            return;
          }
        }
        
        reject(new Error('No file found in request'));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
};

module.exports = async (req, res) => {
  // Configurar headers CORS PRIMEIRO
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('[upload] Handling OPTIONS preflight');
    return res.status(204).end();
  }

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Autenticar usuário
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      console.log('[upload] No authorization header');
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[upload] No token provided');
      return res.status(401).json({ message: 'Not authorized' });
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.sub);
      
      if (!user) {
        console.log('[upload] User not found');
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      console.log('[upload] User authenticated:', user.email);
    } catch (jwtError) {
      console.error('[upload] JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Parse do arquivo enviado
    const file = await parseMultipartFormData(req);
    
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const extension = path.extname(file.filename).toLowerCase();
    const allowedExtensions = ['.csv', '.txt'];

    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({ 
        error: 'Tipo de arquivo não suportado. Apenas CSV e TXT são aceitos.' 
      });
    }

    // Parse do conteúdo do arquivo
    let transacoes;
    let tipoArquivo;

    if (extension === '.csv') {
      transacoes = parseCsvContent(file.buffer);
      tipoArquivo = 'csv';
    } else if (extension === '.txt') {
      transacoes = parseTxtContent(file.buffer);
      tipoArquivo = 'txt';
    }

    // Detectar dias do extrato
    const diasInfo = detectarDiasExtrato(transacoes);

    // Remover transações dos dias que estão sendo importados
    if (diasInfo?.diasUnicos?.length) {
      await removerTransacoesDias(diasInfo.diasUnicos, user.id);
    }

    // Salvar transações
    const totalSalvas = await salvarTransacoes(transacoes, user.id);

    return res.status(200).json({
      message: `Arquivo ${tipoArquivo.toUpperCase()} processado com sucesso! ${totalSalvas} transações salvas.`,
      tipo: tipoArquivo,
      totalTransacoes: totalSalvas,
      diasProcessados: diasInfo ? diasInfo.diasUnicos : [],
      intervaloDias: diasInfo ? `${diasInfo.dataInicio} - ${diasInfo.dataFim}` : null
    });

  } catch (error) {
    console.error('[upload] Error:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar o arquivo enviado.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
