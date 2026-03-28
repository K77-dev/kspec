---
paths:
  - "backend/src/**/*.ts"
---

# Logging

## Níveis de Log

Utilize adequadamente os níveis DEBUG e ERROR para registrar logs que sejam úteis apenas para entender o que aconteceu ou erros que precisam ser analisados.

**Exemplo:**
```typescript
// DEBUG - informações de desenvolvimento
console.log('User authentication started', { userId });
console.log('Database query executed', { query, duration });

// ERROR - erros que precisam atenção
console.error('Failed to authenticate user', { userId, error: error.message });
console.error('Database connection failed', { error });
```

## Armazenamento

Nunca armazene logs em arquivos. Sempre redirecione pelo próprio processo (stdout/stderr).

**Exemplo:**
```typescript
// ✅ Prefira - os logs vão para stdout/stderr
console.log('User created successfully');
console.error('Failed to create user');

// Configure seu ambiente para capturar os logs:
// - Docker: docker logs
// - Kubernetes: kubectl logs
// - Serviços de log: CloudWatch, Datadog, etc.
```

## Dados Sensíveis

Nunca registre dados sensíveis como nome, endereço e cartão de crédito de pessoas.

**Exemplo:**
```typescript
// ❌ Evite
console.log('User created', { 
  name: 'John Doe',
  email: 'john@example.com',
  creditCard: '4111-1111-1111-1111',
  ssn: '123-45-6789'
});

// ✅ Prefira
console.log('User created', { 
  userId: 'user_123',
  timestamp: new Date().toISOString()
});

// Se necessário para debug, mascare dados sensíveis
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
}

console.log('User created', { 
  userId: 'user_123',
  email: maskEmail('john@example.com') // jo***@example.com
});
```

## Mensagens Claras

Seja sempre claro nas mensagens de log, sem exagerar ou utilizar textos longos.

**Exemplo:**
```typescript
// ❌ Evite - muito verboso
console.log('The user with the ID 123 has successfully completed the registration process and is now able to access the system with full privileges');

// ❌ Evite - muito vago
console.log('Done');
console.log('Error');

// ✅ Prefira - claro e conciso
console.log('User registered successfully', { userId: '123' });
console.error('Payment processing failed', { 
  orderId: 'order_456', 
  reason: 'insufficient_funds' 
});
```

## Métodos de Console

Utilize `console.log` ou `console.error` para registrar os logs.

**Exemplo:**
```typescript
// Para informações e debug
console.log('Application started', { port: 3000 });
console.log('User logged in', { userId });

// Para erros
console.error('Database connection failed', { error: error.message });
console.error('Payment gateway timeout', { orderId, timeout: 5000 });
```

## Tratamento de Exceções

Nunca silencie exceptions. Sempre registre os logs.

**Exemplo:**
```typescript
// ❌ Evite
try {
  await processPayment(orderId);
} catch (error) {
  // silenciosamente ignorado
}

// ❌ Evite
try {
  await processPayment(orderId);
} catch (error) {
  // apenas loga mas não re-throw quando deveria
  console.error(error);
}

// ✅ Prefira
try {
  await processPayment(orderId);
} catch (error) {
  console.error('Payment processing failed', {
    orderId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  throw error; // re-throw se necessário
}

// Ou trate de forma apropriada
try {
  await processPayment(orderId);
} catch (error) {
  console.error('Payment processing failed', { orderId, error });
  return { success: false, error: 'payment_failed' };
}
```

## Contexto nos Logs

Sempre inclua contexto relevante nos logs para facilitar debugging.

**Exemplo:**
```typescript
// ❌ Evite - sem contexto
console.log('Operation completed');
console.error('Failed');

// ✅ Prefira - com contexto
console.log('Payment processed', {
  orderId: 'order_123',
  amount: 99.99,
  currency: 'USD',
  timestamp: new Date().toISOString()
});

console.error('Payment failed', {
  orderId: 'order_123',
  userId: 'user_456',
  errorCode: 'insufficient_funds',
  attemptNumber: 3
});
```

## Estrutura de Logs

Use objetos estruturados para facilitar parsing e análise.

**Exemplo:**
```typescript
// ❌ Evite - string não estruturada
console.log(`User ${userId} created order ${orderId} with total ${total}`);

// ✅ Prefira - objeto estruturado
console.log('Order created', {
  userId,
  orderId,
  total,
  timestamp: new Date().toISOString(),
  source: 'web'
});

// Isso facilita queries em sistemas de log:
// - Filtrar por userId específico
// - Buscar orders acima de um valor
// - Agrupar por source
```