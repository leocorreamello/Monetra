require('dotenv').config();
const path = require('path');
const { connectDatabase } = require('./src/database');
const { requireAuth } = require('./src/auth-helper');
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

const handler = async (req, res) => {
  // Configurar headers CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Conectar ao banco de dados
    await connectDatabase();

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
      await removerTransacoesDias(diasInfo.diasUnicos, req.user.id);
    }

    // Salvar transações
    const totalSalvas = await salvarTransacoes(transacoes, req.user.id);

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

// Exportar com autenticação obrigatória
module.exports = requireAuth(handler);
