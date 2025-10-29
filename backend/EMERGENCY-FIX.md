# 🚨 EMERGÊNCIA - vercel.json Corrigido

## ❌ O Problema

O último `vercel.json` estava quebrado e causou 404 em TODOS os endpoints.

## ✅ Solução IMEDIATA

Revertido para configuração simples usando `rewrites` ao invés de `routes`.

## 🚀 FAÇA AGORA

```bash
git add backend/vercel.json
git commit -m "Fix: Revert vercel.json to working configuration"
git push origin main
```

**Aguarde 1-2 minutos** para o deploy completar.

## 🧪 Teste Após Deploy

No console do navegador (F12):

```javascript
// Teste básico
fetch('https://monetra-smoky.vercel.app/health')
  .then(r => r.json())
  .then(console.log);

// Teste CORS
fetch('https://monetra-smoky.vercel.app/test-cors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => r.json())
.then(console.log);
```

## ⚠️ Sobre o MongoDB

O erro `net::ERR_FAILED` indica que a função está FALHANDO antes de responder.

**Causas prováveis:**
1. **MONGODB_URI não configurada** no Vercel
2. **JWT_SECRET não configurada** no Vercel  
3. **MongoDB Atlas bloqueando IP**

**Verifique AGORA no Vercel:**
- Settings → Environment Variables
- Deve ter: `MONGODB_URI`, `JWT_SECRET`, `TOKEN_EXPIRES_IN`

---

**COMMIT IMEDIATAMENTE!**
