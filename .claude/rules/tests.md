# Testes

## Framework

Utilize a biblioteca Vitest para determinar os cenários de teste e as expectativas. Nunca utilize Jest.

**Exemplo:**
```typescript
import { describe, it, expect } from 'vitest';

describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John', email: 'john@example.com' });
    expect(user.name).toBe('John');
  });
});
```

## Execução

Para rodar os testes, utilize o comando:
```bash
bun run test
```

## Independência

Não crie dependência entre os testes. Deve ser possível rodar cada um deles de forma independente.

**Exemplo:**
```typescript
// ❌ Evite
let sharedUser: User;

it('should create user', () => {
  sharedUser = createUser({ name: 'John' });
});

it('should update user', () => {
  // depende do teste anterior
  updateUser(sharedUser.id, { name: 'Jane' });
});

// ✅ Prefira
it('should create user', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

it('should update user', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user.id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});
```

## Estrutura AAA/GWT

Siga o princípio **Arrange, Act, Assert** ou **Given, When, Then** para garantir o máximo de organização e legibilidade dentro dos testes.

**Exemplo:**
```typescript
it('should calculate total price with discount', () => {
  // Arrange (Given)
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const discountPercentage = 10;
  
  // Act (When)
  const total = calculateTotal(items, discountPercentage);
  
  // Assert (Then)
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

## Mocks e Tempo

Se estiver testando algum comportamento que depende de um Date, e isso for importante para o que estiver sendo testado, utilize um Mock para garantir que o teste seja repetível.

**Exemplo:**
```typescript
import { it, expect, vi } from 'vitest';

it('should set created date correctly', () => {
  // Arrange
  const mockDate = new Date('2024-01-01T12:00:00Z');
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);

  // Act
  const user = createUser({ name: 'John' });

  // Assert
  expect(user.createdAt).toEqual(mockDate);

  // Cleanup
  vi.useRealTimers();
});
```

## Foco e Clareza

Foque em testar um comportamento por teste. Evite escrever testes muito grandes.

**Exemplo:**
```typescript
// ❌ Evite
it('should handle user operations', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
  
  const updated = updateUser(user.id, { email: 'john@example.com' });
  expect(updated.email).toBe('john@example.com');
  
  deleteUser(user.id);
  const deleted = getUser(user.id);
  expect(deleted).toBeNull();
});

// ✅ Prefira
describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John' });
    expect(user.name).toBe('John');
  });
  
  it('should update user email', () => {
    const user = createUser({ name: 'John' });
    const updated = updateUser(user.id, { email: 'john@example.com' });
    expect(updated.email).toBe('john@example.com');
  });
  
  it('should delete user', () => {
    const user = createUser({ name: 'John' });
    deleteUser(user.id);
    const deleted = getUser(user.id);
    expect(deleted).toBeNull();
  });
});
```

## Cobertura

Garanta que o código que está sendo escrito esteja totalmente coberto por testes.

**Exemplo:**
```bash
# Para verificar cobertura
bun run test:coverage
```

## Expectativas Consistentes

Crie expectativas consistentes, garantindo que tudo que estiver sendo testado está de fato sendo conferido.

**Exemplo:**
```typescript
// ❌ Evite
it('should create user with full details', () => {
  const user = createUser({ 
    name: 'John',
    email: 'john@example.com',
    age: 30 
  });
  expect(user.name).toBe('John');
  // faltou testar email e age
});

// ✅ Prefira
it('should create user with full details', () => {
  const user = createUser({ 
    name: 'John',
    email: 'john@example.com',
    age: 30 
  });
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBe(30);
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

## Nomenclatura de Testes

Use descrições claras e descritivas que expliquem o comportamento esperado.

**Exemplo:**
```typescript
// ❌ Evite
it('test user', () => {});
it('works', () => {});

// ✅ Prefira
it('should create user with valid email', () => {});
it('should throw error when email is invalid', () => {});
it('should return null when user not found', () => {});
```