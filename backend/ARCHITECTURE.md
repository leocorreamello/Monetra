# 📊 Arquitetura do Backend - Monetra (Refatorado)

## 🏗️ Estrutura Serverless no Vercel

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROTAS (vercel.json)                           │
├─────────────────────────────────────────────────────────────────┤
│  /health              → api/index.js                             │
│  /auth/register       → api/auth/register.js                     │
│  /auth/login          → api/auth/login.js                        │
│  /auth/me             → api/auth/me.js                           │
│  /transactions        → api/transactions.js                      │
│  /categorias          → api/categorias.js                        │
│  /upload              → api/upload.js                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVERLESS FUNCTIONS (api/)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  index.js                                                │   │
│  │  • Health check                                          │   │
│  │  • GET /health                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  auth/register.js                                        │   │
│  │  • Validação de email/senha                              │   │
│  │  • Hash de senha (bcryptjs)                              │   │
│  │  • Criação de usuário                                    │   │
│  │  • Geração de token JWT                                  │   │
│  │  • POST /auth/register                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  auth/login.js                                           │   │
│  │  • Validação de credenciais                              │   │
│  │  • Verificação de senha                                  │   │
│  │  • Geração de token JWT                                  │   │
│  │  • POST /auth/login                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  auth/me.js                                              │   │
│  │  • Verificação de token                                  │   │
│  │  • Retorna dados do usuário                              │   │
│  │  • GET /auth/me [🔒 Autenticado]                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  transactions.js                                         │   │
│  │  • GET - Listar transações                               │   │
│  │  • DELETE - Remover transações                           │   │
│  │  • PUT - Atualizar categoria                             │   │
│  │  • [🔒 Autenticado]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  categorias.js                                           │   │
│  │  • GET - Listar categorias                               │   │
│  │  • [🔒 Autenticado]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  upload.js                                               │   │
│  │  • POST - Upload de CSV/TXT                              │   │
│  │  • Parse de arquivos                                     │   │
│  │  • Processamento de transações                           │   │
│  │  • [🔒 Autenticado]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HELPERS & SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  api/src/auth-helper.js                                  │   │
│  │  • requireAuth() - Wrapper de autenticação               │   │
│  │  • authenticateRequest() - Validar token                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  api/src/database.js                                     │   │
│  │  • Conexão MongoDB com cache global                      │   │
│  │  • Pool de conexões otimizado                            │   │
│  │  • Reutilização entre invocações                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/services/transactions.js                            │   │
│  │  • Lógica de negócio                                     │   │
│  │  • Parse de CSV/TXT                                      │   │
│  │  • Categorização automática                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MODELS (Mongoose)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  models/User.js                                          │   │
│  │  • Schema: email, passwordHash, name                     │   │
│  │  • Método toJSON() - Remove dados sensíveis             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  models/Transaction.js                                   │   │
│  │  • Schema: user, data, descricao, valor, tipo, etc.     │   │
│  │  • Índices otimizados                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB ATLAS                               │
│                   (Database na Nuvem)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Autenticação

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   FRONTEND  │         │  BACKEND/AUTH   │         │   MONGODB   │
└─────────────┘         └─────────────────┘         └─────────────┘
       │                        │                          │
       │  POST /auth/register   │                          │
       │  {email, password}     │                          │
       │───────────────────────>│                          │
       │                        │                          │
       │                        │  Hash senha (bcrypt)     │
       │                        │─┐                        │
       │                        │ │                        │
       │                        │<┘                        │
       │                        │                          │
       │                        │  Criar usuário           │
       │                        │─────────────────────────>│
       │                        │                          │
       │                        │  Usuário criado          │
       │                        │<─────────────────────────│
       │                        │                          │
       │                        │  Gerar JWT token         │
       │                        │─┐                        │
       │                        │ │                        │
       │                        │<┘                        │
       │                        │                          │
       │  {token, user}         │                          │
       │<───────────────────────│                          │
       │                        │                          │
       │  Salva token           │                          │
       │  no localStorage       │                          │
       │─┐                      │                          │
       │ │                      │                          │
       │<┘                      │                          │
       │                        │                          │
       │  GET /transactions     │                          │
       │  Authorization: Bearer │                          │
       │───────────────────────>│                          │
       │                        │                          │
       │                        │  Verificar JWT           │
       │                        │─┐                        │
       │                        │ │                        │
       │                        │<┘                        │
       │                        │                          │
       │                        │  Buscar dados            │
       │                        │─────────────────────────>│
       │                        │                          │
       │                        │  Retornar dados          │
       │                        │<─────────────────────────│
       │                        │                          │
       │  {transactions: [...]} │                          │
       │<───────────────────────│                          │
       │                        │                          │
```

## 🔐 Segurança Implementada

### ✅ Autenticação JWT

- Token assinado com secret forte
- Expira em 7 dias (configurável)
- Validado em cada requisição autenticada

### ✅ Hash de Senhas

- bcryptjs com salt rounds = 12
- Senhas nunca armazenadas em texto plano
- Hash irreversível

### ✅ Validação de Dados

- express-validator em todos os endpoints
- Email válido e normalizado
- Senha com requisitos mínimos (8+ chars, letras e números)

### ✅ CORS

- Configurado em todos os endpoints
- Suporte a preflight (OPTIONS)
- Headers de segurança adequados

## 🚀 Vantagens da Arquitetura Serverless

### ⚡ Performance
- **Cold Start Otimizado**: Cache global de conexões MongoDB
- **Escalabilidade Automática**: Cada função escala independentemente
- **Edge Network**: Deploy global com baixa latência

### 💰 Custo
- **Pay-per-use**: Paga apenas pelo que usar
- **Free Tier Generoso**: 100GB/mês + 100K invocações

### 🛠️ Manutenção
- **Zero Servidores**: Sem gerenciamento de infra
- **Deploy Automático**: Push no Git = Deploy
- **Logs Integrados**: Dashboard com métricas em tempo real

## 📦 Dependências

```json
{
  "express": "^5.1.0",          // Framework web
  "mongoose": "^7.6.3",          // ODM MongoDB
  "jsonwebtoken": "^9.0.2",      // JWT
  "bcryptjs": "^2.4.3",          // Hash de senhas
  "express-validator": "^7.2.0", // Validação
  "cors": "^2.8.5",              // CORS
  "dotenv": "^16.4.5"            // Variáveis de ambiente
}
```

## 🔧 Variáveis de Ambiente

```
MONGODB_URI=mongodb+srv://...      # Conexão MongoDB
JWT_SECRET=<64-chars-random>       # Chave JWT
TOKEN_EXPIRES_IN=7d                # Expiração do token
NODE_ENV=production                # Ambiente
```

## 📊 Endpoints Completos

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/health` | GET | ❌ | Status da API |
| `/auth/register` | POST | ❌ | Criar conta |
| `/auth/login` | POST | ❌ | Login |
| `/auth/me` | GET | ✅ | Dados do usuário |
| `/transactions` | GET | ✅ | Listar transações |
| `/transactions` | DELETE | ✅ | Remover todas |
| `/transactions?mes=X&ano=Y` | DELETE | ✅ | Remover por período |
| `/transactions/:id/categoria` | PUT | ✅ | Atualizar categoria |
| `/categorias` | GET | ✅ | Listar categorias |
| `/upload` | POST | ✅ | Upload CSV/TXT |

---

✨ **Arquitetura moderna, escalável e pronta para produção!** ✨
