# Padrões de Codificação

## Idioma

Todo o código-fonte deve ser escrito em inglês, incluindo nomes de variáveis, funções, classes, comentários e documentação.

**Exemplo:**
```typescript
// ❌ Evite
const nomeDoProduto = "Laptop";
function calcularPreco() {}

// ✅ Prefira
const productName = "Laptop";
function calculatePrice() {}
```

## Convenções de Nomenclatura

### camelCase
Utilize para métodos, funções e variáveis.

**Exemplo:**
```typescript
const userName = "John";
const isActive = true;
function getUserById(id: string) {}
```

### PascalCase
Utilize para classes e interfaces.

**Exemplo:**
```typescript
class UserRepository {}
interface PaymentGateway {}
```

### kebab-case
Utilize para arquivos e diretórios.

**Exemplo:**
```
user-repository.ts
payment-gateway.service.ts
api-controllers/
```

## Nomenclatura Clara

Evite abreviações, mas também não escreva nomes muito longos (com mais de 30 caracteres).

**Exemplo:**
```typescript
// ❌ Evite
const usrNm = "John"; // muito abreviado
const userNameFromDatabaseQueryResult = "John"; // muito longo

// ✅ Prefira
const userName = "John";
const dbUserName = "John";
```

## Constantes e Magic Numbers

Declare constantes para representar magic numbers com legibilidade.

**Exemplo:**
```typescript
// ❌ Evite
if (user.age >= 18) {}
setTimeout(() => {}, 3600000);

// ✅ Prefira
const MINIMUM_AGE = 18;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

if (user.age >= MINIMUM_AGE) {}
setTimeout(() => {}, ONE_HOUR_IN_MS);
```

## Métodos e Funções

Os métodos e funções devem executar uma ação clara e bem definida, e isso deve ser refletido no seu nome, que deve começar por um verbo, nunca um substantivo.

**Exemplo:**
```typescript
// ❌ Evite
function user(id: string) {}
function userData() {}

// ✅ Prefira
function getUser(id: string) {}
function fetchUserData() {}
function createUser(data: UserData) {}
function updateUserEmail(id: string, email: string) {}
```

## Parâmetros

Sempre que possível, evite passar mais de 3 parâmetros. Dê preferência para o uso de objetos caso necessário.

**Exemplo:**
```typescript
// ❌ Evite
function createUser(name: string, email: string, age: number, address: string, phone: string) {}

// ✅ Prefira
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address: string;
  phone: string;
}

function createUser(params: CreateUserParams) {}
```

## Efeitos Colaterais

Evite efeitos colaterais. Em geral, um método ou função deve fazer uma mutação OU consulta, nunca permita que uma consulta tenha efeitos colaterais.

**Exemplo:**
```typescript
// ❌ Evite
function getUsers() {
  const users = database.query("SELECT * FROM users");
  logger.log("Users fetched"); // efeito colateral
  cache.set("users", users); // efeito colateral
  return users;
}

// ✅ Prefira
function getUsers() {
  return database.query("SELECT * FROM users");
}

function fetchAndCacheUsers() {
  const users = getUsers();
  logger.log("Users fetched");
  cache.set("users", users);
  return users;
}
```

## Estruturas Condicionais

Nunca faça o aninhamento de mais de dois if/else. Sempre dê preferência por early returns.

**Exemplo:**
```typescript
// ❌ Evite
function processPayment(user: User, amount: number) {
  if (user) {
    if (user.isActive) {
      if (amount > 0) {
        if (user.balance >= amount) {
          return completePayment(user, amount);
        }
      }
    }
  }
  return null;
}

// ✅ Prefira
function processPayment(user: User, amount: number) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (amount <= 0) return null;
  if (user.balance < amount) return null;
  
  return completePayment(user, amount);
}
```

## Flag Parameters

Nunca utilize flag params para chavear o comportamento de métodos e funções. Nesses casos, faça a extração para métodos e funções com comportamentos específicos.

**Exemplo:**
```typescript
// ❌ Evite
function getUser(id: string, includeOrders: boolean) {
  const user = database.getUser(id);
  if (includeOrders) {
    user.orders = database.getOrders(id);
  }
  return user;
}

// ✅ Prefira
function getUser(id: string) {
  return database.getUser(id);
}

function getUserWithOrders(id: string) {
  const user = getUser(id);
  user.orders = database.getOrders(id);
  return user;
}
```

## Tamanho de Métodos e Classes

- Evite métodos longos, com mais de 50 linhas
- Evite classes longas, com mais de 300 linhas

**Exemplo:**
```typescript
// ❌ Evite
class UserService {
  // 500 linhas de código
}

// ✅ Prefira
class UserAuthService {}
class UserProfileService {}
class UserNotificationService {}
```

## Formatação

Evite linhas em branco dentro de métodos e funções.

**Exemplo:**
```typescript
// ❌ Evite
function calculateTotal(items: Item[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  
  const tax = subtotal * 0.1;
  
  return subtotal + tax;
}

// ✅ Prefira
function calculateTotal(items: Item[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1;
  return subtotal + tax;
}
```

## Comentários

Evite o uso de comentários sempre que possível. O código deve ser autoexplicativo.

**Exemplo:**
```typescript
// ❌ Evite
// Check if user is adult
if (user.age >= 18) {}

// ✅ Prefira
const isAdult = user.age >= MINIMUM_LEGAL_AGE;
if (isAdult) {}
```

## Declaração de Variáveis

Nunca declare mais de uma variável na mesma linha.

**Exemplo:**
```typescript
// ❌ Evite
const name = "John", age = 30, email = "john@example.com";

// ✅ Prefira
const name = "John";
const age = 30;
const email = "john@example.com";
```

## Escopo de Variáveis

Declare as variáveis o mais próximo possível de onde serão utilizadas.

**Exemplo:**
```typescript
// ❌ Evite
function processOrder(orderId: string) {
  const user = getUser();
  const product = getProduct();
  const discount = calculateDiscount();
  
  validateOrder(orderId);
  checkInventory(orderId);
  
  // user é usado apenas aqui, 5 linhas depois
  notifyUser(user);
}

// ✅ Prefira
function processOrder(orderId: string) {
  validateOrder(orderId);
  checkInventory(orderId);
  
  const user = getUser();
  notifyUser(user);
}
```