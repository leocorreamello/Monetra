# Requisitos do Sistema - Projeto Monetra

## Pré-requisitos Obrigatórios

### 1. Node.js
- **Versão**: 18.x ou 20.x (LTS recomendado)
- **Download**: https://nodejs.org/
- **Verificação**: `node --version` e `npm --version`

### 2. Git
- **Versão**: Mais recente
- **Download**: https://git-scm.com/
- **Verificação**: `git --version`

### 3. Visual Studio Code
- **Download**: https://code.visualstudio.com/
- **Extensões Recomendadas**:
  - Angular Language Service
  - TypeScript Hero
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - ESLint
  - Prettier
  - GitLens
  - Angular Snippets
  - HTML CSS Support
  - Path Intellisense

## Tecnologias do Projeto

### Frontend
- **Angular**: 17.x
- **TypeScript**: 5.x
- **Angular CLI**: Mais recente
- **CSS**: CSS puro (sem preprocessador por enquanto)

### Backend (se aplicável)
- **Node.js**: 18.x ou 20.x
- **Express.js**: (se usando)
- **Database**: (especificar quando definido)

## Dependências Globais Necessárias

```bash
npm install -g @angular/cli
npm install -g typescript
npm install -g nodemon (se usando backend Node.js)
```

## Estrutura de Pastas Esperada
```
Monetra/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── navigation/
│   │   │   │   ├── navigation.ts
│   │   │   │   ├── navigation.html
│   │   │   │   └── navigation.css
│   │   │   └── ...
│   │   └── ...
│   ├── package.json
│   └── angular.json
├── backend/ (se aplicável)
└── docs/
```

## Configurações do Sistema

### Windows
- **PowerShell**: Versão 5.1 ou superior
- **Política de Execução**: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### macOS/Linux
- **Terminal**: Bash ou Zsh
- **Permissions**: Certifique-se de ter permissões para instalar pacotes globalmente

## Variáveis de Ambiente (se necessário)
- NODE_ENV=development
- API_URL=http://localhost:3000 (ajustar conforme necessário)

## Troubleshooting Comum

### Problema: Erro de permissão npm (Windows)
**Solução**: Executar PowerShell como Administrador

### Problema: Angular CLI não reconhecido
**Solução**: 
```bash
npm uninstall -g @angular/cli
npm cache clean --force
npm install -g @angular/cli@latest
```

### Problema: Porta em uso
**Solução**: Usar `netstat -ano | findstr :4200` (Windows) ou `lsof -i :4200` (macOS/Linux)

## Verificação de Instalação

Execute os seguintes comandos para verificar se tudo está instalado corretamente:

```bash
node --version          # Deve mostrar v18.x.x ou v20.x.x
npm --version           # Deve mostrar 9.x.x ou superior
ng version              # Deve mostrar Angular CLI e versões
git --version           # Deve mostrar versão do Git
code --version          # Deve mostrar versão do VS Code
```