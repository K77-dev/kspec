---
paths:
  - "**/prisma/**"
  - "**/drizzle/**"
  - "**/migrations/**"
  - "**/*.prisma"
  - "**/schema.ts"
---

# Database e ORM

## Migrations

Nunca altere uma migration existente após ela ter sido aplicada. Sempre crie uma nova migration para alterações.

**Exemplo:**
```bash
# ❌ Evite
# Editar 20240101_create_users.ts após já aplicada

# ✅ Prefira
# Criar nova migration
bunx prisma migrate dev --name add_email_to_users
```

## Naming de Migrations

Use o formato `YYYYMMDD_descricao_em_snake_case` ou o padrão do ORM utilizado.

**Exemplo:**
```
20240315_create_users_table
20240316_add_email_verification
20240320_create_orders_table
```

## Schema Design

### Timestamps

Sempre inclua `createdAt` e `updatedAt` em todas as tabelas.

**Exemplo:**
```typescript
// Prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Soft Delete

Prefira soft delete (campo `deletedAt`) a hard delete para dados importantes.

**Exemplo:**
```typescript
model User {
  id        String    @id @default(cuid())
  deletedAt DateTime?
}
```

### IDs

Prefira `cuid()` ou `uuid()` a auto-increment para IDs expostos em APIs.

## Repository Pattern

Separe o acesso a dados da lógica de negócio. O service nunca deve fazer queries diretamente.

**Exemplo:**
```typescript
// ❌ Evite
class UserService {
  async getUser(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}

// ✅ Prefira
class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}

class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getUser(id: string) {
    return this.userRepo.findById(id);
  }
}
```

## Queries

### N+1

Evite queries N+1. Use `include` ou `with` para carregar relações necessárias.

**Exemplo:**
```typescript
// ❌ Evite — N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const orders = await prisma.order.findMany({ where: { userId: user.id } });
}

// ✅ Prefira — 1 query com include
const users = await prisma.user.findMany({
  include: { orders: true },
});
```

### Paginação

Sempre pagine queries que podem retornar muitos resultados.

**Exemplo:**
```typescript
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

## Transações

Use transações para operações que modificam múltiplas tabelas.

**Exemplo:**
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: order.productId },
    data: { quantity: { decrement: order.quantity } },
  });
});
```

## Seeds

Mantenha seeds idempotentes — devem poder ser executados múltiplas vezes sem erro.

**Exemplo:**
```typescript
async function seed() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
  });
}
```
