const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
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
  db.run("CREATE TABLE IF NOT EXISTS transacoes (id INTEGER PRIMARY KEY, data TEXT, descricao TEXT, valor REAL, tipo TEXT, categoria TEXT, mes TEXT)");
});

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado');
  }

  const pdfFile = req.file;
  console.log('Arquivo recebido:', pdfFile.originalname);
  // Placeholder para processar o PDF
  res.send('Arquivo recebido com sucesso');
});

app.listen(port, () => {
  console.log(`Servidor na porta ${port}`);
});