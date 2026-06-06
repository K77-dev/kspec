---
description: Clean Code, SOLID e limites mensuráveis — rule universal sempre aplicável
---

# Clean Code e SOLID — Padrões Universais

## 1. Propósito e Escopo

Esta rule define critérios universais de qualidade de código para agents de IA do kspec. Aplica-se a **todas as linguagens** no escopo de implementação e review. Convenções específicas de framework (React, Spring Boot, etc.) ficam nas rules enterprise — aqui tratamos apenas princípios estruturais: Clean Code, SOLID, limites mensuráveis e classificação de severidade.

## 2. Nomenclatura Expressiva

Nomes devem revelar intenção sem comentários explicativos. Use substantivos para entidades, verbos para ações. Evite abreviações obscuras, prefixos húngaros e sufixos genéricos (`data`, `info`, `manager`).

- **Variáveis e parâmetros**: descrevam o que contêm (`elapsedDays`, não `d`).
- **Funções e métodos**: descrevam o efeito (`calculateTotal`, não `process`).
- **Classes**: substantivos no singular (`OrderValidator`, não `ValidateOrders`).
- **Booleanos**: prefixos `is`, `has`, `can` (`isActive`, `hasPermission`).

## 3. Funções Pequenas e Responsabilidade Única

Cada função faz **uma coisa** e a faz bem. Se o nome precisa de "e" para descrever o que faz, provavelmente viola SRP. Extraia lógica auxiliar em funções privadas com nomes expressivos. Prefira composição de funções pequenas a métodos monolíticos.

## 4. Early Returns

Reduza aninhamento retornando cedo em casos de erro, validação ou guard clause. Evite `else` após `return`. Estrutura preferida: validar pré-condições → retornar → lógica principal.

```typescript
// ❌ Aninhamento desnecessário
function getDiscount(user: User): number {
  if (user.isActive) {
    if (user.orders > 10) {
      return 0.15;
    } else {
      return 0.05;
    }
  } else {
    return 0;
  }
}

// ✅ Early return
function getDiscount(user: User): number {
  if (!user.isActive) return 0;
  if (user.orders > 10) return 0.15;
  return 0.05;
}
```

## 5. DRY (Don't Repeat Yourself)

Duplicação de lógica é fonte de bugs divergentes. Extraia blocos repetidos (> 6 linhas idênticas) em função, classe utilitária ou módulo compartilhado. DRY aplica-se a lógica, não a coincidências estruturais inevitáveis.

## 6. Comentários

Comentários explicam **por quê**, nunca **o quê** (o código deve ser autoexplicativo). Remova comentários obsoletos. Evite comentar código morto — delete-o. Use comentários para decisões de negócio, limitações externas ou algoritmos não óbvios.

## 7. Tratamento Explícito de Erros

Nunca silencie erros. Capture exceções apenas quando puder tratar ou enriquecer contexto. Propague erros tipados quando não puder resolver. Evite `catch` vazio e retornos `null`/`undefined` sem documentar contrato. Em código novo, prefira tipos de erro explícitos a strings genéricas.

## 8. Magic Numbers e Parâmetros

Substitua literais numéricos sem contexto por constantes nomeadas (`MAX_RETRY_ATTEMPTS = 3`). Limite parâmetros a **4 por função** — acima disso, agrupe em objeto de configuração ou value object. Listas longas de parâmetros dificultam leitura e testes.

## 9. SRP — Single Responsibility Principle

**Definição**: uma classe ou módulo deve ter apenas um motivo para mudar.

**Sinais de violação**: classe com métodos de domínios distintos (persistência + validação + formatação); função que altera estado e formata saída; arquivo que mistura configuração, lógica e I/O.

**Correção**: separar responsabilidades em classes/módulos coesos; injetar dependências entre eles; manter camadas (domínio, aplicação, infraestrutura) distinguíveis.

## 10. OCP — Open/Closed Principle

**Definição**: entidades abertas para extensão, fechadas para modificação.

**Sinais de violação**: `switch`/`if-else` crescente por tipo; modificar classe existente para cada novo comportamento.

**Correção**: usar polimorfismo, strategy pattern ou registro de handlers; adicionar comportamento via nova implementação, não editando código estável.

## 11. LSP — Liskov Substitution Principle

**Definição**: subtipos devem ser substituíveis por seus tipos base sem alterar comportamento esperado.

**Sinais de violação**: subclasse que lança exceção onde a base não lança; override que enfraquece pré-condições ou fortalece pós-condições; implementação que ignora contrato da interface.

**Correção**: revisar hierarquia; preferir composição sobre herança forçada; garantir que contratos de interface sejam respeitados por todas as implementações.

## 12. ISP — Interface Segregation Principle

**Definição**: clientes não devem depender de interfaces que não usam.

**Sinais de violação**: interface "gorda" com métodos irrelevantes para implementadores; classes com métodos vazios ou `throw new Error("not implemented")`.

**Correção**: dividir interfaces grandes em contratos menores e coesos; aplicar apenas o que cada consumidor precisa.

## 13. DIP — Dependency Inversion Principle

**Definição**: módulos de alto nível não dependem de módulos de baixo nível; ambos dependem de abstrações.

**Sinais de violação**: instanciar implementação concreta dentro de classe de serviço (`new PostgresRepository()`); import direto de infraestrutura em domínio.

**Correção**: depender de interfaces/abstrações; injetar implementações via construtor, factory ou container; código de domínio nunca referencia detalhes de infraestrutura.

## 14. Limites Mensuráveis

Verificação manual pelos agents — sem ferramentas de lint neste escopo. Limites aplicam-se a **todas as linguagens**.

| Métrica | Limite | Severidade padrão | Como verificar (agent) |
|---------|--------|-------------------|------------------------|
| Linhas úteis por função | ≤ 50 | Bloqueante se > 50 | Contar linhas excluindo comentários e brancos |
| Complexidade ciclomática estimada | ≤ 10 | Bloqueante se > 10 | Pontos de decisão (`if`, `else`, `for`, `while`, `case`, `catch`, `&&`, `\|\|`, `?`) + 1 |
| Parâmetros por função/método | ≤ 4 | Aviso se > 4 | Contar parâmetros formais |
| Profundidade de aninhamento | ≤ 3 | Aviso se > 3 | Contar níveis de `{}` aninhados |
| God Class | > 300 linhas OU > 15 métodos públicos | **Aviso** | Contar no arquivo/classe em escopo da task |
| Duplicação | > 6 linhas idênticas em 2+ locais | Bloqueante | Comparar blocos no diff e arquivos tocados |

## 15. Classificação de Violações

| Nível | Efeito no review | Exemplos |
|-------|------------------|----------|
| **Bloqueante** | REPROVADO | Função > 50 linhas; complexidade > 10; SRP violado em código novo; DIP com dependência concreta injetável; duplicação > 6 linhas |
| **Aviso** | APROVADO COM RESSALVAS | God Class; parâmetros > 4; aninhamento > 3; violações menores de OCP/ISP |
| **Sugestão** | Não afeta status | Melhorias de nomenclatura; comentários removíveis; refatorações opcionais |

Agents devem citar a seção violada no relatório (ex.: `code-standards.md § SRP`, `§ Limites Mensuráveis`).

## 16. Exemplos TypeScript

### Nomenclatura

```typescript
// ❌ Nomes obscuros
const d = calc(u, o);
function proc(x: any) { /* ... */ }

// ✅ Nomes expressivos
const discountRate = calculateDiscount(user, order);
function validateOrderItems(items: OrderItem[]) { /* ... */ }
```

### Funções longas

```typescript
// ❌ Função monolítica (> 50 linhas úteis, múltiplas responsabilidades)
function processOrder(order: Order) {
  // validação, cálculo, persistência, notificação no mesmo bloco...
}

// ✅ Funções pequenas compostas
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateTotal(order);
  saveOrder(order, total);
  notifyCustomer(order);
}
```

### SRP

```typescript
// ❌ Classe com múltiplas responsabilidades
class OrderService {
  validate(order: Order) { /* ... */ }
  saveToDatabase(order: Order) { /* ... */ }
  sendEmail(order: Order) { /* ... */ }
}

// ✅ Responsabilidades separadas
class OrderValidator { validate(order: Order) { /* ... */ } }
class OrderRepository { save(order: Order) { /* ... */ } }
class OrderNotifier { notify(order: Order) { /* ... */ } }
```

### DIP

```typescript
// ❌ Dependência de implementação concreta
class PaymentService {
  private repo = new StripePaymentGateway();
  charge(amount: number) { return this.repo.charge(amount); }
}

// ✅ Dependência de abstração injetada
interface PaymentGateway { charge(amount: number): Promise<Result>; }

class PaymentService {
  constructor(private gateway: PaymentGateway) {}
  charge(amount: number) { return this.gateway.charge(amount); }
}
```

## 17. Exemplos Java

### Nomenclatura

```java
// ❌ Nomes obscuros
int d = calc(u, o);
void proc(Object x) { /* ... */ }

// ✅ Nomes expressivos
double discountRate = calculateDiscount(user, order);
void validateOrderItems(List<OrderItem> items) { /* ... */ }
```

### Funções longas

```java
// ❌ Método monolítico (> 50 linhas úteis)
public void processOrder(Order order) {
    // validação, cálculo, persistência, notificação no mesmo bloco...
}

// ✅ Métodos pequenos compostos
public void processOrder(Order order) {
    validateOrder(order);
    BigDecimal total = calculateTotal(order);
    saveOrder(order, total);
    notifyCustomer(order);
}
```

### SRP

```java
// ❌ Classe com múltiplas responsabilidades
class OrderService {
    void validate(Order order) { /* ... */ }
    void saveToDatabase(Order order) { /* ... */ }
    void sendEmail(Order order) { /* ... */ }
}

// ✅ Responsabilidades separadas
class OrderValidator { void validate(Order order) { /* ... */ } }
class OrderRepository { void save(Order order) { /* ... */ } }
class OrderNotifier { void notify(Order order) { /* ... */ } }
```

### DIP

```java
// ❌ Dependência de implementação concreta
class PaymentService {
    private final StripeGateway gateway = new StripeGateway();
    public Result charge(BigDecimal amount) { return gateway.charge(amount); }
}

// ✅ Dependência de abstração injetada
interface PaymentGateway { Result charge(BigDecimal amount); }

class PaymentService {
    private final PaymentGateway gateway;
    public PaymentService(PaymentGateway gateway) { this.gateway = gateway; }
    public Result charge(BigDecimal amount) { return gateway.charge(amount); }
}
```

## 18. Relação com Rules de Stack

Esta rule é **sempre aplicável** (`alwaysApply: true` no Cursor) e independente de stack. Rules enterprise (`react.md`, `spring-boot.md`, `typescript.md`, etc.) complementam com convenções de framework, formatação e ferramentas. Em conflito, princípios universais de Clean Code e SOLID prevalecem sobre estilo; em projetos brownfield, convenções de estilo podem ser adaptadas, mas SOLID e Clean Code são inegociáveis.
