# Exemplos

Exemplos práticos de uso do Coiote.

---

## Criar Arquivo

### Criar arquivo simples

```bash
coiote "criar arquivo index.html com estrutura HTML5"
```

**Resultado:**

```
📋 PLANO DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vou criar o arquivo index.html com:
- Doctype HTML5
- Head com meta tags
- Body com estrutura básica

Criar arquivo? [S/n]
s

✅ Arquivo criado: index.html
```

### Criar arquivo TypeScript

```bash
coiote "criar arquivo src/utils/format.ts com funções de formatação"
```

---

## Modificar Código

### Adicionar funcionalidade

```bash
coiote "adicionar validação de email ao formulário de contato"
```

### Refatorar código

```bash
coiote "refatorar função calculateTotal para usar reduce"
```

### Corrigir bug

```bash
coiote "corrigir erro de loop infinito na função fetchData"
```

---

## Executar Testes

### Executar todos os testes

```bash
coiote "executar todos os testes do projeto"
```

### Executar teste específico

```bash
coiote "executar testes da função calculateTotal"
```

### Criar teste

```bash
coiote "criar teste unitário para a função formatCurrency"
```

---

## Uso em CI/CD

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  coiote:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Coiote
        run: npm install -g coiote

      - name: Run Coiote
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          coiote -y "verificar código e executar testes"
```

### GitLab CI

```yaml
stages:
  - code-review

coiote:
  stage: code-review
  image: node:20
  script:
    - npm install -g coiote
    - coiote -y "revisar código e executar testes"
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        ANTHROPIC_API_KEY = credentials('anthropic-api-key')
    }

    stages {
        stage('Code Review') {
            steps {
                sh 'npm install -g coiote'
                sh 'coiote -y "analisar código"'
            }
        }
    }
}
```

---

## Arquivo de Tarefas Markdown

Crie um arquivo `.md` com múltiplas tarefas:

```markdown
# Setup do Projeto

## Passo 1: Instalar dependências

Instalar todas as dependências necessárias

## Passo 2: Configurar ESLint

Criar arquivo .eslintrc.json com regras básicas

## Passo 3: Configurar Prettier

Criar arquivo .prettierrc com formatação padrão

## Passo 4: Criar estrutura de pastas

Criar diretórios: src/, test/, docs/, scripts/
```

### Executar arquivo de tarefas

```bash
coiote --file setup.md
# ou
coiote --task setup.md
```

---

## Automação Avançada

### Pipeline completo

```bash
# Criar arquivo de automação
cat > pipeline.md << 'EOF'
# Pipeline de Desenvolvimento

## Análise
Revisar código e identificar melhorias

## Implementação
Implementar novas funcionalidades

## Testes
Executar suite completa de testes

## Build
Gerar build de produção

## Deploy
Preparar para deploy (se aplicável)
EOF

# Executar
coiote -y --file pipeline.md
```

### Integração com Git

```bash
# Criar commit automático
coiote "fazer commit das mudanças com mensagem descritiva"

# Criar branch
coiote "criar nova branch feature/autenticacao"

# Pull request
coiote "criar pull request com as mudanças"
```

---

## Dicas Avançadas

### Múltiplos comandos

```bash
# Encadear tarefas
coiote "instalar dependencia axios && executar testes"
```

### Usar contexto

```bash
# Com contexto de arquivo
coiote "analisar arquivo src/app.ts e sugerir melhorias"
```

### Variáveis

```bash
# Definir variáveis para a sessão
export COIOTE_MODEL=claude-opus-4-20250514
coiote "tarefa complexa"
```
