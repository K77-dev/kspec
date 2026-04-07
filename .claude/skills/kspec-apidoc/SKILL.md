---
name: kspec-apidoc
description: Gera documentação OpenAPI 3.1 a partir da TechSpec e do código-fonte. Analisa rotas e schemas do projeto e produz spec/api/openapi.yaml.
---

Gera documentação de API no formato OpenAPI 3.1 a partir da TechSpec e do código-fonte do projeto.

## Argumento

`<slug-funcionalidade>` — slug do diretório em `spec/tasks/` (ex: `001-prd-auth`)

## Localização dos Arquivos

- TechSpec: @spec/tasks/$ARGUMENTS/techspec.md
- Controllers/Routes: diretório de rotas HTTP do projeto (consultar CLAUDE.md para localização)
- Schemas de validação: diretório de schemas do projeto (consultar CLAUDE.md para localização)
- Output: `spec/api/openapi.yaml`

## Fluxo de Trabalho

### 0. Validação de Skills Empresariais (Obrigatório)

Siga as instruções em @.claude/validation/enterprise-skills-check.md para validar e instalar
as skills empresariais obrigatórias. NÃO prossiga para o próximo passo se a validação
bloquear a execução.

### 1. Análise da TechSpec (Obrigatório)

- Ler a seção "Endpoints de API" da TechSpec
- Extrair: método HTTP, path, descrição, request/response types
- Identificar schemas de validação mencionados

### 2. Análise do Código-Fonte (Obrigatório)

- Identificar e ler os controllers/routes do projeto para identificar rotas implementadas
- Identificar e ler os schemas de validação do projeto para extrair validações
- Mapear rotas reais com os endpoints da TechSpec
- Identificar discrepâncias entre spec e implementação

### 3. Gerar OpenAPI Spec (Obrigatório)

Gerar `spec/api/openapi.yaml` no formato OpenAPI 3.1 com:

- `info`: título do projeto, versão, descrição
- `servers`: localhost:3000 (development)
- `paths`: cada endpoint com:
  - Método e path
  - Descrição
  - Request body schema (quando aplicável)
  - Response schemas (200, 400, 404, 500)
  - Tags para agrupamento por domínio
- `components/schemas`: schemas derivados dos tipos e validações do projeto

Seguir as convenções:
- Nomes de schemas em PascalCase
- Descrições claras em português
- Exemplos para cada schema quando possível

### 4. Validar e Reportar (Obrigatório)

- Verificar se todos os endpoints da TechSpec estão documentados
- Listar endpoints implementados que não estão na TechSpec (alertar)
- Listar endpoints da TechSpec não implementados (alertar)
- Apresentar ao usuário:
  - Caminho do arquivo gerado
  - Total de endpoints documentados
  - Discrepâncias encontradas (se houver)

## Checklist de Qualidade

- [ ] TechSpec lida e endpoints extraídos
- [ ] Controllers analisados
- [ ] Schemas de validação mapeados
- [ ] OpenAPI 3.1 gerado em spec/api/openapi.yaml
- [ ] Todos os endpoints da TechSpec documentados
- [ ] Discrepâncias reportadas ao usuário
