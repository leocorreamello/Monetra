const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const pdfParse = require('pdf-parse');
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
    const allowedExtensions = ['.pdf', '.csv', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log(`📁 Verificando arquivo: ${file.originalname}`);
    console.log(`🔍 Extensão: ${fileExtension}`);
    
    if (allowedExtensions.includes(fileExtension)) {
      console.log(`✅ Arquivo aceito: ${fileExtension}`);
      cb(null, true);
    } else {
      console.log(`❌ Arquivo rejeitado: ${fileExtension}`);
      cb(new Error(`Tipo de arquivo não suportado. Apenas arquivos PDF, CSV e TXT são aceitos.`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite
  }
});

const db = new sqlite3.Database('./finance.db');

// Função de categorização inteligente
function categorizarTransacao(descricao, valor) {
  const desc = descricao.toLowerCase();
  const isEntrada = valor > 0;
  
  console.log(`🏷️ Categorizando: "${descricao}" (${desc}) - Valor: ${valor}`);
  
  // Regras de categorização baseadas em palavras-chave
  const regras = {
    // Alimentação
    'alimentacao': [
      'ifood', 'uber eats', 'rappi', 'food', 'lanches', 'pizza', 'burger',
      'mcdonalds', 'bk', 'subway', 'restaurante', 'padaria', 'acougue',
      'mercado', 'supermercado', 'hortifruti', 'emporio', 'delicatessen'
    ],
    
    // Transporte
    'transporte': [
      'uber', '99', 'taxi', 'metro', 'onibus', 'combustivel', 'posto',
      'estacionamento', 'pedagio', 'ipva', 'seguro auto', 'oficina',
      'manutencao veicular'
    ],
    
    // Saúde
    'saude': [
      'farmacia', 'drogaria', 'hospital', 'clinica', 'medico', 'dentista',
      'laboratorio', 'exame', 'consulta', 'plano de saude', 'unimed',
      'sulamerica', 'amil', 'gympass', 'academia'
    ],
    
    // Educação
    'educacao': [
      'escola', 'faculdade', 'universidade', 'curso', 'livro', 'material escolar',
      'mensalidade', 'matricula', 'biblioteca'
    ],
    
    // Lazer
    'lazer': [
      'cinema', 'teatro', 'show', 'evento', 'netflix', 'spotify', 'amazon prime',
      'disney', 'streaming', 'jogo', 'viagem', 'hotel', 'turismo'
    ],
    
    // Casa
    'casa': [
      'aluguel', 'iptu', 'condominio', 'energia', 'agua', 'gas', 'internet',
      'telefone', 'tv', 'limpeza', 'manutencao', 'reforma', 'mobilia',
      'eletrodomestico'
    ],
    
    // Transferências
    'transferencia': [
      'pix', 'pix transf', 'ted', 'doc', 'transferencia', 'deposito'
    ],
    
    // Renda (para entradas)
    'renda': [
      'salario', 'ordenado', 'pagamento', 'freelance', 'renda', 'receita'
    ],
    
    // Investimentos
    'investimento': [
      'investimento', 'aplicacao', 'poupanca', 'renda fixa', 'tesouro',
      'cdb', 'lci', 'lca', 'fundo', 'acoes', 'bolsa'
    ],
    
    // Roupas e Acessórios
    'vestuario': [
      'roupa', 'camisa', 'calca', 'sapato', 'tenis', 'loja', 'moda',
      'shopping', 'boutique', 'calcado'
    ]
  };
  
  // Padrões específicos por tipo de transação (primeira prioridade)
  if (desc.includes('pix')) {
    console.log(`✅ PIX detectado → transferencia`);
    return 'transferencia';
  }
  
  if (desc.includes('ted') || desc.includes('doc')) {
    console.log(`✅ TED/DOC detectado → transferencia`);
    return 'transferencia';
  }
  
  if (desc.includes('saque') || desc.includes('atm')) {
    console.log(`✅ Saque detectado → saque`);
    return 'saque';
  }
  
  if (desc.includes('taxa') || desc.includes('tarifa') || desc.includes('anuidade')) {
    console.log(`✅ Taxa detectada → taxas`);
    return 'taxas';
  }
  
  // Para entradas, prioriza categorias de renda
  if (isEntrada) {
    for (const [categoria, palavras] of Object.entries(regras)) {
      if (categoria === 'renda' || categoria === 'investimento') {
        for (const palavra of palavras) {
          if (desc.includes(palavra)) {
            console.log(`✅ Entrada: ${palavra} → ${categoria}`);
            return categoria;
          }
        }
      }
    }
    console.log(`✅ Entrada padrão → renda`);
    return 'renda'; // Padrão para entradas
  }
  
  // Para saídas, verifica todas as categorias
  for (const [categoria, palavras] of Object.entries(regras)) {
    for (const palavra of palavras) {
      if (desc.includes(palavra)) {
        console.log(`✅ Palavra-chave: ${palavra} → ${categoria}`);
        return categoria;
      }
    }
  }
  
  // Categoria padrão
  console.log(`❓ Não identificado → outros`);
  return 'outros';
}

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS transacoes (id INTEGER PRIMARY KEY, data TEXT, descricao TEXT, valor REAL, tipo TEXT, categoria TEXT, mes TEXT, ano TEXT)");
  db.run("ALTER TABLE transacoes ADD COLUMN ano TEXT", (err) => {
    if (err && err.message.includes('duplicate column name')) {
      console.log('Coluna "ano" já existe, ignorando...');
    } else if (err) {
      console.error('Erro ao adicionar coluna "ano":', err);
    }
  });
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
      // Adiciona o dia único ao conjunto
      diasUnicos.add(transacao.data);
      
      // Também mantém controle da data mínima e máxima para estatísticas
      const [dia, mes, ano] = transacao.data.split('/');
      const dataAtual = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      
      if (!dataMinima || dataAtual < dataMinima) {
        dataMinima = dataAtual;
      }
      
      if (!dataMaxima || dataAtual > dataMaxima) {
        dataMaxima = dataAtual;
      }
    }
  });
  
  // Converte de volta para formato DD/MM/AAAA
  const formatarData = (date) => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };
  
  // Converte Set para Array ordenado
  const diasOrdenados = Array.from(diasUnicos).sort((a, b) => {
    const [diaA, mesA, anoA] = a.split('/');
    const [diaB, mesB, anoB] = b.split('/');
    const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1, parseInt(diaA));
    const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1, parseInt(diaB));
    return dateA - dateB;
  });
  
  return {
    diasUnicos: diasOrdenados,
    dataInicio: formatarData(dataMinima),
    dataFim: formatarData(dataMaxima),
    totalDiasUnicos: diasOrdenados.length,
    totalDiasIntervalo: Math.ceil((dataMaxima - dataMinima) / (1000 * 60 * 60 * 24)) + 1
  };
}

// Função para remover transações existentes de dias específicos
function removerTransacoesDias(diasEspecificos) {
  return new Promise((resolve, reject) => {
    if (!diasEspecificos || diasEspecificos.length === 0) {
      console.log(`ℹ️ Nenhum dia específico fornecido para remoção`);
      resolve(0);
      return;
    }
    
    console.log(`🗑️ Removendo transações existentes dos dias: ${diasEspecificos.join(', ')}`);
    
    // Busca todas as transações para filtrar por dias específicos
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
      db.run(
        `DELETE FROM transacoes WHERE id IN (${placeholders})`,
        idsParaRemover,
        function(err) {
          if (err) {
            console.error('❌ Erro ao remover transações dos dias especificados:', err);
            reject(err);
          } else {
            console.log(`✅ ${this.changes} transações removidas dos dias: ${diasEspecificos.join(', ')}`);
            resolve(this.changes);
          }
        }
      );
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
    if (fileExtension === '.pdf') {
      console.log('📄 Processando como PDF...');
      
      // Código existente do PDF permanece inalterado
      const dataBuffer = fs.readFileSync(filePath);

      const data = await pdfParse(dataBuffer);
      const text = data.text;
      console.log('Conteúdo do PDF (seção lançamentos):');

      const startIndex = text.indexOf('datalançamentosvalor (R$)saldo (R$)');
      if (startIndex === -1) {
        return res.status(400).json({ error: 'Seção de lançamentos não encontrada' });
      }

      const relevantText = text.substring(startIndex);
      const linhas = relevantText.split('\n').filter(line => line.trim());
      
      const transacoes = []; // Array para coletar todas as transações antes de salvar

      // Processa as linhas com look-ahead para casos de valor em linha separada
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        
        if (linha !== 'datalançamentosvalor (R$)saldo (R$)' && linha.trim().length > 0) {
          console.log(`\n🔍 Processando: "${linha}"`);
          
          const dataMatch = linha.match(/^(\d{2}\/\d{2}\/\d{4})/);
          if (!dataMatch) {
            console.log(`❌ Sem data válida`);
            continue;
          }
          
          const data = dataMatch[1];
          let resto = linha.substring(10); // Remove data
          
          // Ignora saldos e resumos
          if (resto.includes('SALDO') || resto.includes('TOTAL DISPONÃVEL') || resto.includes('ANTERIOR')) {
            console.log(`⚠️ Ignorado: linha de saldo`);
            continue;
          }
          
          console.log(`📝 Analisando: "${resto}"`);
          
          // CORREÇÃO FINAL: O problema é que alguns valores estão grudados na descrição
          // Exemplos reais:
          // "PIX TRANSF FATIMA 08/08450,00" → deve ser "PIX TRANSF FATIMA 08/08" + "450,00"
          // "PIX TRANSF JOAO SI15/0834,34" → deve ser "PIX TRANSF JOAO SI15/08" + "34,34"
          
          // Estratégia: encontrar onde termina uma data dentro da descrição e começa o valor
          
          // Procura padrões incluindo valores com separador de milhares (ex: 1.628,17)
          let match = null;
          
          console.log(`🔍 Tentando fazer match em: "${resto}"`);
          
          // Primeiro tenta: descrição + espaço + valor com separador de milhares
          // Padrão mais específico para capturar valores como 1.628,17 ou 628,17
          match = resto.match(/^(.+?)\s+(-?(?:\d{1,3}(?:\.\d{3})*),\d{2})$/);
          
          if (!match) {
            console.log(`❌ Primeiro padrão não funcionou, tentando detectar casos específicos`);
            
            // Caso específico: SALARIO/REMUNERACAO com valor grudado (ex: SALARIO1.628,17)
            // Só aplica para descrições que terminam com palavra + dígito sem barra
            match = resto.match(/^(.+?[A-Z])(\d)\.(\d{3},\d{2})$/);
            if (match) {
              const descricao = match[1];
              const milhar = match[2];
              const resto_valor = match[3];
              const valorCompleto = milhar + '.' + resto_valor;
              
              console.log(`✅ Detectado caso específico SALARIO/REMUNERACAO:`);
              console.log(`   Texto original: "${resto}"`);
              console.log(`   Descrição: "${descricao}"`);
              console.log(`   Valor: "${valorCompleto}"`);
              
              match = [resto, descricao, '', valorCompleto];
            }
          }
          
          if (!match) {
            console.log(`❌ Caso específico não funcionou, tentando padrão PIX melhorado`);
            
            // Padrão específico para PIX: NOME XX/XX + valor grudado
            // Ex: "PIX TRANSF LUIGI P15/0834,34" → "PIX TRANSF LUIGI P15/08" + "34,34"
            match = resto.match(/^(.+?)(\d{2}\/\d{2})(\d+,\d{2})$/);
            if (match) {
              const descricaoBase = match[1];
              const data = match[2];
              const valorBruto = match[3];
              
              console.log(`🔍 PIX detectado: "${descricaoBase}" + "${data}" + "${valorBruto}"`);
              
              // Para valores com 3+ dígitos, geralmente os primeiros dígitos fazem parte da data
              if (valorBruto.match(/^\d{3,4},\d{2}$/)) {
                // Para 0834,34 → pega últimos 2 dígitos: 34,34
                // Para 08340,00 → pega últimos 2 dígitos: 40,00 (mas isso pode estar errado)
                
                // Estratégia: se começa com 08, provavelmente é parte da data
                if (valorBruto.startsWith('08')) {
                  const valorCorrigido = valorBruto.substring(2); // Remove os primeiros 2 dígitos
                  const descricaoCompleta = descricaoBase + data;
                  
                  console.log(`✅ Corrigindo PIX com data grudada no valor:`);
                  console.log(`   Descrição final: "${descricaoCompleta}"`);
                  console.log(`   Valor original: "${valorBruto}"`);
                  console.log(`   Valor corrigido: "${valorCorrigido}"`);
                  
                  match = [resto, descricaoCompleta, '', valorCorrigido];
                } else {
                  // Valor parece estar correto
                  const descricaoCompleta = descricaoBase + data;
                  console.log(`✅ PIX com valor normal: "${descricaoCompleta}" + "${valorBruto}"`);
                  match = [resto, descricaoCompleta, '', valorBruto];
                }
              } else {
                // Valor tem 1-2 dígitos, provavelmente correto
                const descricaoCompleta = descricaoBase + data;
                console.log(`✅ PIX valor pequeno: "${descricaoCompleta}" + "${valorBruto}"`);
                match = [resto, descricaoCompleta, '', valorBruto];
              }
            }
          }
          
          if (!match) {
            console.log(`❌ Padrão PIX não funcionou, tentando valor grudado simples`);
            // Último recurso: valor grudado simples
            match = resto.match(/^(.+?)(\d+,\d{2})$/);
            if (match) {
              console.log(`✅ Padrão simples encontrado: "${match[1]}" + "${match[2]}"`);
              match = [resto, match[1], '', match[2]];
            }
          }
          
          if (!match) {
            console.log(`❌ Segundo padrão não funcionou`);
            // Terceiro tenta: descrição + data (XX/XX) + valor grudado
            match = resto.match(/^(.+?)(\d{2}\/\d{2})(\d(?:\.\d{3})*,\d{2})$/);
            if (match) {
              console.log(`✅ Terceiro padrão funcionou - data + valor grudado`);
              const descricao = match[1] + match[2];
              const valorStr = match[3];
              match = [resto, descricao, '', valorStr];
            }
          }
          
          if (!match) {
            console.log(`❌ Terceiro padrão não funcionou`);
            // Quarto tenta: padrão original para valores simples sem separador de milhares
            match = resto.match(/^(.+?)\s+(-?\d+,\d{2})$/);
            if (match) {
              console.log(`✅ Padrão simples funcionou`);
            }
          }
          
          if (!match) {
            console.log(`❌ Não conseguiu separar descrição e valor na mesma linha`);
            
            // Verifica se a próxima linha contém apenas um valor
            if (i + 1 < linhas.length) {
              const proximaLinha = linhas[i + 1].trim();
              console.log(`🔍 Verificando próxima linha: "${proximaLinha}"`);
              
              // Verifica se a próxima linha é apenas um valor monetário
              if (proximaLinha.match(/^-?\d+,\d{2}$/)) {
                console.log(`✅ Valor encontrado na próxima linha!`);
                match = [resto, resto, '', proximaLinha];
                i++; // Pula a próxima linha pois já foi processada
              } else {
                console.log(`❌ Próxima linha não é um valor válido`);
                continue;
              }
            } else {
              console.log(`❌ Não há próxima linha para verificar`);
              continue;
            }
          }
          
          const descricao = match[1].trim();
          const valorStr = match[3] || match[2]; // Dependendo do match usado
          
          console.log(`🎯 PARSING:`);
          console.log(`   Descrição: "${descricao}"`);
          console.log(`   Valor: "${valorStr}"`);
          
          // Determina se é entrada ou saída
          const isSaida = valorStr.startsWith('-') || descricao.includes('-');
          
          // Limpa a descrição removendo possíveis sinais de menos extras
          const descricaoLimpa = descricao.replace(/^-+/, '').trim();

          // Converte valor para número (remove separador de milhares e troca vírgula por ponto)
          const valorLimpo = valorStr.replace('-', '').replace(/\./g, '').replace(',', '.');
          const valorNumerico = parseFloat(valorLimpo);
          const valorFinal = isSaida ? -valorNumerico : valorNumerico;
          const tipo = valorFinal < 0 ? 'saida' : 'entrada';
          
          const [dia, mes, ano] = data.split('/');

          // Categorização automática
          const categoria = categorizarTransacao(descricaoLimpa, valorFinal);

          console.log(`💰 Valor final: ${valorFinal} (${tipo})`);
          console.log(`🏷️ Categoria: ${categoria}`);

          // Adiciona transação ao array em vez de inserir diretamente
          transacoes.push({
            data,
            descricao: descricaoLimpa,
            valor: valorFinal,
            tipo,
            categoria,
            mes,
            ano
          });
        }
      }

      console.log(`📊 PDF processado: ${transacoes.length} transações encontradas`);

      // Detecta os dias únicos das transações do extrato
      const diasInfo = detectarDiasExtrato(transacoes);
      
      if (diasInfo) {
        console.log(`📅 Dias detectados: ${diasInfo.totalDiasUnicos} dias únicos`);
        console.log(`📅 Intervalo: ${diasInfo.dataInicio} até ${diasInfo.dataFim}`);
        console.log(`📅 Dias: ${diasInfo.diasUnicos.join(', ')}`);
        
        // Remove transações existentes apenas dos dias específicos
        const transacoesRemovidas = await removerTransacoesDias(diasInfo.diasUnicos);
        console.log(`🗑️ ${transacoesRemovidas} transações antigas removidas dos dias especificados`);
      }

      // Salva as novas transações
      const transacoesSalvas = await salvarTransacoes(transacoes);
      
      res.json({ 
        message: `Arquivo PDF processado com sucesso! ${transacoesSalvas} transações salvas.`,
        tipo: 'pdf',
        totalTransacoes: transacoesSalvas,
        diasProcessados: diasInfo ? diasInfo.diasUnicos : [],
        intervaloDias: diasInfo ? `${diasInfo.dataInicio} - ${diasInfo.dataFim}` : null
      });
      
    } else if (fileExtension === '.csv') {
      console.log('📊 Processando como CSV...');
      
      const transacoes = await processarCSV(filePath);
      
      // Detecta os dias únicos das transações do extrato
      const diasInfo = detectarDiasExtrato(transacoes);
      
      if (diasInfo) {
        console.log(`📅 Dias detectados: ${diasInfo.totalDiasUnicos} dias únicos`);
        console.log(`📅 Intervalo: ${diasInfo.dataInicio} até ${diasInfo.dataFim}`);
        console.log(`📅 Dias: ${diasInfo.diasUnicos.join(', ')}`);
        
        // Remove transações existentes apenas dos dias específicos
        const transacoesRemovidas = await removerTransacoesDias(diasInfo.diasUnicos);
        console.log(`🗑️ ${transacoesRemovidas} transações antigas removidas dos dias especificados`);
      }
      
      // Salva as novas transações
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
        error: `Tipo de arquivo não suportado: ${fileExtension}. Apenas PDF, CSV e TXT são aceitos.` 
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
  db.all("SELECT * FROM transacoes", [], (err, rows) => {
    if (err) {
      console.error('Erro ao consultar transações:', err);
      return res.status(500).send('Erro ao consultar transações');
    }
    
    // Ordena as transações por data (DD/MM/AAAA) corretamente
    const sortedRows = rows.sort((a, b) => {
      // Converte DD/MM/AAAA para AAAA-MM-DD para comparação
      const dateA = a.data.split('/').reverse().join('-');
      const dateB = b.data.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });
    
    res.json(sortedRows);
  });
});

// Endpoint para atualizar categoria de uma transação
app.put('/transactions/:id/categoria', (req, res) => {
  const { id } = req.params;
  const { categoria } = req.body;
  
  if (!categoria) {
    return res.status(400).json({ error: 'Categoria é obrigatória' });
  }
  
  db.run(
    "UPDATE transacoes SET categoria = ? WHERE id = ?",
    [categoria, id],
    function(err) {
      if (err) {
        console.error('Erro ao atualizar categoria:', err);
        return res.status(500).json({ error: 'Erro ao atualizar categoria' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      
      res.json({ message: 'Categoria atualizada com sucesso' });
    }
  );
});

// Endpoint para obter lista de categorias disponíveis
app.get('/categorias', (req, res) => {
  const categorias = [
    'alimentacao',
    'transporte', 
    'saude',
    'educacao',
    'lazer',
    'casa',
    'transferencia',
    'renda',
    'investimento',
    'vestuario',
    'saque',
    'taxas',
    'outros'
  ];
  
  res.json(categorias);
});

app.listen(port, () => {
  console.log(`Servidor na porta ${port}`);
});

// Novo endpoint para excluir transações por mês e ano
app.delete('/transactions', (req, res) => {
  const { mes, ano } = req.query;
  if (!mes || !ano) {
    return res.status(400).json({ error: 'Mes e ano são obrigatórios para exclusão' }); // JSON para erro
  }

  db.run(
    "DELETE FROM transacoes WHERE mes = ? AND ano = ?",
    [mes, ano],
    (err) => {
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