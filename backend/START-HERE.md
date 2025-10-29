# 🚀 COMEÇAR AQUI - Deploy no Vercel

## 📝 Resumo

O backend foi **completamente refatorado** para funcionar no Vercel como Serverless Functions. O problema de autenticação (registro e login) foi resolvido.

## ⚡ Quick Start (3 Passos)

### 1️⃣ Configurar Variáveis de Ambiente no Vercel

No dashboard do Vercel (seu projeto backend):

1. Vá em **Settings** → **Environment Variables**
2. Adicione estas variáveis:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/monetra
JWT_SECRET=<gerar-valor-seguro>
TOKEN_EXPIRES_IN=7d
NODE_ENV=production
```

**Como gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2️⃣ Liberar Acesso no MongoDB Atlas

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access**
3. Clique em **Add IP Address**
4. Selecione **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Salve

### 3️⃣ Fazer Deploy

```bash
# Committar as mudanças
git add .
git commit -m "Refactor backend for Vercel serverless"
git push origin main
```

O Vercel fará o deploy automaticamente! 🎉

## ✅ Testar o Deploy

Após o deploy, teste se está funcionando:

```bash
# 1. Health check
curl https://seu-backend.vercel.app/health

# 2. Criar conta
curl -X POST https://seu-backend.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123456","name":"Teste"}'

# 3. Login
curl -X POST https://seu-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123456"}'
```

Se receber respostas JSON, está funcionando! ✅

## 🔄 Atualizar Frontend

**No Vercel (projeto frontend):**

1. Vá em **Settings** → **Environment Variables**
2. Adicione ou atualize:
   ```
   NG_APP_API_BASE_URL=https://seu-backend.vercel.app
   ```

**Localmente (desenvolvimento):**

Edite `frontend/public/env.js`:
```javascript
window.__env = Object.assign(window.__env || {}, {
  "NG_APP_API_BASE_URL": "https://seu-backend.vercel.app"
});
```

## 📚 Documentação Completa

- **`VERCEL-DEPLOY.md`** - Guia detalhado de deploy
- **`MIGRATION-GUIDE.md`** - Passo a passo da migração
- **`README-BACKEND.md`** - Arquitetura e desenvolvimento
- **`REFACTORING-SUMMARY.md`** - Resumo de todas as mudanças

## 🐛 Problemas Comuns

### ❌ "MONGODB_URI is not defined"
➡️ Configure a variável no Vercel

### ❌ "Failed to connect to MongoDB"
➡️ Libere `0.0.0.0/0` no MongoDB Atlas

### ❌ "Not authorized"
➡️ Verifique se o token está sendo enviado corretamente

### ❌ 502 Bad Gateway
➡️ Veja os logs no dashboard do Vercel

## 📊 O Que Foi Refatorado

✅ Endpoints de autenticação (`/auth/register`, `/auth/login`, `/auth/me`)  
✅ Endpoints de transações (`/transactions`, `/categorias`, `/upload`)  
✅ Conexão MongoDB otimizada para serverless  
✅ CORS configurado em todos os endpoints  
✅ Autenticação via JWT funcionando  
✅ Documentação completa criada

## 🎯 Próximos Passos

1. ✅ Fazer commit e push das mudanças
2. ✅ Configurar variáveis no Vercel
3. ✅ Liberar IP no MongoDB Atlas
4. ✅ Testar endpoints após deploy
5. ✅ Atualizar URL do backend no frontend
6. ✅ Testar fluxo completo (registro → login → usar app)

---

## 🆘 Precisa de Ajuda?

1. Consulte `MIGRATION-GUIDE.md` para troubleshooting detalhado
2. Verifique os logs no dashboard do Vercel
3. Confirme que todas as variáveis estão configuradas
4. Teste cada endpoint individualmente

---

✨ **Tudo pronto para deploy!** ✨
