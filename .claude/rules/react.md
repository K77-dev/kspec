---
paths:
  - "frontend/src/**/*.tsx"
  - "frontend/src/**/*.ts"
---

# React

## Componentes Funcionais

Utilize componentes funcionais, nunca classes.

**Exemplo:**
```typescript
// ❌ Evite
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// ✅ Prefira
function UserProfile({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Ou com arrow function
const UserProfile = ({ name }: { name: string }) => {
  return <div>{name}</div>;
};
```

## TypeScript

Utilize TypeScript e a extensão `.tsx` para os componentes.

**Exemplo:**
```typescript
// user-card.tsx
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
}

export function UserCard({ name, email, avatar }: UserCardProps) {
  return (
    <div className="user-card">
      {avatar && <img src={avatar} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}
```

## Estado Local

Mantenha o estado do componente o mais próximo possível de onde ele será usado.

**Exemplo:**
```typescript
// ❌ Evite - estado no componente pai quando só é usado no filho
function ParentComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div>
      <UserProfile />
      <Settings isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
}

// ✅ Prefira - estado no componente que realmente usa
function ParentComponent() {
  return (
    <div>
      <UserProfile />
      <Settings />
    </div>
  );
}

function Settings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // usa o estado aqui
}
```

## Passagem de Props

Passe propriedades de forma explícita entre componentes. Evite spread operator como `<ComponentName {...props} />`.

**Exemplo:**
```typescript
// ❌ Evite
function UserProfile(props: any) {
  return <UserCard {...props} />;
}

// ✅ Prefira
interface UserProfileProps {
  name: string;
  email: string;
  avatar: string;
}

function UserProfile({ name, email, avatar }: UserProfileProps) {
  return <UserCard name={name} email={email} avatar={avatar} />;
}
```

## Tamanho dos Componentes

Evite componentes muito grandes, acima de 300 linhas.

**Exemplo:**
```typescript
// ❌ Evite - componente monolítico
function Dashboard() {
  // 400 linhas de código
  return (
    <div>
      {/* header */}
      {/* sidebar */}
      {/* content */}
      {/* footer */}
    </div>
  );
}

// ✅ Prefira - dividir em componentes menores
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardSidebar />
      <DashboardContent />
      <DashboardFooter />
    </div>
  );
}
```

## Context API

Utilize Context API quando precisar se comunicar entre diferentes componentes filhos.

**Exemplo:**
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setUser(user);
  };
  
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## Estilização

Utilize Tailwind v4 para fazer a estilização dos componentes. Não utilize styled-components.

**Exemplo:**
```typescript
// ✅ Prefira
function Button({ children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

## Granularidade de Componentes

Evite o excesso de componentes pequenos.

**Exemplo:**
```typescript
// ❌ Evite - over-engineering
function UserName({ name }: { name: string }) {
  return <span>{name}</span>;
}

function UserEmail({ email }: { email: string }) {
  return <span>{email}</span>;
}

function UserCard({ name, email }: UserCardProps) {
  return (
    <div>
      <UserName name={name} />
      <UserEmail email={email} />
    </div>
  );
}

// ✅ Prefira - simplicidade
function UserCard({ name, email }: UserCardProps) {
  return (
    <div>
      <span>{name}</span>
      <span>{email}</span>
    </div>
  );
}
```

## Performance com useMemo

Utilize o hook `useMemo` para evitar o excesso de cálculos e interações desnecessárias entre renderizações.

**Exemplo:**
```typescript
function ProductList({ products, filter }: ProductListProps) {
  // ✅ Memoriza o resultado do filtro
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);
  
  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Nomenclatura de Hooks

Nomeie os hooks customizados com o prefixo "use", por exemplo: `useAuth`, `useLocalStorage`, `useUrl`.

**Exemplo:**
```typescript
// use-local-storage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue] as const;
}

// Uso
function MyComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
}
```

## Bibliotecas de Componentes

Utilize shadcn/ui (style: base-nova) como biblioteca de componentes do projeto. Antes de criar um componente complexo do zero, verifique se já existe um componente shadcn disponível.

**Exemplo:**
```bash
# Adicionar um componente shadcn ao projeto
bunx --bun shadcn@latest add button
bunx --bun shadcn@latest add dialog
bunx --bun shadcn@latest add data-table
```

## Testes

Crie testes automatizados para todos os componentes.

**Exemplo:**
```typescript
// user-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from './user-card';

describe('UserCard', () => {
  it('should render user information', () => {
    render(
      <UserCard 
        name="John Doe" 
        email="john@example.com" 
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('should render avatar when provided', () => {
    render(
      <UserCard 
        name="John Doe" 
        email="john@example.com"
        avatar="https://example.com/avatar.jpg"
      />
    );
    
    const avatar = screen.getByRole('img', { name: 'John Doe' });
    expect(avatar).toBeInTheDocument();
  });
});
```