# Node.js/JavaScript/TypeScript

## TypeScript

Todo o código-fonte deve ser escrito em TypeScript.

**Exemplo:**
```typescript
// ✅ Prefira arquivos .ts
// user.service.ts
interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  getUser(id: string): User {
    // implementação
  }
}
```

## Gerenciador de Pacotes

Utilize bun como ferramenta padrão para gerenciar dependências e executar scripts. Nunca utilize npm, yarn ou pnpm.

**Exemplo:**
```bash
# Instalar dependências
bun install

# Adicionar nova dependência
bun add axios

# Adicionar dependência de desenvolvimento
bun add -d @types/node

# Executar scripts
bun run dev
bun run test
bun run build
```

## Types de Bibliotecas

Se necessário, faça a instalação dos types das bibliotecas.

**Exemplo:**
```bash
bun add -d @types/node
bun add -d @types/react
```

## Validação de Tipagem

Antes de terminar uma tarefa, sempre valide se a tipagem está correta.

**Exemplo:**
```bash
# Executar verificação de tipos
bun run typecheck
```

## Declaração de Variáveis

Utilize `const` ao invés de `let` onde for possível. Nunca utilize `var` para declarar uma variável.

**Exemplo:**
```typescript
// ❌ Evite
var userName = 'John';
let userAge = 30; // se não vai mudar

// ✅ Prefira
const userName = 'John';
const userAge = 30;
let counter = 0; // apenas quando vai mudar
```

## Propriedades de Classe

Sempre declare as propriedades da classe como `private` ou `readonly`, evitando o uso de `public`.

**Exemplo:**
```typescript
// ❌ Evite
class UserService {
  public database: Database;
  public config: Config;
}

// ✅ Prefira
class UserService {
  private readonly database: Database;
  private readonly config: Config;
  
  constructor(database: Database, config: Config) {
    this.database = database;
    this.config = config;
  }
  
  // métodos públicos que usam as propriedades privadas
  public getUser(id: string): User {
    return this.database.findUser(id);
  }
}
```

## Métodos de Array

Prefira o uso de `find`, `filter`, `map` e `reduce` ao invés de `for` e `while`.

**Exemplo:**
```typescript
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
  { id: 3, name: 'Bob', age: 35 }
];

// ❌ Evite
const result = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].age > 25) {
    result.push(users[i].name);
  }
}

// ✅ Prefira
const result = users
  .filter(user => user.age > 25)
  .map(user => user.name);

// Find
const user = users.find(u => u.id === 2);

// Reduce
const totalAge = users.reduce((sum, user) => sum + user.age, 0);
```

## Promises e Async/Await

Sempre utilize `async/await` para lidar com promises. Evite o uso de callbacks.

**Exemplo:**
```typescript
// ❌ Evite
function getUser(id: string, callback: (user: User) => void) {
  database.query('SELECT * FROM users WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    callback(result);
  });
}

// ✅ Prefira
async function getUser(id: string): Promise<User> {
  const result = await database.query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
}

// Uso
try {
  const user = await getUser('123');
  console.log(user);
} catch (error) {
  console.error(error);
}
```

## Tipagem Forte

Nunca utilize `any`. Sempre utilize types existentes ou crie types para tudo que for implementado.

**Exemplo:**
```typescript
// ❌ Evite
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ Prefira
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}

// Para casos desconhecidos, use unknown
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}
```

## Imports e Exports

Nunca utilize `require` para importar módulos, sempre utilize `import`. Nunca utilize `module.exports` para exportar módulos, sempre `export`.

**Exemplo:**
```typescript
// ❌ Evite
const { Hono } = require('hono');
const { UserService } = require('./user.service');
module.exports = { createUser };

// ✅ Prefira
import { Hono } from 'hono';
import { UserService } from './user.service';
export { createUser };
```

## Default vs Named Exports

Se o arquivo tiver apenas uma coisa sendo exportada, utilize `default`, senão named exports.

**Exemplo:**
```typescript
// user.service.ts - apenas uma classe
export default class UserService {
  // ...
}

// user.utils.ts - múltiplas funções
export function validateEmail(email: string): boolean {
  // ...
}

export function formatName(name: string): string {
  // ...
}

export function calculateAge(birthDate: Date): number {
  // ...
}
```

## Dependência Circular

Evite dependência circular.

**Exemplo:**
```typescript
// ❌ Evite
// user.service.ts
import { OrderService } from './order.service';

export class UserService {
  constructor(private orderService: OrderService) {}
}

// order.service.ts
import { UserService } from './user.service';

export class OrderService {
  constructor(private userService: UserService) {}
}

// ✅ Prefira
// user.service.ts
export class UserService {
  getUser(id: string): User { }
}

// order.service.ts
export class OrderService {
  getOrders(userId: string): Order[] { }
}

// user-order.service.ts
import { UserService } from './user.service';
import { OrderService } from './order.service';

export class UserOrderService {
  constructor(
    private userService: UserService,
    private orderService: OrderService
  ) {}
  
  getUserWithOrders(userId: string) {
    const user = this.userService.getUser(userId);
    const orders = this.orderService.getOrders(userId);
    return { ...user, orders };
  }
}
```

## Tipos Utilitários

Utilize os tipos utilitários do TypeScript quando apropriado.

**Exemplo:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Partial - todos os campos opcionais
type UserUpdate = Partial<User>;

// Pick - selecionar campos específicos
type UserPublic = Pick<User, 'id' | 'name' | 'email'>;

// Omit - excluir campos específicos
type UserCreate = Omit<User, 'id'>;

// Readonly - tornar imutável
type UserReadonly = Readonly<User>;

// Record - criar objeto com chaves específicas
type UserMap = Record<string, User>;
```