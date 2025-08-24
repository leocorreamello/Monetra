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
        // Novo regex para capturar data, descrição (tudo até o último valor) e valor final
        const lineMatch = linha.match(/^(\d{2}\/\d{2}\/\d{4})(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2}))$/);
        if (lineMatch) {
          const data = lineMatch[1];
          const descricao = lineMatch[2].trim();
          const valorStr = lineMatch[3];

          const isSaida = descricao.includes('-');

          if (descricao.includes('SALDO') || descricao.includes('TOTAL DISPONÃVEL') || descricao.includes('ANTERIOR')) {
            console.log(`Ignorado: ${linha} (resumo, não transação)`);
            return;
          }

          const valor = parseFloat(valorStr.replace('.', '').replace(',', '.')) || 0;
          const adjustedValor = isSaida ? -valor : valor;
          const tipo = adjustedValor < 0 ? 'saida' : 'entrada';
          const categoria = 'outros';
          const [dia, mes, ano] = data.split('/');

          if (!mes || !ano || mes === 'null' || ano === 'null') {
            console.log(`Ignorado: ${linha} (mes ou ano inválido)`);
            return;
          }

          db.run(
            "INSERT INTO transacoes (data, descricao, valor, tipo, categoria, mes, ano) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [data || '', descricao.replace('-', '').trim() || '', adjustedValor, tipo, categoria, mes || '01', ano || '2025'],
            (err) => {
              if (err) console.error('Erro ao inserir:', err);
            }
          );
          console.log(`Inserido: ${data}, ${descricao.replace('-', '').trim()}, ${adjustedValor}, ${tipo}, ${categoria}, ${mes}, ${ano}`);
        } else {
          console.log(`Ignorado: ${linha} (formato inválido)`);
        }
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
    res.json(rows);
  });
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