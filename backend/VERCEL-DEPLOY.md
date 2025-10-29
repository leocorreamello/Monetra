# 🚀 Deploy no Vercel - Monetra Backend

Este guia contém as instruções para fazer o deploy do backend da aplicação Monetra no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou outra instância MongoDB)
3. Repositório Git conectado ao Vercel

## 🔧 Configuração das Variáveis de Ambiente

Antes de fazer o deploy, você precisa configurar as seguintes variáveis de ambiente no Vercel:

### Passo 1: Acessar Configurações do Projeto

1. Acesse seu projeto no dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar as Variáveis

Adicione as seguintes variáveis:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | String de conexão do MongoDB |
| `JWT_SECRET` | `seu-secret-super-seguro-aqui` | Chave secreta para assinar tokens JWT (use um valor longo e aleatório) |
| `TOKEN_EXPIRES_IN` | `7d` | Tempo de expiração do token (ex: 7d, 24h, 30m) |
| `NODE_ENV` | `production` | Ambiente de execução |

### Como Gerar um JWT_SECRET Seguro

Use um destes métodos para gerar uma chave segura:

```bash
# Usando Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Usando OpenSSL
openssl rand -hex 64

# Usando PowerShell (Windows)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 📁 Estrutura do Projeto

O backend está configurado para funcionar como Serverless Functions no Vercel:

```
backend/
├── api/
│   ├── index.js              # Health check endpoint
│   ├── auth/
│   │   ├── register.js       # POST /auth/register
│   │   ├── login.js          # POST /auth/login
│   │   └── me.js             # GET /auth/me
│   └── src/
│       └── database.js       # Conexão otimizada com MongoDB
├── models/
│   └── User.js               # Modelo de usuário
├── vercel.json               # Configuração do Vercel
└── package.json
```

## 🌐 Endpoints Disponíveis

Após o deploy, os seguintes endpoints estarão disponíveis:

- `GET /health` - Health check da API
- `POST /auth/register` - Registro de novos usuários
- `POST /auth/login` - Login de usuários
- `GET /auth/me` - Obter informações do usuário autenticado

## 🔐 MongoDB Atlas - Configuração de Rede

Para que o Vercel consiga conectar ao MongoDB Atlas, você precisa:

1. Acesse seu cluster no MongoDB Atlas
2. Vá em **Network Access**
3. Clique em **Add IP Address**
4. Selecione **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Isso é necessário porque o Vercel usa IPs dinâmicos
5. Salve as alterações

⚠️ **Nota de Segurança**: O MongoDB Atlas tem autenticação por usuário/senha, então mesmo com IPs liberados, apenas usuários autenticados podem acessar.

## 🚀 Deploy

### Deploy via Git

1. Faça commit das alterações:
```bash
git add .
git commit -m "Configure backend for Vercel"
git push origin main
```

2. O Vercel detectará automaticamente as mudanças e fará o deploy

### Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy do backend
cd backend
vercel --prod
```

## 🧪 Testando os Endpoints

Após o deploy, teste os endpoints:

### Health Check
```bash
curl https://seu-projeto.vercel.app/health
```

### Registro de Usuário
```bash
curl -X POST https://seu-projeto.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

### Login
```bash
curl -X POST https://seu-projeto.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

### Verificar Usuário Autenticado
```bash
curl https://seu-projeto.vercel.app/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔄 Atualizando o Frontend

Após o deploy do backend, atualize a variável de ambiente do frontend:

### No Vercel (Frontend)

1. Acesse o projeto do frontend no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione ou atualize:
   - `NG_APP_API_BASE_URL` = `https://seu-backend.vercel.app`

### Localmente (Desenvolvimento)

Atualize o arquivo `frontend/public/env.js`:

```javascript
window.__env = Object.assign(window.__env || {}, {
  "NG_APP_API_BASE_URL": "https://seu-backend.vercel.app"
});
```

## 📊 Monitoramento

### Logs no Vercel

1. Acesse seu projeto no dashboard do Vercel
2. Vá em **Deployments**
3. Clique no deployment ativo
4. Acesse a aba **Functions** para ver logs em tempo real

### Verificar Erros Comuns

- **502 Bad Gateway**: Erro de conexão com MongoDB, verifique `MONGODB_URI`
- **401 Unauthorized**: Problema com `JWT_SECRET`, verifique se está configurado
- **500 Internal Server Error**: Veja os logs no Vercel para detalhes

## 🔒 Segurança

### Checklist de Segurança

- ✅ Use um `JWT_SECRET` forte e aleatório
- ✅ Configure `MONGODB_URI` com credenciais seguras
- ✅ Nunca commite arquivos `.env` no Git
- ✅ Use HTTPS em produção (Vercel fornece automaticamente)
- ✅ Configure CORS adequadamente se necessário

## 🐛 Troubleshooting

### Erro: "MONGODB_URI is not defined"

**Solução**: Configure a variável de ambiente `MONGODB_URI` no Vercel.

### Erro: "JWT_SECRET environment variable is not defined"

**Solução**: Configure a variável de ambiente `JWT_SECRET` no Vercel.

### Erro: "MongooseServerSelectionError"

**Solução**: 
1. Verifique se o IP do Vercel está liberado no MongoDB Atlas
2. Confirme se as credenciais do `MONGODB_URI` estão corretas
3. Verifique se o cluster do MongoDB está ativo

### Erro: "Failed to create user"

**Solução**: 
1. Verifique os logs no Vercel
2. Confirme se o corpo da requisição está correto
3. Verifique se a conexão com MongoDB está funcionando

## 📚 Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express.js no Vercel](https://vercel.com/guides/using-express-with-vercel)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no dashboard do Vercel
2. Confirme todas as variáveis de ambiente
3. Teste os endpoints individualmente
4. Verifique a conexão com MongoDB Atlas

---

✨ **Boa sorte com seu deploy!** ✨
