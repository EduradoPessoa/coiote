# Instalação

Este guia cobre todas as opções de instalação do Coiote.

---

## Requisitos do Sistema

| Requisito | Versão Mínima         |
| --------- | --------------------- |
| Node.js   | 20.0.0+               |
| pnpm      | 8.0+ (opcional)       |
| npm       | 10.0+ (opcional)      |
| SO        | Windows, macOS, Linux |

---

## Instalação via npm/npx

### Usando npx (sem instalar)

```bash
npx coiote --version
npx coiote "sua tarefa aqui"
```

### Instalação global com npm

```bash
npm install -g coiote

# Verificar instalação
coiote --version
```

---

## Instalação via pnpm (Recomendado)

```bash
# Install pnpm se ainda não tiver
npm install -g pnpm

# Instalar Coiote
pnpm add -g coiote

# Verificar instalação
coiote --version
```

---

## Build do Projeto (Desenvolvimento)

Se você quiser contribuir ou executar a versão de desenvolvimento:

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/coiote.git
cd coiote

# Instalar dependências
pnpm install

# Build do projeto
pnpm build

# Executar em modo desenvolvimento
pnpm dev
```

### Scripts Disponíveis

| Comando          | Descrição                    |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Modo desenvolvimento (watch) |
| `pnpm build`     | Build de produção            |
| `pnpm test`      | Executar testes              |
| `pnpm lint`      | Verificar código             |
| `pnpm typecheck` | Verificar tipos              |

---

## Verificação da Instalação

### Verificar versão

```bash
coiote --version
```

### Verificar configuração

```bash
coiote config show
```

### Testar execução

```bash
# Configure a API key primeiro
export ANTHROPIC_API_KEY=sk-ant-...

# Execute um comando simples
coiote "listar arquivos na pasta atual"
```

---

## Solução de Problemas

### "comando não encontrado"

Adicione o diretório de binários ao PATH:

```bash
# npm
export PATH="$PATH:$(npm root -g)/coiote/bin"

# pnpm
export PATH="$PATH:$(pnpm bin -g)/coiote"
```

### Erro de versão Node.js

Use nvm para gerenciar versões:

```bash
# Instalar nvm (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js 20
nvm install 20
nvm use 20
```

### Problemas de permissão

```bash
# Linux/macOS
sudo chown -R $(whoami) ~/.pnpm
```

---

## Atualização

```bash
# npm
npm update -g coiote

# pnpm
pnpm update -g coiote
```

---

## Desinstalação

```bash
# npm
npm uninstall -g coiote

# pnpm
pnpm remove -g coiote
```
