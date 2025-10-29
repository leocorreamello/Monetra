# 🔧 Correção de CORS - Vercel

## ❌ Problema Identificado

```
Access to XMLHttpRequest at 'https://monetra-smoky.vercel.app/api/auth/register' 
from origin 'https://monetra-c1h5.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solução Aplicada

### 1. Headers CORS Dinâmicos em Todas as Funções

**Antes:**
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Depois:**
```javascript
const origin = req.headers.origin || '*';
res.setHeader('Access-Control-Allow-Origin', origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

Isso permite que o Vercel aceite requisições do seu frontend específico.

### 2. Configuração Global no vercel.json

Adicionada seção `headers` no `vercel.json`:

```json
"headers": [
  {
    "source": "/api/(.*)",
    "headers": [
      {
        "key": "Access-Control-Allow-Credentials",
        "value": "true"
      },
      {
        "key": "Access-Control-Allow-Origin",
        "value": "*"
      },
      {
        "key": "Access-Control-Allow-Methods",
        "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
      },
      {
        "key": "Access-Control-Allow-Headers",
        "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
      }
    ]
  }
]
```

## 📋 Arquivos Modificados

✅ `api/auth/register.js` - Headers CORS dinâmicos  
✅ `api/auth/login.js` - Headers CORS dinâmicos  
✅ `api/auth/me.js` - Headers CORS dinâmicos  
✅ `api/transactions.js` - Headers CORS dinâmicos  
✅ `api/categorias.js` - Headers CORS dinâmicos  
✅ `api/upload.js` - Headers CORS dinâmicos  
✅ `vercel.json` - Configuração global de headers

## 🚀 Próximos Passos

### 1. Commit e Push

```bash
git add .
git commit -m "Fix CORS policy for Vercel deployment"
git push origin main
```

### 2. Aguardar Deploy do Vercel

O Vercel detectará as mudanças e fará o deploy automaticamente.

### 3. Testar Novamente

Após o deploy, teste o registro novamente:

1. Acesse seu frontend: `https://monetra-c1h5.vercel.app`
2. Tente criar uma nova conta
3. Verifique o console - o erro de CORS deve ter desaparecido

## 🔍 Como Verificar se Funcionou

### No Console do Browser (F12)

**Antes (Erro):**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Depois (Sucesso):**
```
POST https://monetra-smoky.vercel.app/api/auth/register 201 (Created)
```

### Resposta Esperada

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "createdAt": "2025-10-29T..."
  }
}
```

## 🧪 Testar Localmente Antes do Deploy

Se quiser testar localmente antes de fazer o deploy:

```bash
cd backend
npm run dev
```

Depois teste com curl:

```bash
# Teste preflight (OPTIONS)
curl -X OPTIONS http://localhost:3000/auth/register \
  -H "Origin: https://monetra-c1h5.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Deve retornar headers CORS corretos
```

## 📊 O Que Mudou

### Headers CORS Adicionados

1. **Access-Control-Allow-Origin**: Dinâmico baseado na origem da requisição
2. **Access-Control-Allow-Credentials**: `true` para permitir cookies/auth
3. **Access-Control-Allow-Methods**: Todos os métodos necessários
4. **Access-Control-Allow-Headers**: Incluindo `Authorization` para JWT

### Por Que Isso Funciona

- O Vercel precisa de headers CORS explícitos em serverless functions
- Headers dinâmicos permitem que qualquer origem faça requisições
- Configuração global no `vercel.json` garante que todos os endpoints tenham CORS
- Preflight requests (OPTIONS) são tratados corretamente

## ⚠️ Importante

Após o push, aguarde o deploy do Vercel completar (geralmente 1-2 minutos) antes de testar novamente.

---

✨ **CORS corrigido! Faça o commit e teste após o deploy.** ✨
