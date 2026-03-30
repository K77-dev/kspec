---
applyTo: "backend/src/**/*.ts"
---

# REST/HTTP

## Framework

Utilize Hono para mapear os endpoints. Nunca utilize Express.

**Exemplo:**
```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/users', (c) => {
  // implementação
  return c.json({ users: [] });
});

export default app;
```

## Padrão REST

Utilize o padrão REST para consultas, mantendo o nome dos recursos em inglês e no plural, permitindo a navegabilidade em recursos alinhados.

**Exemplo:**
```typescript
// ✅ Prefira
GET /users
GET /users/:userId
GET /playlists/:playlistId/videos
GET /customers/:customerId/invoices

// ❌ Evite
GET /getUsers
GET /user/:userId (singular)
GET /usuario/:usuarioId (português)
```

## Nomenclatura de Recursos

Recursos e verbos compostos devem usar kebab-case.

**Exemplo:**
```typescript
// ✅ Prefira
GET /scheduled-events
POST /users/:userId/change-password
GET /payment-methods
POST /orders/:orderId/process-payment

// ❌ Evite
GET /scheduledEvents (camelCase)
GET /scheduled_events (snake_case)
```

## Profundidade de Recursos

Evite criar endpoints com mais de 3 recursos.

**Exemplo:**
```typescript
// ❌ Evite - muito profundo
GET /channels/:channelId/playlists/:playlistId/videos/:videoId/comments

// ✅ Prefira - mais direto
GET /videos/:videoId/comments
GET /comments?videoId=:videoId

// ✅ Ou organize de forma mais plana
GET /channels/:channelId/playlists
GET /playlists/:playlistId/videos
GET /videos/:videoId/comments
```

## Mutações e Ações

Para mutações, não siga REST à risca. Utilize uma combinação de REST para navegar nos recursos e verbos para representar ações que estão sendo executadas, sempre com POST.

**Exemplo:**
```typescript
// ✅ Prefira - verbos para ações específicas
POST /users/:userId/change-password
POST /orders/:orderId/cancel
POST /invoices/:invoiceId/send-reminder
POST /accounts/:accountId/activate

// ❌ Evite - PUT genérico para ações específicas
PUT /users/:userId
PUT /orders/:orderId

// ✅ PUT é apropriado para substituição completa do recurso
PUT /users/:userId
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

## Formato de Dados

O formato do payload de requisição e resposta deve ser sempre JSON, salvo que especificado algo diferente.

**Exemplo:**
```typescript
app.post('/users', async (c) => {
  const { name, email } = await c.req.json();
  const user = createUser({ name, email });
  return c.json({ id: user.id, name: user.name, email: user.email });
});

// Request
// Content-Type: application/json
// { "name": "John Doe", "email": "john@example.com" }

// Response
// Content-Type: application/json
// { "id": "123", "name": "John Doe", "email": "john@example.com" }
```

## Códigos de Status HTTP

### 200 - OK
Retorne quando a requisição for bem-sucedida.

**Exemplo:**
```typescript
app.get('/users/:userId', (c) => {
  const user = getUser(c.req.param('userId'));
  return c.json(user, 200);
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  const user = createUser(body);
  return c.json(user, 200);
});
```

### 404 - Not Found
Retorne se um recurso não for encontrado.

**Exemplo:**
```typescript
app.get('/users/:userId', (c) => {
  const userId = c.req.param('userId');
  const user = getUser(userId);
  if (!user) {
    return c.json({ error: 'User not found', userId }, 404);
  }
  return c.json(user);
});
```

### 500 - Internal Server Error
Retorne se for um erro inesperado.

**Exemplo:**
```typescript
app.get('/users', (c) => {
  try {
    const users = getUsers();
    return c.json(users);
  } catch (error) {
    console.error('Unexpected error fetching users', { error });
    return c.json({ error: 'Internal server error', message: 'An unexpected error occurred' }, 500);
  }
});
```

### 422 - Unprocessable Entity
Retorne se for um erro de negócio.

**Exemplo:**
```typescript
app.post('/orders/:orderId/cancel', (c) => {
  const order = getOrder(c.req.param('orderId'));
  if (order.status === 'shipped') {
    return c.json({ error: 'Cannot cancel shipped order', orderId: order.id, currentStatus: order.status }, 422);
  }
  cancelOrder(order.id);
  return c.json({ message: 'Order cancelled successfully' });
});
```

### 400 - Bad Request
Retorne se a requisição não estiver bem formatada.

**Exemplo:**
```typescript
app.post('/users', async (c) => {
  const { name, email } = await c.req.json();
  if (!name || !email) {
    return c.json({ error: 'Missing required fields', required: ['name', 'email'] }, 400);
  }
  if (!isValidEmail(email)) {
    return c.json({ error: 'Invalid email format', field: 'email' }, 400);
  }
  const user = createUser({ name, email });
  return c.json(user);
});
```

### 401 - Unauthorized
Retorne se o usuário não estiver autenticado.

**Exemplo:**
```typescript
app.get('/profile', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Authentication required', message: 'Please provide a valid token' }, 401);
  }
  const user = verifyToken(token);
  if (!user) {
    return c.json({ error: 'Invalid token', message: 'Token is expired or invalid' }, 401);
  }
  return c.json(user);
});
```

### 403 - Forbidden
Retorne se o usuário não estiver autorizado.

**Exemplo:**
```typescript
app.delete('/users/:userId', (c) => {
  const currentUser = getCurrentUser(c);
  const targetUserId = c.req.param('userId');
  if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
    return c.json({ error: 'Insufficient permissions', message: 'You are not allowed to delete this user' }, 403);
  }
  deleteUser(targetUserId);
  return c.json({ message: 'User deleted successfully' });
});
```

## Cliente HTTP

Utilize a Fetch API nativa para fazer chamadas para APIs externas.

**Exemplo:**
```typescript
// GET request
async function getUser(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  if (!response.ok) {
    console.error('API request failed', { status: response.status });
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

// POST request
async function createUser(userData: CreateUserData) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  return response.json();
}
```

## Middlewares

Utilize middlewares do Hono para funcionalidades transversais.

**Exemplo:**
```typescript
import { createMiddleware } from 'hono/factory';

// Middleware de autenticação
const authenticate = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  const user = verifyToken(token);
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  c.set('user', user);
  await next();
});

// Uso
app.post('/users', authenticate, async (c) => {
  const body = await c.req.json();
  const user = createUser(body);
  return c.json(user);
});
```
