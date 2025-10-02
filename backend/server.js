const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

// Configuração do multer com filtro de arquivos
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log(`📁 Verificando arquivo: ${file.originalname}`);
    console.log(`🔍 Extensão: ${fileExtension}`);
    
    if (allowedExtensions.includes(fileExtension)) {
      console.log(`✅ Arquivo aceito: ${fileExtension}`);
      cb(null, true);
    } else {
      console.log(`❌ Arquivo rejeitado: ${fileExtension}`);
      cb(new Error(`Tipo de arquivo não suportado. Apenas arquivos CSV e TXT são aceitos.`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite
  }
});

const db = new sqlite3.Database('./finance.db');

// Função de categorização inteligente
function categorizarTransacao(descricao, valor) {
  const descricaoLower = descricao.toLowerCase();
  
  // Renda e salários
  if (descricaoLower.includes('salario') || 
      descricaoLower.includes('remuneracao') || 
      descricaoLower.includes('deposito') && valor > 0) {
    return 'renda';
  }
  
  // Alimentação
  if (descricaoLower.includes('mercado') || 
      descricaoLower.includes('supermercado') ||
      descricaoLower.includes('padaria') ||
      descricaoLower.includes('restaurante') ||
      descricaoLower.includes('lanchonete') ||
      descricaoLower.includes('food') ||
      descricaoLower.includes('ifood') ||
      descricaoLower.includes('delivery')) {
    return 'alimentacao';
  }
  
  // Transporte
  if (descricaoLower.includes('uber') || 
      descricaoLower.includes('99') ||
      descricaoLower.includes('posto') ||
      descricaoLower.includes('combustivel') ||
      descricaoLower.includes('gasolina') ||
      descricaoLower.includes('metro') ||
      descricaoLower.includes('onibus')) {
    return 'transporte';
  }
  
  // Saúde
  if (descricaoLower.includes('farmacia') || 
      descricaoLower.includes('medico') ||
      descricaoLower.includes('hospital') ||
      descricaoLower.includes('clinica') ||
      descricaoLower.includes('laboratorio')) {
    return 'saude';
  }
  
  // Educação
  if (descricaoLower.includes('escola') || 
      descricaoLower.includes('faculdade') ||
      descricaoLower.includes('universidade') ||
      descricaoLower.includes('curso') ||
      descricaoLower.includes('livro')) {
    return 'educacao';
  }
  
  // Lazer
  if (descricaoLower.includes('cinema') || 
      descricaoLower.includes('jogo') ||
      descricaoLower.includes('netflix') ||
      descricaoLower.includes('spotify') ||
      descricaoLower.includes('amazon prime') ||
      descricaoLower.includes('gaming') ||
      descricaoLower.includes('interactive')) {
    return 'lazer';
  }
  
  // Casa e moradia
  if (descricaoLower.includes('aluguel') || 
      descricaoLower.includes('condominio') ||
      descricaoLower.includes('energia') ||
      descricaoLower.includes('agua') ||
      descricaoLower.includes('gas') ||
      descricaoLower.includes('internet')) {
    return 'casa';
  }
  
  // Transferências e PIX
  if (descricaoLower.includes('pix') || 
      descricaoLower.includes('transfer') ||
      descricaoLower.includes('ted') ||
      descricaoLower.includes('doc')) {
    return 'transferencia';
  }
  
  // Investimentos
  if (descricaoLower.includes('aplicacao') || 
      descricaoLower.includes('investimento') ||
      descricaoLower.includes('poupanca') ||
      descricaoLower.includes('rend pago')) {
    return 'investimento';
  }
  
  // Vestuário
  if (descricaoLower.includes('roupa') || 
      descricaoLower.includes('calcado') ||
      descricaoLower.includes('moda') ||
      descricaoLower.includes('loja')) {
    return 'vestuario';
  }
  
  // Saque
  if (descricaoLower.includes('saque') || 
      descricaoLower.includes('caixa eletronico')) {
    return 'saque';
  }
  
  // Taxas e tarifas
  if (descricaoLower.includes('tarifa') || 
      descricaoLower.includes('taxa') ||
      descricaoLower.includes('anuidade') ||
      descricaoLower.includes('juros')) {
    return 'taxas';
  }
  
  return 'outros';
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    descricao TEXT,
    valor REAL,
    tipo TEXT,
    categoria TEXT,
    mes TEXT,
    ano TEXT
  )`);
});

// Função para processar arquivo CSV
function processarCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const linhas = data.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
      
      console.log('📄 Processando arquivo CSV...');
      console.log(`📊 Total de linhas: ${linhas.length}`);
      
      // Encontra onde começam os dados das transações
      let inicioTransacoes = -1;
      for (let i = 0; i < linhas.length; i++) {
        if (linhas[i].includes('Data Lançamento;Histórico;Descrição;Valor;Saldo')) {
          inicioTransacoes = i + 1;
          console.log(`✅ Cabeçalho encontrado na linha ${i}`);
          break;
        }
      }
      
      if (inicioTransacoes === -1) {
        throw new Error('Cabeçalho das transações não encontrado no CSV');
      }
      
      const transacoes = [];
      
      // Processa cada linha de transação
      for (let i = inicioTransacoes; i < linhas.length; i++) {
        const linha = linhas[i];
        
        // Ignora linhas vazias ou que não parecem ser transações
        if (!linha || linha.length < 10) continue;
        
        // Divide a linha pelos pontos e vírgulas
        const campos = linha.split(';');
        
        if (campos.length < 4) {
          console.log(`⚠️ Linha ignorada (poucos campos): ${linha}`);
          continue;
        }
        
        const data = campos[0];
        const historico = campos[1];
        const descricao = campos[2];
        const valorStr = campos[3];
        
        // Valida se a data está no formato correto
        if (!data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          console.log(`⚠️ Data inválida ignorada: ${data}`);
          continue;
        }
        
        // Processa o valor
        if (!valorStr) {
          console.log(`⚠️ Valor vazio ignorado na linha: ${linha}`);
          continue;
        }
        
        // Remove possíveis espaços e converte o valor
        const valorLimpo = valorStr.trim().replace(',', '.');
        const valorNumerico = parseFloat(valorLimpo);
        
        if (isNaN(valorNumerico)) {
          console.log(`⚠️ Valor não numérico ignorado: ${valorStr}`);
          continue;
        }
        
        // Cria descrição completa combinando histórico e descrição
        const descricaoCompleta = `${historico} ${descricao}`.trim();
        
        const tipo = valorNumerico < 0 ? 'saida' : 'entrada';
        const [dia, mes, ano] = data.split('/');
        
        // Categorização automática
        const categoria = categorizarTransacao(descricaoCompleta, valorNumerico);
        
        console.log(`💰 CSV: ${data} | "${descricaoCompleta}" | ${valorNumerico} | ${tipo} | ${categoria}`);
        
        transacoes.push({
          data,
          descricao: descricaoCompleta,
          valor: valorNumerico,
          tipo,
          categoria,
          mes,
          ano
        });
      }
      
      console.log(`✅ CSV processado: ${transacoes.length} transações encontradas`);
      resolve(transacoes);
      
    } catch (error) {
      console.error('❌ Erro ao processar CSV:', error);
      reject(error);
    }
  });
}

// Função para processar arquivo TXT
function processarTXT(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const linhas = data.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
      
      console.log('📄 Processando arquivo TXT...');
      console.log(`📊 Total de linhas: ${linhas.length}`);
      
      const transacoes = [];
      
      // Processa cada linha do TXT
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        
        // Ignora linhas vazias ou muito curtas
        if (!linha || linha.length < 10) continue;
        
        // Divide a linha pelos pontos e vírgulas
        const campos = linha.split(';');
        
        if (campos.length < 3) {
          console.log(`⚠️ Linha ignorada (poucos campos): ${linha}`);
          continue;
        }
        
        const data = campos[0];
        const descricao = campos[1];
        const valorStr = campos[2];
        
        // Valida se a data está no formato correto (DD/MM/AAAA)
        if (!data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          console.log(`⚠️ Data inválida ignorada: ${data}`);
          continue;
        }
        
        // Processa o valor
        if (!valorStr) {
          console.log(`⚠️ Valor vazio ignorado na linha: ${linha}`);
          continue;
        }
        
        // Remove possíveis espaços e converte o valor
        const valorLimpo = valorStr.trim().replace(',', '.');
        const valorNumerico = parseFloat(valorLimpo);
        
        if (isNaN(valorNumerico)) {
          console.log(`⚠️ Valor não numérico ignorado: ${valorStr}`);
          continue;
        }
        
        const tipo = valorNumerico < 0 ? 'saida' : 'entrada';
        const [dia, mes, ano] = data.split('/');
        
        // Categorização automática
        const categoria = categorizarTransacao(descricao, valorNumerico);
        
        console.log(`💰 TXT: ${data} | "${descricao}" | ${valorNumerico} | ${tipo} | ${categoria}`);
        
        transacoes.push({
          data,
          descricao: descricao.trim(),
          valor: valorNumerico,
          tipo,
          categoria,
          mes,
          ano
        });
      }
      
      console.log(`✅ TXT processado: ${transacoes.length} transações encontradas`);
      resolve(transacoes);
      
    } catch (error) {
      console.error('❌ Erro ao processar TXT:', error);
      reject(error);
    }
  });
}

// Função para detectar dias únicos presentes em um conjunto de transações
function detectarDiasExtrato(transacoes) {
  if (!transacoes || transacoes.length === 0) {
    return null;
  }
  
  const diasUnicos = new Set();
  let dataMinima = null;
  let dataMaxima = null;
  
  transacoes.forEach(transacao => {
    if (transacao.data) {
      diasUnicos.add(transacao.data);
      
      // Converte para objeto Date para comparação
      const [dia, mes, ano] = transacao.data.split('/');
      const dataObj = new Date(ano, mes - 1, dia);
      
      if (!dataMinima || dataObj < dataMinima) {
        dataMinima = dataObj;
      }
      if (!dataMaxima || dataObj > dataMaxima) {
        dataMaxima = dataObj;
      }
    }
  });
  
  const formatarData = (data) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };
  
  return {
    diasUnicos: Array.from(diasUnicos).sort(),
    dataInicio: dataMinima ? formatarData(dataMinima) : null,
    dataFim: dataMaxima ? formatarData(dataMaxima) : null
  };
}

// Função para remover transações de dias específicos
function removerTransacoesDias(diasEspecificos) {
  return new Promise((resolve, reject) => {
    if (!diasEspecificos || diasEspecificos.length === 0) {
      resolve(0);
      return;
    }

    // Busca todas as transações existentes
    db.all("SELECT id, data FROM transacoes", [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar transações existentes:', err);
        reject(err);
        return;
      }
      
      // Filtra transações que estão nos dias específicos
      const idsParaRemover = rows.filter(row => {
        return diasEspecificos.includes(row.data);
      }).map(row => row.id);
      
      if (idsParaRemover.length === 0) {
        console.log(`ℹ️ Nenhuma transação encontrada nos dias especificados para remoção`);
        resolve(0);
        return;
      }
      
      console.log(`🗑️ Encontradas ${idsParaRemover.length} transações para remover nos dias especificados`);
      
      // Remove as transações encontradas
      const placeholders = idsParaRemover.map(() => '?').join(',');
      db.run(`DELETE FROM transacoes WHERE id IN (${placeholders})`, idsParaRemover, function(err) {
        if (err) {
          console.error('❌ Erro ao remover transações:', err);
          reject(err);
        } else {
          console.log(`✅ ${this.changes} transações removidas com sucesso`);
          resolve(this.changes);
        }
      });
    });
  });
}

// Função para salvar transações no banco
function salvarTransacoes(transacoes) {
  return new Promise((resolve, reject) => {
    let processadas = 0;
    let erros = 0;
    
    transacoes.forEach((transacao) => {
      db.run(
        "INSERT INTO transacoes (data, descricao, valor, tipo, categoria, mes, ano) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [transacao.data, transacao.descricao, transacao.valor, transacao.tipo, transacao.categoria, transacao.mes, transacao.ano],
        (err) => {
          if (err) {
            console.error('❌ Erro ao inserir transação:', err);
            erros++;
          } else {
            processadas++;
          }
          
          // Verifica se todas as transações foram processadas
          if (processadas + erros === transacoes.length) {
            if (erros > 0) {
              reject(new Error(`${erros} transações falharam ao ser inseridas`));
            } else {
              resolve(processadas);
            }
          }
        }
      );
    });
  });
}

app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const uploadedFile = req.file;
  const fileExtension = path.extname(uploadedFile.originalname).toLowerCase();
  const filePath = `./uploads/${uploadedFile.originalname}`;
  
  console.log(`📁 Arquivo recebido: ${uploadedFile.originalname}`);
  console.log(`🔍 Extensão detectada: ${fileExtension}`);

  try {
    if (fileExtension === '.csv') {
      console.log('📊 Processando como CSV...');
      
      const transacoes = await processarCSV(filePath);
      
      // Detecta os dias únicos do extrato
      const diasInfo = detectarDiasExtrato(transacoes);
      
      if (diasInfo && diasInfo.diasUnicos.length > 0) {
        console.log(`🗓️ Dias detectados no extrato CSV: ${diasInfo.diasUnicos.join(', ')}`);
        console.log(`📅 Intervalo: ${diasInfo.dataInicio} até ${diasInfo.dataFim}`);
        
        // Remove transações existentes desses dias específicos
        await removerTransacoesDias(diasInfo.diasUnicos);
      }
      
      const transacoesSalvas = await salvarTransacoes(transacoes);
      
      res.json({ 
        message: `Arquivo CSV processado com sucesso! ${transacoesSalvas} transações salvas.`,
        tipo: 'csv',
        totalTransacoes: transacoesSalvas,
        diasProcessados: diasInfo ? diasInfo.diasUnicos : [],
        intervaloDias: diasInfo ? `${diasInfo.dataInicio} - ${diasInfo.dataFim}` : null
      });
      
    } else if (fileExtension === '.txt') {
      console.log('📄 Processando como TXT...');
      
      const transacoes = await processarTXT(filePath);
      
      // Detecta os dias únicos do extrato
      const diasInfo = detectarDiasExtrato(transacoes);
      
      if (diasInfo && diasInfo.diasUnicos.length > 0) {
        console.log(`🗓️ Dias detectados no extrato TXT: ${diasInfo.diasUnicos.join(', ')}`);
        console.log(`📅 Intervalo: ${diasInfo.dataInicio} até ${diasInfo.dataFim}`);
        
        // Remove transações existentes desses dias específicos
        await removerTransacoesDias(diasInfo.diasUnicos);
      }
      
      const transacoesSalvas = await salvarTransacoes(transacoes);
      
      res.json({ 
        message: `Arquivo TXT processado com sucesso! ${transacoesSalvas} transações salvas.`,
        tipo: 'txt',
        totalTransacoes: transacoesSalvas,
        diasProcessados: diasInfo ? diasInfo.diasUnicos : [],
        intervaloDias: diasInfo ? `${diasInfo.dataInicio} - ${diasInfo.dataFim}` : null
      });
      
    } else {
      return res.status(400).json({ 
        error: `Tipo de arquivo não suportado: ${fileExtension}. Apenas CSV e TXT são aceitos.` 
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo:', error);
    res.status(500).json({ 
      error: 'Erro ao processar o arquivo',
      details: error.message 
    });
  }
});

// Novo endpoint para consultar transações
app.get('/transactions', (req, res) => {
  db.all("SELECT * FROM transacoes ORDER BY data DESC, id DESC", [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar transações:', err);
      return res.status(500).json({ error: 'Erro ao buscar transações' });
    }
    res.json(rows);
  });
});

// Endpoint para obter categorias únicas
app.get('/categorias', (req, res) => {
  db.all("SELECT DISTINCT categoria FROM transacoes ORDER BY categoria", [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar categorias:', err);
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
    const categorias = rows.map(row => row.categoria);
    res.json(categorias);
  });
});

// Endpoint para atualizar categoria de uma transação
app.put('/transactions/:id/categoria', (req, res) => {
  const { id } = req.params;
  const { categoria } = req.body;

  db.run(
    "UPDATE transacoes SET categoria = ? WHERE id = ?",
    [categoria, id],
    function(err) {
      if (err) {
        console.error('Erro ao atualizar categoria:', err);
        return res.status(500).json({ error: 'Erro ao atualizar categoria' });
      }
      res.json({ message: 'Categoria atualizada com sucesso' });
    }
  );
});

// Endpoint para excluir transações por mês e ano
app.delete('/transactions', (req, res) => {
  const { mes, ano } = req.query;
  
  if (!mes || !ano) {
    return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
  }

  db.run(
    "DELETE FROM transacoes WHERE mes = ? AND ano = ?",
    [mes, ano],
    function(err) {
      if (err) {
        console.error('Erro ao excluir transações:', err);
        return res.status(500).json({ error: 'Erro ao excluir transações' }); // JSON para erro
      }
      res.json({ message: 'Transações excluídas com sucesso' }); // JSON para sucesso
    }
  );
});

// Endpoint para limpar todas as transações (útil para testes)
app.delete('/transactions/all', (req, res) => {
  db.run("DELETE FROM transacoes", [], (err) => {
    if (err) {
      console.error('Erro ao limpar todas as transações:', err);
      return res.status(500).json({ error: 'Erro ao limpar transações' });
    }
    res.json({ message: 'Todas as transações foram removidas' });
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log('📊 Sistema de gestão financeira ativo');
  console.log('💾 Banco de dados SQLite conectado');
});