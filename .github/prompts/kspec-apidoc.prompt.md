---
description: "Gera documentação OpenAPI 3.1 a partir da TechSpec e do código-fonte"
---

Gera documentação de API no formato OpenAPI 3.1 a partir da TechSpec e do código-fonte do projeto.

## Argumento

`<slug-funcionalidade>` — slug do diretório em `spec/tasks/` (ex: `001-prd-auth`)

## Localização dos Arquivos

- TechSpec: `spec/tasks/<slug>/techspec.md`
- Controllers: `backend/src/controllers/`
- Schemas Zod: `backend/src/schemas/`
- Output: `spec/api/openapi.yaml`

## Fluxo de Trabalho

### 1. Análise da TechSpec (Obrigatório)

- Ler a seção "Endpoints de API" da TechSpec
- Extrair: método HTTP, path, descrição, request/response types
- Identificar schemas de validação mencionados

### 2. Análise do Código-Fonte (Obrigatório)

- Ler os controllers em `backend/src/controllers/` para identificar rotas implementadas
- Ler os schemas Zod em `backend/src/schemas/` para extrair validações
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
- `components/schemas`: schemas derivados dos tipos TypeScript e Zod

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
- [ ] Schemas Zod mapeados
- [ ] OpenAPI 3.1 gerado em spec/api/openapi.yaml
- [ ] Todos os endpoints da TechSpec documentados
- [ ] Discrepâncias reportadas ao usuário
