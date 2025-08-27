const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
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
const upload = multer({ storage: storage });

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

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado');
  }

  const pdfFile = req.file;
  console.log('Arquivo recebido:', pdfFile.originalname);

  const pdfPath = `./uploads/${pdfFile.originalname}`;
  const dataBuffer = fs.readFileSync(pdfPath);

  pdfParse(dataBuffer).then((data) => {
    const text = data.text;
    console.log('Conteúdo do PDF (seção lançamentos):');

    const startIndex = text.indexOf('datalançamentosvalor (R$)saldo (R$)');
    if (startIndex === -1) {
      return res.status(400).json({ error: 'Seção de lançamentos não encontrada' }); // JSON para erro
    }

    const relevantText = text.substring(startIndex);
    const linhas = relevantText.split('\n').filter(line => line.trim());

    linhas.forEach(linha => {
      if (linha !== 'datalançamentosvalor (R$)saldo (R$)' && linha.trim().length > 0) {
        console.log(`\n🔍 Processando: "${linha}"`);
        
        // Extrai a data do início
        const dataMatch = linha.match(/^(\d{2}\/\d{2}\/\d{4})/);
        if (!dataMatch) {
          console.log(`❌ Sem data válida`);
          return;
        }
        
        const data = dataMatch[1];
        let resto = linha.substring(10); // Remove data
        
        // Ignora saldos e resumos
        if (resto.includes('SALDO') || resto.includes('TOTAL DISPONÃVEL') || resto.includes('ANTERIOR')) {
          console.log(`⚠️ Ignorado: linha de saldo`);
          return;
        }
        
        console.log(`📝 Analisando: "${resto}"`);
        
        // CORREÇÃO FINAL: O problema é que alguns valores estão grudados na descrição
        // Exemplos reais:
        // "PIX TRANSF FATIMA 08/08450,00" → deve ser "PIX TRANSF FATIMA 08/08" + "450,00"
        // "PIX TRANSF JOAO SI15/0834,34" → deve ser "PIX TRANSF JOAO SI15/08" + "34,34"
        
        // Estratégia: encontrar onde termina uma data dentro da descrição e começa o valor
        
        // Procura padrões como XX/XX seguidos imediatamente por números,vírgula
        // ou espaço seguido de valor
        let match = null;
        
        // Primeiro tenta: descrição + espaço + valor
        match = resto.match(/^(.+?)\s+(-?\d+,\d{2})$/);
        
        if (!match) {
          // Segundo tenta: descrição + data (XX/XX) + valor grudado
          match = resto.match(/^(.+?)(\d{2}\/\d{2})(\d+,\d{2})$/);
          if (match) {
            // Reconstrói: descrição + data, e valor separado
            const descricao = match[1] + match[2];
            const valorStr = match[3];
            match = [resto, descricao, '', valorStr];
          }
        }
        
        if (!match) {
          // Terceiro tenta: valor grudado direto no final (sem data no meio)
          match = resto.match(/^(.+?)(\d+,\d{2})$/);
          if (match) {
            // Precisa verificar se não está capturando parte de uma data
            const possibleDesc = match[1];
            const possibleValue = match[2];
            
            // Se a descrição termina com algo que parece data (XX/ ou XX), 
            // é provável que parte do valor foi misturada
            if (possibleDesc.match(/\d{1,2}\/$/) || possibleDesc.match(/\d{1,2}$/)) {
              console.log(`⚠️ Possível valor grudado detectado, tentando separar melhor`);
              // Tenta encontrar onde realmente deveria separar
              const betterMatch = resto.match(/^(.+?)(\d{1,3},\d{2})$/);
              if (betterMatch) {
                match = [resto, betterMatch[1], '', betterMatch[2]];
              }
            } else {
              match = [resto, possibleDesc, '', possibleValue];
            }
          }
        }
        
        if (!match) {
          console.log(`❌ Não conseguiu separar descrição e valor`);
          return;
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

        // Converte valor para número
        const valorNumerico = parseFloat(valorStr.replace('-', '').replace(',', '.'));
        const valorFinal = isSaida ? -valorNumerico : valorNumerico;
        const tipo = valorFinal < 0 ? 'saida' : 'entrada';
        
        const [dia, mes, ano] = data.split('/');

        // Categorização automática
        const categoria = categorizarTransacao(descricaoLimpa, valorFinal);

        console.log(`💰 Valor final: ${valorFinal} (${tipo})`);
        console.log(`🏷️ Categoria: ${categoria}`);

        db.run(
          "INSERT INTO transacoes (data, descricao, valor, tipo, categoria, mes, ano) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [data, descricaoLimpa, valorFinal, tipo, categoria, mes, ano],
          (err) => {
            if (err) {
              console.error('❌ Erro ao inserir:', err);
            } else {
              console.log(`✅ INSERIDO: ${data} | "${descricaoLimpa}" | ${valorFinal} | ${tipo} | ${categoria}`);
            }
          }
        );
      }
    });

    res.json({ message: 'Arquivo processado e dados de lançamentos salvos' }); // Aqui, Leo! Substitua o res.send por isso
  }).catch(err => {
    console.error('Erro ao processar PDF:', err);
    res.status(500).json({ error: 'Erro ao processar o PDF' }); // E aqui para erros
  });
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