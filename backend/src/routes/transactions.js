const express = require('express');
const multer = require('multer');
const path = require('path');
const Transaction = require('../../models/Transaction');
const { authMiddleware } = require('../../middleware/auth');
const {
  detectarDiasExtrato,
  listarCategorias,
  listarTransacoes,
  parseCsvContent,
  parseTxtContent,
  removerPorMes,
  removerTransacoesDias,
  removerTudo,
  salvarTransacoes
} = require('../services/transactions');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.csv', '.txt'];
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Apenas CSV e TXT são aceitos.'));
    }
  }
});

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const extension = path.extname(req.file.originalname).toLowerCase();

  try {
    let transacoes;
    let tipoArquivo;

    if (extension === '.csv') {
      transacoes = parseCsvContent(req.file.buffer);
      tipoArquivo = 'csv';
    } else if (extension === '.txt') {
      transacoes = parseTxtContent(req.file.buffer);
      tipoArquivo = 'txt';
    } else {
      return res.status(400).json({ error: `Tipo de arquivo não suportado: ${extension}` });
    }

    const diasInfo = detectarDiasExtrato(transacoes);

    if (diasInfo?.diasUnicos?.length) {
      await removerTransacoesDias(diasInfo.diasUnicos, req.user.id);
    }

    const totalSalvas = await salvarTransacoes(transacoes, req.user.id);

    return res.json({
      message: `Arquivo ${tipoArquivo.toUpperCase()} processado com sucesso! ${totalSalvas} transações salvas.`,
      tipo: tipoArquivo,
      totalTransacoes: totalSalvas,
      diasProcessados: diasInfo ? diasInfo.diasUnicos : [],
      intervaloDias: diasInfo ? `${diasInfo.dataInicio} - ${diasInfo.dataFim}` : null
    });
  } catch (error) {
    console.error('[transactions] upload error', error);
    return res.status(500).json({
      error: 'Erro ao processar o arquivo enviado.',
      details: error.message
    });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transacoes = await listarTransacoes(req.user.id);
    return res.json(transacoes);
  } catch (error) {
    console.error('[transactions] list error', error);
    return res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
});

router.get('/categorias', authMiddleware, async (req, res) => {
  try {
    const categorias = await listarCategorias(req.user.id);
    return res.json(categorias);
  } catch (error) {
    console.error('[transactions] categories error', error);
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

router.put('/transactions/:id/categoria', authMiddleware, async (req, res) => {
  const { categoria } = req.body;

  if (!categoria) {
    return res.status(400).json({ error: 'Categoria é obrigatória.' });
  }

  try {
    const { id } = req.params;
    const resultado = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { categoria },
      { new: true }
    ).lean();

    if (!resultado) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.json({ message: 'Categoria atualizada com sucesso.' });
  } catch (error) {
    console.error('[transactions] update category error', error);
    return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
});

router.delete('/transactions', authMiddleware, async (req, res) => {
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    return res.status(400).json({ error: 'Mes e ano são obrigatórios.' });
  }

  try {
    const removidas = await removerPorMes(req.user.id, mes, ano);

    if (removidas === 0) {
      return res.status(404).json({ error: 'Nenhuma transação encontrada para o período informado.' });
    }

    return res.json({ message: 'Transações excluídas com sucesso.', removidas });
  } catch (error) {
    console.error('[transactions] month delete error', error);
    return res.status(500).json({ error: 'Erro ao excluir transações.' });
  }
});

router.delete('/transactions/all', authMiddleware, async (req, res) => {
  try {
    const removidas = await removerTudo(req.user.id);

    if (removidas === 0) {
      return res.json({ message: 'Nenhuma transação encontrada para remover.', removidas });
    }

    return res.json({ message: 'Transações removidas com sucesso.', removidas });
  } catch (error) {
    console.error('[transactions] delete all error', error);
    return res.status(500).json({ error: 'Erro ao limpar transações.' });
  }
});

module.exports = router;
