# 🔄 Guia de Migração - Backend Refatorado

## 📝 Resumo das Mudanças

O backend foi completamente refatorado para funcionar como **Serverless Functions** no Vercel. Abaixo estão as mudanças principais:

## ✅ O Que Foi Feito

### 1. Estrutura Serverless
- ✅ Removido arquivo `api/[...slug].js` (catch-all)
- ✅ Criados endpoints específicos para cada rota
- ✅ Adicionado `api/src/auth-helper.js` para autenticação serverless
- ✅ Otimizada conexão MongoDB com cache global

### 2. Novos Arquivos Criados

```
backend/api/
├── auth/
│   ├── register.js    ✅ Novo
│   ├── login.js       ✅ Novo
│   └── me.js          ✅ Novo
├── transactions.js    ✅ Novo
├── categorias.js      ✅ Novo
├── upload.js          ✅ Novo
└── src/
    └── auth-helper.js ✅ Novo
```

### 3. Arquivos Atualizados

- ✅ `vercel.json` - Rotas específicas para cada endpoint
- ✅ `api/index.js` - Simplificado para health check
- ✅ `api/src/database.js` - Otimizado para serverless
- ✅ `.env.example` - Exemplo de configuração

### 4. Documentação

- ✅ `VERCEL-DEPLOY.md` - Guia completo de deploy
- ✅ `README-BACKEND.md` - Documentação da arquitetura
- ✅ `.vercelignore` - Otimização de deploy

## 🔑 Endpoints Mapeados

| Método | Rota Original | Endpoint Serverless | Status |
|--------|---------------|---------------------|---------|
| POST | `/auth/register` | `api/auth/register.js` | ✅ |
| POST | `/auth/login` | `api/auth/login.js` | ✅ |
| GET | `/auth/me` | `api/auth/me.js` | ✅ |
| GET | `/transactions` | `api/transactions.js` | ✅ |
| DELETE | `/transactions` | `api/transactions.js` | ✅ |
| PUT | `/transactions/:id/categoria` | `api/transactions.js` | ✅ |
| GET | `/categorias` | `api/categorias.js` | ✅ |
| POST | `/upload` | `api/upload.js` | ✅ |
| GET | `/health` | `api/index.js` | ✅ |

## 🚀 Como Testar Localmente

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
MONGODB_URI=mongodb://localhost:27017/monetra
JWT_SECRET=seu-secret-muito-seguro-aqui
TOKEN_EXPIRES_IN=7d
PORT=3000
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O servidor estará em: `http://localhost:3000`

### 4. Testar Endpoints

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Registro
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456",
    "name": "Usuário Teste"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456"
  }'
```

#### Obter Token e Testar Rota Autenticada
```bash
# Salve o token retornado no login
TOKEN="seu-token-aqui"

# Teste rota autenticada
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🌐 Deploy no Vercel

### Passo 1: Configurar Variáveis de Ambiente

No dashboard do Vercel, adicione:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=chave-super-secreta-aleatoria
TOKEN_EXPIRES_IN=7d
NODE_ENV=production
```

**Dica**: Gere um JWT_SECRET forte:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Passo 2: Deploy

```bash
# Via Git (recomendado)
git add .
git commit -m "Refactor backend for Vercel serverless"
git push origin main

# Ou via CLI do Vercel
cd backend
vercel --prod
```

### Passo 3: Atualizar Frontend

Atualize o frontend com a URL do backend:

**No Vercel (variável de ambiente do frontend):**
```
NG_APP_API_BASE_URL=https://seu-backend.vercel.app
```

**Localmente (frontend/public/env.js):**
```javascript
window.__env = Object.assign(window.__env || {}, {
  "NG_APP_API_BASE_URL": "https://seu-backend.vercel.app"
});
```

## 📊 Verificar Deploy

Após o deploy, teste todos os endpoints:

### 1. Health Check
```bash
curl https://seu-backend.vercel.app/health
```

### 2. Registro
```bash
curl -X POST https://seu-backend.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@example.com",
    "password": "senha123456",
    "name": "Novo Usuário"
  }'
```

### 3. Login
```bash
curl -X POST https://seu-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@example.com",
    "password": "senha123456"
  }'
```

### 4. Verificar Token
```bash
TOKEN="token-recebido-no-login"

curl https://seu-backend.vercel.app/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ Pontos de Atenção

### MongoDB Atlas
- ✅ Libere acesso de qualquer IP (`0.0.0.0/0`) no Network Access
- ✅ Use uma connection string válida com credenciais corretas
- ✅ Verifique se o cluster está ativo

### Variáveis de Ambiente
- ✅ Todas as variáveis devem ser configuradas no Vercel
- ✅ Use valores fortes para `JWT_SECRET`
- ✅ Não commite arquivos `.env` no Git

### CORS
- ✅ Todas as funções serverless têm CORS habilitado (`*`)
- ✅ Frontend pode fazer requisições de qualquer origem

### Timeouts
- ⚠️ Vercel tem limite de 10s para funções serverless (plano gratuito)
- ⚠️ Otimize queries do MongoDB se necessário

## 🐛 Solução de Problemas

### Erro: "MONGODB_URI is not defined"
**Causa**: Variável de ambiente não configurada  
**Solução**: Configure `MONGODB_URI` no Vercel

### Erro: "Failed to connect to MongoDB"
**Causa**: IP não liberado ou credenciais incorretas  
**Solução**: 
1. Libere `0.0.0.0/0` no MongoDB Atlas
2. Verifique as credenciais na connection string

### Erro: "Not authorized"
**Causa**: Token inválido ou não enviado  
**Solução**: 
1. Verifique se o header `Authorization` está correto
2. Formato: `Bearer seu-token-aqui`

### Erro: 502 Bad Gateway
**Causa**: Erro interno na função serverless  
**Solução**: 
1. Veja os logs no Vercel Dashboard
2. Verifique conexão com MongoDB
3. Confirme variáveis de ambiente

## 📚 Próximos Passos

1. ✅ Testar todos os endpoints localmente
2. ✅ Configurar variáveis no Vercel
3. ✅ Fazer deploy do backend
4. ✅ Atualizar URL do backend no frontend
5. ✅ Testar fluxo completo (registro → login → transações)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no dashboard do Vercel
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Teste cada endpoint individualmente
4. Verifique conexão com MongoDB Atlas

---

✨ **Backend refatorado e pronto para produção!** ✨
