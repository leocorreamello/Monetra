# 🔧 Backend - Monetra API

Backend refatorado para funcionar como **Serverless Functions** no Vercel.

## 📁 Estrutura do Projeto

```
backend/
├── api/                           # Serverless Functions
│   ├── index.js                   # Health check (GET /)
│   ├── auth/
│   │   ├── register.js           # POST /auth/register
│   │   ├── login.js              # POST /auth/login
│   │   └── me.js                 # GET /auth/me
│   ├── transactions.js           # GET /transactions
│   ├── categorias.js             # GET /categorias
│   ├── upload.js                 # POST /upload
│   └── src/
│       ├── database.js           # Conexão MongoDB otimizada
│       └── auth-helper.js        # Helper de autenticação
│
├── models/                       # Modelos Mongoose
│   ├── User.js
│   └── Transaction.js
│
├── src/                          # Código compartilhado
│   ├── app.js                   # Express app (legacy)
│   ├── routes/
│   │   └── transactions.js      # Rotas (legacy)
│   └── services/
│       └── transactions.js      # Lógica de negócio
│
├── middleware/                   # Middlewares (legacy)
│   └── auth.js
│
├── routes/                       # Rotas Express (legacy)
│   └── auth.js
│
├── .env.example                  # Exemplo de variáveis de ambiente
├── package.json
├── vercel.json                   # Configuração do Vercel
├── server.js                     # Servidor local (desenvolvimento)
├── VERCEL-DEPLOY.md             # Guia de deploy
└── README-BACKEND.md            # Este arquivo
```

## 🚀 Arquitetura Serverless

O backend foi refatorado para funcionar como **Serverless Functions** no Vercel:

### ✅ Vantagens

- **Escalabilidade automática**: Cada função escala independentemente
- **Cold start otimizado**: Conexão MongoDB com cache global
- **Deploy simplificado**: Sem necessidade de gerenciar servidores
- **CORS configurado**: Todas as funções têm CORS habilitado

### 📡 Endpoints Disponíveis

#### Autenticação

- **POST** `/auth/register` - Registrar novo usuário
  ```json
  {
    "email": "user@example.com",
    "password": "senha123",
    "name": "Nome do Usuário"
  }
  ```

- **POST** `/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "senha123"
  }
  ```

- **GET** `/auth/me` - Obter usuário autenticado (requer token)
  ```
  Authorization: Bearer <token>
  ```

#### Transações

- **GET** `/transactions` - Listar transações (requer token)
- **GET** `/categorias` - Listar categorias (requer token)
- **POST** `/upload` - Upload de arquivo CSV/TXT (requer token)

#### Utilitários

- **GET** `/health` - Health check da API

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js >= 22.0.0
- MongoDB (local ou Atlas)

### Instalação

```bash
cd backend
npm install
```

### Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis no arquivo `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/monetra
JWT_SECRET=seu-secret-super-seguro
TOKEN_EXPIRES_IN=7d
PORT=3000
```

### Executar

```bash
# Desenvolvimento com hot reload
npm run dev

# Produção local
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🌐 Deploy no Vercel

Consulte o arquivo **[VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md)** para instruções detalhadas de deploy.

### Resumo Rápido

1. Configure as variáveis de ambiente no Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `TOKEN_EXPIRES_IN`
   - `NODE_ENV=production`

2. Faça o deploy:
```bash
vercel --prod
```

3. Atualize o frontend com a URL do backend

## 🔒 Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação:

1. Usuário faz login e recebe um token
2. Token deve ser enviado no header `Authorization: Bearer <token>`
3. Token válido por 7 dias (configurável)

### Exemplo de Requisição Autenticada

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://seu-backend.vercel.app/transactions
```

## 📦 Dependências Principais

- **express**: Framework web
- **mongoose**: ODM para MongoDB
- **jsonwebtoken**: Geração e validação de tokens JWT
- **bcryptjs**: Hash de senhas
- **express-validator**: Validação de dados
- **cors**: Cross-Origin Resource Sharing
- **multer**: Upload de arquivos (legacy, não usado em serverless)

## 🔍 Logs e Debugging

### Desenvolvimento Local

Os logs aparecem no console onde o servidor está rodando.

### Produção (Vercel)

1. Acesse o dashboard do Vercel
2. Vá em **Deployments**
3. Clique no deployment ativo
4. Acesse **Functions** para ver logs em tempo real

## 🧪 Testando

### Health Check
```bash
curl https://seu-backend.vercel.app/health
```

### Registro
```bash
curl -X POST https://seu-backend.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Teste"
  }'
```

### Login
```bash
curl -X POST https://seu-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

## 🐛 Troubleshooting

### Erro: "MONGODB_URI is not defined"
**Solução**: Configure a variável de ambiente `MONGODB_URI`

### Erro: "JWT_SECRET environment variable is not defined"
**Solução**: Configure a variável de ambiente `JWT_SECRET`

### Erro de CORS
**Solução**: Todas as funções serverless têm CORS configurado com `Access-Control-Allow-Origin: *`

### Timeout em requisições
**Solução**: Vercel tem limite de 10s para serverless functions no plano gratuito. Otimize queries do MongoDB.

## 📚 Recursos

- [Documentação do Vercel](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)

## 🤝 Contribuindo

1. Mantenha a estrutura serverless
2. Adicione testes quando possível
3. Documente mudanças significativas
4. Use variáveis de ambiente para configurações

---

✨ **Happy coding!** ✨
