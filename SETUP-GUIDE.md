# Guia de Comandos - Projeto Monetra

## 📁 Frontend (Angular)

### Primeira Configuração
```bash
# Navegar para a pasta do frontend
cd frontend

# Instalar dependências
npm install

# Verificar se Angular CLI está instalado globalmente
ng version

# Se não estiver instalado:
npm install -g @angular/cli@latest
```

### Comandos para Desenvolvimento

#### Iniciar Servidor de Desenvolvimento
```bash
cd frontend
ng serve

# Ou com configurações específicas:
ng serve --host 0.0.0.0 --port 4200 --open

# Para abrir automaticamente no navegador:
ng serve -o
```

#### Build para Produção
```bash
cd frontend
ng build --configuration production

# Para preview da build:
ng build --configuration production --watch
```

#### Gerar Componentes/Serviços
```bash
cd frontend

# Gerar novo componente
ng generate component nome-do-componente
ng g c nome-do-componente

# Gerar serviço
ng generate service services/nome-do-servico
ng g s services/nome-do-servico

# Gerar módulo
ng generate module nome-do-modulo
ng g m nome-do-modulo

# Gerar pipe
ng generate pipe pipes/nome-do-pipe
ng g p pipes/nome-do-pipe

# Gerar guard
ng generate guard guards/nome-do-guard
ng g g guards/nome-do-guard
```

## 🗄️ Backend (Node.js/Express)

### Primeira Configuração
```bash
# Navegar para a pasta do backend (quando criado)
cd backend

# Inicializar projeto Node.js (se ainda não existir)
npm init -y

# Instalar dependências básicas
npm install express cors dotenv
npm install -D nodemon typescript @types/node @types/express

# Configurar TypeScript (se usando)
npx tsc --init
```

### Comandos para Desenvolvimento

#### Iniciar Servidor Backend
```bash
cd backend

# Modo desenvolvimento (com nodemon)
node server.js

# Modo produção:
npm start
``` 

## 🛠️ Comandos Úteis de Desenvolvimento

### Limpeza e Reset
```bash
# Frontend - limpar cache npm
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Angular - limpar cache
ng cache clean

# Git - reset local para match com remoto
git fetch origin
git reset --hard origin/main
```

### Debugging
```bash
# Frontend - modo debug
cd frontend
ng serve --source-map

# Verificar versões
ng version
npm list
node --version
npm --version

# Verificar portas em uso
netstat -ano | findstr :4200  # Windows
lsof -i :4200                 # macOS/Linux
```

## 🆘 Solução de Problemas Comuns

### Erro: "ng is not recognized"
```bash
npm install -g @angular/cli@latest
# Reiniciar terminal
```

### Erro: "Permission denied" (macOS/Linux)
```bash
sudo npm install -g @angular/cli
# Ou configurar npm para não usar sudo:
npm config set prefix ~/.npm-global
```

### Porta 4200 em uso
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -i :4200
kill -9 [PID_NUMBER]

# Ou usar porta diferente
ng serve --port 4201
```

### Erro de CORS (Frontend -> Backend)
```bash
# No backend, instalar e configurar cors:
npm install cors
# Adicionar no código: app.use(cors());
```