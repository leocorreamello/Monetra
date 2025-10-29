# 🔍 Diagnóstico de CORS - Vercel

## 🎯 Problema Atual

O erro persiste mesmo após configurar CORS:
```
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

## 🔧 Mudanças Aplicadas

### 1. Adicionei Headers CORS no Nível de Rota (vercel.json)

```json
{
  "src": "/(.*)",
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    ...
  },
  "continue": true
}
```

Isso garante que TODAS as rotas tenham headers CORS antes de chegar nas funções.

### 2. Mudei Resposta OPTIONS de 200 para 204

```javascript
// Antes
if (req.method === 'OPTIONS') {
  return res.status(200).end();
}

// Depois
if (req.method === 'OPTIONS') {
  return res.status(204).end(); // No Content
}
```

Status 204 é o padrão para preflight requests.

### 3. Adicionei Mais Headers

```javascript
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
res.setHeader('Access-Control-Max-Age', '86400'); // Cache por 24h
```

### 4. Criei Endpoint de Teste

`/test-cors` - Use para diagnosticar o problema

## 🧪 Como Diagnosticar

### Passo 1: Faça Commit e Deploy

```bash
git add .
git commit -m "Add comprehensive CORS configuration and test endpoint"
git push origin main
```

Aguarde 1-2 minutos para o deploy completar.

### Passo 2: Teste o Endpoint de Diagnóstico

**No navegador (Console - F12):**

```javascript
fetch('https://monetra-smoky.vercel.app/test-cors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "CORS test successful",
  "method": "POST",
  "origin": "https://monetra-c1h5.vercel.app",
  "timestamp": "2025-10-29T..."
}
```

Se funcionar, o problema NÃO é CORS.

### Passo 3: Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto backend (monetra-smoky)
3. Vá em **Deployments** → Clique no deployment ativo
4. Vá em **Functions** → Clique em uma função (ex: `api/auth/register.js`)
5. Veja os logs em tempo real

**Procure por:**
- `[register] Handling OPTIONS preflight from: ...`
- Erros de conexão com MongoDB
- Erros de JWT_SECRET

### Passo 4: Teste Direto com cURL

**Teste OPTIONS (preflight):**
```bash
curl -X OPTIONS https://monetra-smoky.vercel.app/auth/register \
  -H "Origin: https://monetra-c1h5.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Procure nos headers da resposta:**
```
< Access-Control-Allow-Origin: https://monetra-c1h5.vercel.app
< Access-Control-Allow-Methods: POST, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization, ...
```

**Teste POST direto:**
```bash
curl -X POST https://monetra-smoky.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://monetra-c1h5.vercel.app" \
  -d '{"email":"test@example.com","password":"senha123456","name":"Test"}' \
  -v
```

## 🔍 Possíveis Causas Raiz

### 1. Variáveis de Ambiente Não Configuradas ⚠️

Se `MONGODB_URI` ou `JWT_SECRET` não estiverem configurados, a função pode estar falhando ANTES de enviar os headers CORS.

**Verificar:**
1. Acesse Vercel Dashboard
2. Vá em **Settings** → **Environment Variables**
3. Confirme que existem:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `TOKEN_EXPIRES_IN`
   - `NODE_ENV=production`

### 2. MongoDB Atlas - IP Não Liberado ⚠️

Se o Vercel não consegue conectar ao MongoDB, a função falha antes de retornar headers.

**Verificar:**
1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access**
3. Confirme que `0.0.0.0/0` está na lista
4. Status deve estar **Active**

### 3. Connection String do MongoDB Incorreta ⚠️

**Verificar formato:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Teste localmente:**
```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err.message));"
```

### 4. Timeout da Função Serverless ⚠️

Vercel tem limite de 10s para funções no plano gratuito.

**Verificar nos logs:**
Procure por "Function execution timeout"

## 📊 Checklist de Diagnóstico

Execute na ordem:

- [ ] **Commit e deploy** das mudanças
- [ ] **Aguardar** deploy completar (1-2 min)
- [ ] **Testar** `/test-cors` endpoint
- [ ] **Verificar** variáveis de ambiente no Vercel
- [ ] **Verificar** Network Access no MongoDB Atlas
- [ ] **Testar** conexão MongoDB localmente
- [ ] **Ver logs** no Vercel Dashboard
- [ ] **Testar** com cURL direto

## 🆘 Se Nada Funcionar

### Opção 1: Usar Serverless Function Wrapper

Podemos criar um wrapper Express que trata CORS automaticamente.

### Opção 2: Mudar Estratégia de Deploy

- Usar `@vercel/node` com Express completo
- Usar um único endpoint que roteia internamente

### Opção 3: Verificar Configuração do Projeto no Vercel

- Framework Preset deve estar como "Other"
- Root Directory deve estar em `backend/`
- Node.js Version deve ser 18.x ou superior

## 📝 Próximos Passos

1. **Faça o deploy** com as mudanças
2. **Teste** `/test-cors` endpoint
3. **Verifique logs** no Vercel
4. **Confirme** variáveis de ambiente
5. **Reporte** o resultado

---

✨ **Vamos descobrir a causa raiz!** ✨
