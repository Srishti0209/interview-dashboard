# Frontend Engineer — TypeScript

## type vs interface: when to use each
- id: fe-ts-01
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: easy
- levels:
- tags: types, interfaces, declaration merging

### Prompt
What's the difference between `type` aliases and `interface` in TypeScript? When do you choose each, and does it matter for performance, extension or library design?

### Answer
#### What the interviewer is really testing
- Precise knowledge of **what each can and can't do** (unions, merging, extension).
- A **consistent, reasoned convention** rather than personal preference.
- Understanding **declaration merging** and its use in augmenting libraries.
- Awareness of **error messages, performance and API design** implications.

#### Key points
- Both can describe **object shapes**, and both can be extended/implemented by classes.
- **Only `type`** can express **unions**, **intersections of arbitrary types**, **primitives aliases**, **tuples**, **mapped and conditional types**, and template literal types.
- **Only `interface`** supports **declaration merging** (two declarations with the same name combine), used for augmenting globals and third-party modules.
- Extension: `interface B extends A` vs `type B = A & {...}`. `extends` reports **conflicting properties as errors**; intersections silently produce `never` for conflicts.
- Interfaces can give **slightly better compiler performance** and clearer error messages for large object hierarchies; types are needed for anything computed.
- Common convention: **interface for public object shapes/props**, **type for unions, utility compositions and everything else**, or "type everywhere unless you need merging". Consistency matters more than the choice.

#### Model answer
"For plain object shapes they're almost interchangeable, so the differences come down to features at the edges.

**Both describe objects:**
```ts
interface UserI { id: string; name: string; }
type UserT = { id: string; name: string };

const a: UserI = { id: '1', name: 'Asha' };
const b: UserT = a;     // structurally identical, so assignable
```

**Things only `type` can do:**
```ts
type Status = 'idle' | 'loading' | 'success' | 'error';          // union of literals
type Id = string | number;                                       // union of primitives
type Point = [x: number, y: number];                             // tuple
type Nullable<T> = T | null;                                     // generic alias over any type
type ReadonlyUser = Readonly<UserT>;                             // mapped/utility types
type EventName = `on${Capitalize<'click' | 'focus'>}`;           // template literal type
type ApiResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };                          // discriminated union
```
Discriminated unions alone make `type` indispensable in React apps (component states, reducer actions, API results).

**Things only `interface` can do: declaration merging**
```ts
interface Window { analytics: AnalyticsClient; }       // merges into the global Window type
window.analytics.track('signup');                       // now type-checks

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser; }               // augment a library's types
}
```
Two `interface` declarations with the same name combine. That's powerful for augmenting globals and libraries, but it can also surprise you: a duplicate name in the same scope silently merges instead of erroring.

**Extension differences:**
```ts
interface Base { id: string; }
interface Product extends Base { id: number; }          // error: 'id' types incompatible — caught early

type BaseT = { id: string };
type ProductT = BaseT & { id: number };                  // no error here...
const p: ProductT = { id: 1 };                           // ...but id is `never`, so this fails confusingly
```
`extends` checks compatibility at the declaration; intersections defer conflicts and produce `never`, which gives worse error messages.

**Performance and errors:** the TypeScript team has noted interfaces with `extends` are cached and checked faster than large intersection chains, and error messages show the interface name rather than an expanded structure. It rarely matters in small apps but can in big codebases with deep type hierarchies.

**My convention:**
- `interface` for object shapes that are part of a public API or likely to be extended (component props in a design system, library types), since `extends` gives clearer errors.
- `type` for unions, tuples, function types, mapped/conditional types and compositions.
- Many teams simply use `type` everywhere except when merging is needed; that's also fine. What matters is agreeing and enforcing it (e.g. ESLint's `consistent-type-definitions`)."

#### Another worked example: modelling component state
"For a data-fetching component I model state as a discriminated union type, which an interface can't express:
```ts
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```
This prevents impossible states like `loading: true` with `error` set at the same time, which a single interface with optional fields would allow."

#### A third worked example: augmenting a theme type
"In a styled-components project, we augmented the library's `DefaultTheme` interface so `props.theme.colors.primary` was typed everywhere:
```ts
import 'styled-components';
declare module 'styled-components' {
  export interface DefaultTheme { colors: { primary: string; surface: string }; spacing: (n: number) => string; }
}
```
This only works because DefaultTheme is an interface, allowing declaration merging."

#### Variations you might be asked
- "Can a class implement a type?": yes, if the type is an object type (not a union).
- "Can an interface extend a type?": yes, if the type is an object type.
- "What's the difference in hover/error display?": interfaces show by name; types sometimes display expanded structures, which can be noisier.

#### Step-by-step framework
1. **State the overlap** (object shapes).
2. **List type-only features** (unions, tuples, mapped, conditional).
3. **List interface-only features** (declaration merging).
4. **Explain extends vs intersection** behaviour.
5. **Mention performance/errors.**
6. **Give a convention** and enforcement.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "They're the same" | Explains real differences at the edges |
| "Interfaces are for classes" | Knows both work with classes |
| Unaware of merging | Uses merging for globals and library augmentation |
| Unaware of intersection conflicts | Explains never from conflicting intersections |
| No convention | Consistent, lint-enforced convention |

#### Useful phrases
- "For plain object shapes they're interchangeable; the differences are unions and merging."
- "Discriminated unions require a type alias."
- "Interface merging is how we augment Window or library types."
- "extends catches property conflicts; intersections hide them as never."

#### Common pitfalls
- **Accidental interface merging** from duplicate names.
- **Deep intersection chains** with confusing errors.
- **Optional-field soup** instead of discriminated unions.
- **Inconsistent usage** across a codebase.

#### Follow-ups to expect (with sample answers)
- **"Which would you use for React props?"**
  "Either works; I'd follow the team convention. For design-system components meant to be extended, interface gives cleaner extension errors."
- **"Can you add a property to a type alias later?"**
  "No, types can't be re-opened; you'd create a new type with an intersection."
- **"What does `satisfies` add?"**
  "It checks a value against a type without widening it, keeping literal types for inference."

#### What senior interviewers look for
- **Precise feature knowledge.**
- **Pragmatic, consistent conventions.**
- **Real use of merging and unions.**

#### Practise it
1. Write a discriminated union for a fetch state and a reducer action.
2. Augment `Window` with a typed global.
3. Explain extends vs intersection conflicts with an example, out loud.

## Generics with constraints, explained with real examples
- id: fe-ts-02
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: medium
- levels:
- tags: generics, constraints, inference

### Prompt
Explain generics in TypeScript. Write a few generic functions and components with constraints (`extends`), default type parameters and `keyof`, and explain how inference works. Show real frontend examples like a typed `useFetch` hook or a generic `Table` component.

### Answer
#### What the interviewer is really testing
- Understanding generics as **type parameters** that preserve relationships between inputs and outputs.
- Using **constraints** (`T extends ...`) and **`keyof`** correctly.
- How **inference** works and when explicit type arguments are needed.
- Designing **reusable, type-safe APIs** without falling back to `any`.

#### Key points
- Generics let a function or type work with **many types while keeping type information**, unlike `any`, which discards it.
- **Constraints** restrict what `T` can be (`T extends { id: string }`) so you can safely use its properties.
- **`K extends keyof T`** links a key parameter to an object type, enabling typed property access (`T[K]`).
- **Inference**: TypeScript infers type arguments from function arguments; explicit arguments are needed when nothing to infer from (e.g. `useState<User | null>(null)`).
- **Default type parameters** (`<T = unknown>`) simplify common uses.
- Avoid **unnecessary generics** (a type parameter used only once usually isn't needed).
- Real uses: data-fetching hooks, generic components (Table, Select, List), API clients, form libraries, utility functions.

#### Model answer
"Generics are type parameters: placeholders for types that callers fill in, so a function can work with many types while keeping track of how input types relate to output types.

**Why not any?**
```ts
function firstAny(arr: any[]): any { return arr[0]; }
const a = firstAny(['x']);        // any — we lost the type

function first<T>(arr: T[]): T | undefined { return arr[0]; }
const b = first(['x']);           // string | undefined — inferred from the argument
const c = first([1, 2, 3]);       // number | undefined
```

**Constraints:**
```ts
function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
byId([{ id: 'a', name: 'Asha' }]);   // Record<string, { id: string; name: string }>
byId([{ name: 'no id' }]);           // error: missing 'id'
```
`T extends { id: string }` means 'any type, as long as it has a string id', and we keep the full type (including `name`) in the result.

**keyof and indexed access:**
```ts
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
const users = [{ id: 1, name: 'Asha', active: true }];
pluck(users, 'name');     // string[]
pluck(users, 'active');   // boolean[]
pluck(users, 'email');    // error: 'email' is not a key of the user type

function sortBy<T>(items: T[], key: keyof T, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...items].sort((x, y) => (x[key] < y[key] ? -1 : x[key] > y[key] ? 1 : 0) * (dir === 'asc' ? 1 : -1));
}
```

**A typed fetch hook:**
```ts
type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(r.statusText))))
      .then((data) => setState({ status: 'success', data }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ status: 'error', error }); });
    return () => controller.abort();
  }, [url]);
  return state;
}

const orders = useFetch<Order[]>('/api/orders');
if (orders.status === 'success') orders.data.map((o) => o.total);   // typed as Order[]
```
Note: `r.json() as Promise<T>` is a trust boundary; the server could return anything. In production I'd validate with a schema (Zod) and infer `T` from it, so the type matches runtime reality.

**A generic Table component:**
```tsx
type Column<T> = {
  key: keyof T & string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type TableProps<T extends { id: string | number }> = {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
};

function Table<T extends { id: string | number }>({ rows, columns, onRowClick }: TableProps<T>) {
  return (
    <table>
      <thead><tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}>
            {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : String(row[c.key])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

<Table rows={users} columns={[{ key: 'name', header: 'Name' }, { key: 'emial', header: 'Email' }]} />
//                                                                     ^ error: typo caught at compile time
```
`onRowClick` receives the exact row type, so consumers get full autocomplete without casting.

**Inference rules worth knowing:**
- TypeScript infers `T` from arguments; when there are no arguments carrying `T` (like `useState(null)`), provide it: `useState<User | null>(null)`.
- Literal inference: `const` contexts and `<const T>` type parameters (TS 5) preserve literal types (`['a', 'b']` as readonly tuple instead of `string[]`).
- **Defaults**: `function createStore<S = Record<string, unknown>>(initial?: S)`.

**Avoiding over-engineering:** if a type parameter appears only once (`function log<T>(x: T): void`), it adds nothing over `unknown`. Generics are for expressing relationships between types."

#### Another worked example: a typed event bus
```ts
type Events = { 'cart:updated': { count: number }; 'user:loggedIn': { id: string; name: string } };

class TypedEmitter<E extends Record<string, unknown>> {
  private listeners: { [K in keyof E]?: Array<(payload: E[K]) => void> } = {};
  on<K extends keyof E>(event: K, fn: (payload: E[K]) => void) {
    (this.listeners[event] ??= []).push(fn);
    return () => { this.listeners[event] = this.listeners[event]!.filter((f) => f !== fn); };
  }
  emit<K extends keyof E>(event: K, payload: E[K]) { this.listeners[event]?.forEach((fn) => fn(payload)); }
}

const bus = new TypedEmitter<Events>();
bus.on('cart:updated', ({ count }) => console.log(count));   // count: number
bus.emit('user:loggedIn', { id: '1' });                       // error: missing 'name'
```
"Generics link the event name to its payload type, catching mismatches at compile time."

#### A third worked example: replacing any in an API client
"An API client had `get(url: string): Promise<any>`, so a renamed backend field caused runtime crashes. We changed it to `get<T>(url: string, schema: ZodType<T>): Promise<T>` validating responses with Zod. Callers got accurate types, and a contract change surfaced as a clear validation error instead of `undefined is not a function` deep in a component."

#### Variations you might be asked
- "What's the difference between `<T,>` and `<T>` in TSX?": in `.tsx` files, arrow function generics need `<T,>` or `<T extends unknown>` to avoid being parsed as JSX.
- "Generic constraints with multiple types": `<T extends A & B>` or `<T extends string | number>`.
- "How do you type a function that returns different types based on input?": overloads or conditional types.

#### Step-by-step framework
1. **Explain generics vs any.**
2. **Simple generic function** with inference.
3. **Constraints** with `extends`.
4. **keyof and indexed access types.**
5. **Real examples**: hook and component.
6. **Inference rules, defaults, and avoiding over-use.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Uses any for flexibility | Generics preserve type relationships |
| No constraints | `T extends` for safe property use |
| Can't link keys to objects | `K extends keyof T`, `T[K]` |
| Toy examples | useFetch, Table, typed emitter |
| Trusts API responses | Validates at runtime and infers types |

#### Useful phrases
- "Generics keep the relationship between what goes in and what comes out."
- "The constraint says what T must have, without losing what else it has."
- "keyof T links a key argument to the object's real properties."
- "If a type parameter only appears once, it probably shouldn't be generic."

#### Common pitfalls
- **Casting with `as T`** without validation.
- **Over-generic code** that's hard to read.
- **Forgetting explicit type args** for `useState(null)`.
- **TSX arrow function generic syntax.**

#### Follow-ups to expect (with sample answers)
- **"How do you type forwardRef with generics?"**
  "forwardRef loses generics; common workarounds are a type assertion on the exported component or, in React 19, passing ref as a regular prop."
- **"What's a const type parameter?"**
  "`function f<const T>(x: T)` infers the most specific literal type, like readonly tuples, without callers writing `as const`."
- **"Are generics erased at runtime?"**
  "Yes, types don't exist at runtime, which is why runtime validation is needed for external data."

#### What senior interviewers look for
- **Type-safe API design.**
- **Practical generic components and hooks.**
- **Respect for runtime boundaries.**

#### Practise it
1. Write `pluck`, `byId` and `sortBy` with correct generics.
2. Build the generic Table component and test that typos in keys error.
3. Explain why `as T` on fetch responses is a risk, out loud.

## Implement utility types: Partial, Pick, Omit, ReturnType
- id: fe-ts-03
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: medium
- levels:
- tags: utility types, mapped types, conditional types, infer

### Prompt
Implement your own versions of `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType` and `Parameters`. Explain mapped types, key remapping, conditional types and `infer`, and show where you'd use these utilities in a React codebase.

### Answer
#### What the interviewer is really testing
- Fluency with **mapped types** (`[K in keyof T]`) and modifiers (`?`, `-?`, `readonly`).
- **Conditional types** and **`infer`** for extracting types.
- Understanding of **`keyof`, indexed access, `Exclude`**, and distributive behaviour.
- **Practical application**: deriving types instead of duplicating them.

#### Key points
- **Mapped types** iterate over keys: `{ [K in keyof T]: T[K] }`; add or remove modifiers with `?`, `-?`, `readonly`, `-readonly`.
- **Pick** maps over a subset of keys (`K extends keyof T`); **Omit** = Pick of `Exclude<keyof T, K>`.
- **Record<K, V>** maps any key union to a value type.
- **Conditional types**: `T extends U ? X : Y`; distribute over unions when `T` is a naked type parameter.
- **`infer`** captures a type inside a pattern: `T extends (...args: any[]) => infer R ? R : never`.
- **Key remapping** with `as` (TS 4.1+) renames or filters keys while mapping, e.g. turning `name` into `getName` with a template literal type (see the Getters example below).
- Use utilities to **derive types** from a single source of truth (API types, component props).

#### Model answer
"These utilities are built from two features: mapped types (transform each property of an object type) and conditional types (choose a type based on a condition, optionally extracting part of it with `infer`).

**Mapped type utilities:**
```ts
type MyPartial<T>  = { [K in keyof T]?: T[K] };            // every property optional
type MyRequired<T> = { [K in keyof T]-?: T[K] };           // remove optionality
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type Mutable<T>    = { -readonly [K in keyof T]: T[K] };   // remove readonly

type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };

type MyExclude<T, U> = T extends U ? never : T;            // distributive over unions
type MyOmit<T, K extends PropertyKey> = MyPick<T, MyExclude<keyof T, K>>;
```
Testing them:
```ts
interface User { id: string; name: string; email?: string; readonly createdAt: Date; }

type UserPatch   = MyPartial<User>;                 // all optional — for PATCH requests
type UserPreview = MyPick<User, 'id' | 'name'>;     // { id: string; name: string }
type NewUser     = MyOmit<User, 'id' | 'createdAt'>; // fields the client sends on create
type RoleLabels  = MyRecord<'admin' | 'editor', string>;
```

**Why Exclude works (distributive conditional types):** when `T` is a union, `T extends U ? never : T` is applied to each member separately:
`MyExclude<'a' | 'b' | 'c', 'a'>` → `('a' extends 'a' ? never : 'a') | ('b' extends 'a' ? never : 'b') | ...` → `'b' | 'c'`.

**infer: ReturnType and Parameters**
```ts
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;
type MyParameters<F> = F extends (...args: infer P) => any ? P : never;
type MyAwaited<T>    = T extends PromiseLike<infer U> ? MyAwaited<U> : T;   // recursive unwrap

async function fetchUser(id: string, includeOrders = false) { return { id, name: 'Asha', orders: [] as Order[] }; }

type FetchUserArgs = MyParameters<typeof fetchUser>;               // [id: string, includeOrders?: boolean]
type FetchedUser   = MyAwaited<MyReturnType<typeof fetchUser>>;    // { id: string; name: string; orders: Order[] }
```
`infer R` means 'whatever type is in this position, capture it as R'.

**Key remapping and template literals:**
```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] };
type UserGetters = Getters<Pick<User, 'name' | 'email'>>;
// { getName: () => string; getEmail: () => string | undefined }

type OmitByValue<T, V> = { [K in keyof T as T[K] extends V ? never : K]: T[K] };  // filter keys by value type
type NonFunctionProps<T> = OmitByValue<T, Function>;
```

**Where I use these in React code:**
```tsx
// Extend native element props without retyping them
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & { variant?: 'primary' | 'ghost' };

// Wrapper component that passes through most props of another component
type CardProps = Omit<React.ComponentProps<typeof Panel>, 'title'> & { heading: string };

// Form state derived from an API type
type FormValues = Required<Pick<User, 'name' | 'email'>>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

// Infer the type a hook returns, to type props that receive it
type CartApi = ReturnType<typeof useCart>;
```
The principle: define a type once (often from an API schema) and derive variants, so changes propagate everywhere and nothing drifts."

#### Another worked example: deriving types from a Zod schema
```ts
const orderSchema = z.object({ id: z.string(), total: z.number(), status: z.enum(['pending', 'paid']) });
type Order = z.infer<typeof orderSchema>;
type OrderStatus = Order['status'];                 // 'pending' | 'paid'
type OrderSummary = Pick<Order, 'id' | 'status'>;
```
"One schema gives runtime validation and all the static types; utility types derive the variants the UI needs."

#### A third worked example: a DeepPartial for test factories
```ts
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

function buildUser(overrides: DeepPartial<User> = {}): User {
  return merge(defaultUser, overrides);
}
buildUser({ name: 'Ben' });   // tests override only what they care about
```
"Recursive mapped types make test data factories flexible and still type-checked."

#### Variations you might be asked
- "Implement `NonNullable`": `T extends null | undefined ? never : T`.
- "Implement `Extract`": `T extends U ? T : never`.
- "Prevent distribution": wrap in a tuple: `[T] extends [U] ? X : Y`.
- "Why does Omit accept any key, not just keyof T?": the built-in Omit uses `K extends keyof any` for flexibility; a stricter version uses `K extends keyof T` to catch typos.

#### Step-by-step framework
1. **Explain mapped types** and modifiers.
2. **Implement Partial/Required/Readonly/Pick/Record.**
3. **Explain conditional types** and distribution; implement Exclude and Omit.
4. **Use infer** for ReturnType, Parameters, Awaited.
5. **Show key remapping.**
6. **Apply to React and schema-derived types.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Only uses built-ins | Implements them and explains mechanics |
| Doesn't know `-?` / `-readonly` | Uses modifier removal |
| Can't explain Exclude | Explains distributive conditional types |
| Unaware of infer | ReturnType, Parameters, Awaited with infer |
| Duplicates types | Derives types from one source of truth |

#### Useful phrases
- "Mapped types transform every property; conditional types choose between types."
- "infer captures the type in that position of the pattern."
- "Exclude works because conditional types distribute over unions."
- "I derive form and request types from the API type instead of duplicating them."

#### Common pitfalls
- **Duplicating types** that drift.
- **Overly clever types** that hurt readability and compile times.
- **Loose Omit** hiding typos.
- **Forgetting distribution** behaviour.

#### Follow-ups to expect (with sample answers)
- **"What's `keyof any`?"**
  "`string | number | symbol`, all valid property key types (also written `PropertyKey`)."
- **"How do you debug a complex type?"**
  "Hover in the editor, break it into named intermediate types, and use helper types like `type Expand<T> = { [K in keyof T]: T[K] }` to show the resolved shape."
- **"When are complex types a bad idea?"**
  "When they slow the compiler or nobody on the team can maintain them; simpler explicit types are often better for application code."

#### What senior interviewers look for
- **Deep type-system fluency.**
- **Practical derivation habits.**
- **Restraint** on complexity.

#### Practise it
1. Implement the eight utilities from memory and test them on a User type.
2. Write `Getters<T>` with key remapping.
3. Explain distributive conditional types with Exclude, out loud.

## Narrowing, discriminated unions and exhaustive checks
- id: fe-ts-04
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: medium
- levels:
- tags: narrowing, discriminated unions, type guards, never

### Prompt
How does type narrowing work in TypeScript? Cover `typeof`, `instanceof`, `in`, equality checks, custom type guards, assertion functions and discriminated unions, and show how to make a `switch` exhaustive with `never`. Use a reducer or component state as an example.

### Answer
#### What the interviewer is really testing
- Understanding **control-flow analysis**: how TypeScript refines types after checks.
- Using **discriminated unions** to model states and actions safely.
- Writing **custom type guards** and **assertion functions** correctly.
- **Exhaustiveness checking** so new cases can't be forgotten.

#### Key points
- **Narrowing**: after a runtime check, TypeScript knows a more specific type within that branch.
- Built-in guards: `typeof x === 'string'`, `x instanceof Date`, `'prop' in x`, `x === null`, truthiness, `Array.isArray`.
- **Discriminated unions**: each member has a common literal property (`type`, `status`, `kind`); checking it narrows to that member.
- **Custom type guards**: `function isUser(x: unknown): x is User`; must be correct, since TypeScript trusts them.
- **Assertion functions**: `function assert(cond: unknown, msg?): asserts cond` narrows after the call.
- **Exhaustiveness**: in the `default` branch, assign to `never`; adding a new union member then causes a compile error.
- Model UI state with unions to **make impossible states unrepresentable**.

#### Model answer
"Narrowing is TypeScript following your runtime checks: inside an `if`, it refines a variable's type based on the condition.

**Built-in narrowing:**
```ts
function format(value: string | number | Date | null) {
  if (value === null) return '—';                     // null removed below
  if (typeof value === 'string') return value.trim(); // string
  if (typeof value === 'number') return value.toFixed(2);
  return value.toLocaleDateString();                  // only Date remains
}

function area(shape: { radius: number } | { width: number; height: number }) {
  if ('radius' in shape) return Math.PI * shape.radius ** 2;   // `in` narrowing
  return shape.width * shape.height;
}
```

**Discriminated unions: the core pattern for UI state.**
```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; retry: () => void };

function OrdersView({ state }: { state: RequestState<Order[]> }) {
  switch (state.status) {
    case 'idle':    return <p>Choose a date range</p>;
    case 'loading': return <Spinner />;
    case 'success': return <OrderList orders={state.data} />;       // data available only here
    case 'error':   return <ErrorBox message={state.error} onRetry={state.retry} />;
    default:        return assertNever(state);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```
Compare with the 'bag of booleans' approach (`{ isLoading: boolean; error?: string; data?: Order[] }`), which allows nonsense combinations like `isLoading: true` with `error` and `data` all set. The union makes impossible states unrepresentable.

**Exhaustiveness checking.** If someone adds `| { status: 'empty' }`, the `default` branch now receives `{ status: 'empty' }`, which isn't assignable to `never`, so compilation fails, pointing at every switch that needs updating. Alternatively, `satisfies never` or a `Record<Status, ...>` mapping object achieves the same.

**Reducers:**
```ts
type Action =
  | { type: 'added'; item: CartItem }
  | { type: 'removed'; id: string }
  | { type: 'quantityChanged'; id: string; quantity: number }
  | { type: 'cleared' };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'added':           return [...state, action.item];
    case 'removed':         return state.filter((i) => i.id !== action.id);
    case 'quantityChanged': return state.map((i) => (i.id === action.id ? { ...i, quantity: action.quantity } : i));
    case 'cleared':         return [];
    default:                return assertNever(action);
  }
}
```
Each case sees only its own payload fields; dispatching `{ type: 'removed' }` without an `id` is a compile error.

**Custom type guards:**
```ts
interface ApiError { code: string; message: string }

function isApiError(x: unknown): x is ApiError {
  return typeof x === 'object' && x !== null
    && typeof (x as Record<string, unknown>).code === 'string'
    && typeof (x as Record<string, unknown>).message === 'string';
}

try { await save(); }
catch (err) {                      // err is unknown
  if (isApiError(err)) showToast(err.message);
  else if (err instanceof Error) report(err);
}
```
TypeScript trusts the `x is ApiError` claim, so a wrong guard creates unsound types. For complex data, schema validation (Zod's `safeParse`) is a more reliable guard.

**Assertion functions:**
```ts
function assertDefined<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value == null) throw new Error(message);
}
const el = document.getElementById('root');
assertDefined(el, 'Root element missing');
el.appendChild(child);              // el is HTMLElement here, no `!` needed
```

**Narrowing gotchas:**
- Narrowing doesn't survive **callbacks** for `let` variables that might change (TS can't know when the callback runs); use `const` or re-check.
- Truthiness narrowing removes `0` and `''` too.
- Array `filter` needs a type predicate to narrow element types: `items.filter((x): x is Item => x != null)` (TS 5.5 infers simple predicates automatically)."

#### Another worked example: replacing boolean flags in a checkout
"A checkout component had `isSubmitting`, `isSuccess`, `error`, and `orderId` as separate state variables, and a bug showed the success screen with an error banner. We replaced them with a union (`idle | submitting | succeeded { orderId } | failed { error }`) and a reducer with exhaustive switching. The bug class disappeared, and adding a new 'requires 3-D Secure' state produced compile errors in every component that needed to handle it."

#### A third worked example: narrowing API responses
"Our API returned `{ ok: true, data } | { ok: false, error }`. Typing it as a discriminated union on `ok` meant callers couldn't access `data` without checking `ok` first, eliminating 'cannot read property of undefined' crashes in error paths."

#### Variations you might be asked
- "What's the difference between `x is T` and `asserts x is T`?": the first returns a boolean used in conditions; the second throws if false and narrows after the call.
- "How do you narrow `unknown` from JSON?": runtime validation (schema or guards).
- "Can you discriminate on non-literal properties?": the discriminant must be a literal type (string, number, boolean literal) for reliable narrowing.

#### Step-by-step framework
1. **Explain control-flow narrowing.**
2. **Show built-in guards.**
3. **Model state with discriminated unions.**
4. **Add exhaustiveness with never.**
5. **Custom guards and assertion functions**, with soundness caveats.
6. **Gotchas** and real refactors.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Uses `as` casts everywhere | Narrows with checks |
| Boolean flags for state | Discriminated unions |
| No exhaustiveness | assertNever / satisfies never |
| Unsound custom guards | Careful guards or schema validation |
| Unaware of callback narrowing loss | Knows the gotchas |

#### Useful phrases
- "TypeScript narrows types based on the checks I write."
- "A discriminated union makes impossible states unrepresentable."
- "assertNever turns a forgotten case into a compile error."
- "A type guard is a promise to the compiler, so it must be correct."

#### Common pitfalls
- **`as` instead of narrowing.**
- **Optional-field state soup.**
- **Incorrect type predicates.**
- **Missing exhaustiveness** on growing unions.

#### Follow-ups to expect (with sample answers)
- **"How does `satisfies` help with exhaustiveness?"**
  "`const labels = { idle: 'Idle', loading: 'Loading' } satisfies Record<Status, string>` errors if a status is missing, while keeping literal types."
- **"Why is err `unknown` in catch?"**
  "Anything can be thrown, so TS (with `useUnknownInCatchVariables`) forces you to narrow before use."
- **"How do you narrow in JSX?"**
  "Early returns or switch statements in the component body; inline conditionals with `&&` also narrow within the expression."

#### What senior interviewers look for
- **State modelling skill.**
- **Compile-time safety habits.**
- **Soundness awareness.**

#### Practise it
1. Rewrite a component with boolean flags into a discriminated union with exhaustive switch.
2. Write `isApiError` and an `assertDefined` assertion function.
3. Explain 'impossible states unrepresentable', out loud.

## any vs unknown vs never
- id: fe-ts-05
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: easy
- levels:
- tags: any, unknown, never, type safety

### Prompt
Explain the differences between `any`, `unknown` and `never`. When would you use each, how do you migrate code away from `any`, and where does `never` show up naturally?

### Answer
#### What the interviewer is really testing
- Understanding the **top and bottom types** of TypeScript's type system.
- Why **`any` disables type checking** and spreads unsafety.
- Using **`unknown`** for untrusted data with proper narrowing.
- Recognising **`never`** in exhaustiveness checks, impossible branches, and conditional types.

#### Key points
- **`any`**: opts out of type checking; any value is assignable to it and it's assignable to anything; any operation is allowed. It's **contagious**: values derived from `any` are `any`.
- **`unknown`**: the safe top type; any value can be assigned to it, but you **must narrow** before using it. Use for external data (JSON, errors, postMessage, localStorage).
- **`never`**: the bottom type; no value has it. Appears for functions that **never return** (throw, infinite loop), **exhausted unions**, impossible intersections, and filtering in conditional types.
- `catch (err)` is `unknown` with `useUnknownInCatchVariables` (part of `strict`).
- Migrating away from any: enable `noImplicitAny`, use `unknown` at boundaries, validate with schemas, use lint rules (`no-explicit-any`, `no-unsafe-*`), and track any counts.
- Legitimate `any`: rare escape hatches (third-party typing gaps), ideally isolated and commented.

#### Model answer
"These three are the edges of the type system: `any` switches type checking off, `unknown` is 'could be anything, prove it before using', and `never` is 'this can't happen'.

**any: an escape hatch that spreads**
```ts
const data: any = JSON.parse(input);
data.user.name.toUpperCase();        // compiles, crashes at runtime if user is missing
const total: number = data.total;    // any assigns to number silently
const derived = data.items.map((x) => x.price);  // derived is any — unsafety spreads
```
TypeScript can't help with anything that touches `any`, and it silently infects variables derived from it.

**unknown: safe for untrusted values**
```ts
const raw: unknown = JSON.parse(input);
raw.user;                            // error: 'raw' is of type 'unknown'

if (typeof raw === 'object' && raw !== null && 'user' in raw) {
  // narrowed enough to access raw.user (as unknown) — keep narrowing
}

// Better: validate with a schema
const UserResponse = z.object({ user: z.object({ name: z.string() }) });
const parsed = UserResponse.safeParse(raw);
if (parsed.success) parsed.data.user.name.toUpperCase();   // fully typed
```
Where I use `unknown`: API responses before validation, `catch` errors, `localStorage` values, `postMessage` events, function parameters that accept anything (like a logger), and generic defaults.

**never: the impossible type**
```ts
function fail(message: string): never {      // never returns normally
  throw new Error(message);
}

type Shape = { kind: 'circle'; r: number } | { kind: 'square'; size: number };
function area(s: Shape) {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.size ** 2;
    default: {
      const unreachable: never = s;           // compile error if a new kind is added
      return unreachable;
    }
  }
}

type A = string & number;                     // never — no value is both
type NonString<T> = T extends string ? never : T;   // never removes members from unions
type R = NonString<'a' | 1 | true>;          // 1 | true
```

**Assignability summary:**
| | any | unknown | never |
|---|---|---|---|
| Can receive any value | Yes | Yes | No |
| Assignable to other types | Yes (unsafely) | Only to unknown/any | Yes (to everything) |
| Operations allowed | All | None until narrowed | None (no values exist) |
| Use for | Escape hatch | Untrusted data | Impossible states, exhaustiveness |

**Migrating away from any in a codebase:**
1. Turn on `strict` (including `noImplicitAny` and `useUnknownInCatchVariables`), possibly file by file.
2. Replace `any` at **boundaries** (API, storage, events) with `unknown` + validation.
3. Add lint rules: `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`.
4. Track `any` count in CI (e.g. `type-coverage`) and require it not to increase.
5. For third-party gaps, write narrow local type declarations instead of `any`.
6. Where `any` truly remains, isolate and comment it (`// eslint-disable-next-line ... reason`).

**Related:** `object` (any non-primitive), `{}` (any non-null value, surprisingly broad), and `void` (function returns nothing useful)."

#### Another worked example: a crash hidden by any
"A notifications component received `props.payload: any` from a WebSocket handler. When the backend renamed `message` to `body`, TypeScript didn't complain and production rendered 'undefined' for every notification. Typing the WebSocket message as `unknown`, validating it with a Zod discriminated union per event type, and logging validation failures made the next backend change surface immediately in monitoring instead of in users' screens."

#### A third worked example: using never to enforce config completeness
```ts
type Locale = 'en' | 'fr' | 'de';
const labels: Record<Locale, string> = { en: 'Save', fr: 'Enregistrer', de: 'Speichern' };
```
"Adding `'es'` to Locale makes this object fail to compile until a Spanish label is added; under the hood, a missing key error comes from the same exhaustiveness idea."

#### Variations you might be asked
- "What's the difference between unknown and {}?": `{}` accepts any non-null/undefined value and allows nothing specific; `unknown` also accepts null/undefined.
- "When is any acceptable?": very rarely, for unavoidable interop or gradual migration, kept local and documented.
- "What does a function returning void vs never mean?": void returns (with no meaningful value); never doesn't return at all.

#### Step-by-step framework
1. **Define each type.**
2. **Show the danger of any** (no checks, contagion).
3. **Show unknown with narrowing/validation.**
4. **Show never** in functions, exhaustiveness and conditional types.
5. **Summarise assignability.**
6. **Migration strategy** from any.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "unknown is like any" | unknown requires narrowing |
| Uses any for API data | unknown + schema validation |
| Doesn't know where never appears | Exhaustiveness, throw functions, conditional types |
| No migration plan | Strict mode, lint rules, coverage tracking |
| any everywhere "temporarily" | Isolated, documented escape hatches |

#### Useful phrases
- "any turns off the type checker, and it spreads."
- "unknown means: prove what it is before you use it."
- "never is the type of things that can't happen."
- "I validate external data at the boundary and keep the rest of the app strongly typed."

#### Common pitfalls
- **any at API boundaries.**
- **Casting unknown with `as`** instead of validating.
- **Ignoring catch variable types.**
- **Disabling lint rules broadly.**

#### Follow-ups to expect (with sample answers)
- **"How do you type an error in catch?"**
  "It's unknown; narrow with `instanceof Error` or a type guard before using properties."
- **"What happens when you assign never to a variable?"**
  "Anything accepts never, but you can only get a never value from unreachable code."
- **"Is `as unknown as T` ever OK?"**
  "It's a double cast that bypasses checks; acceptable only in tightly controlled spots like test mocks, never for real data."

#### What senior interviewers look for
- **Type-safety discipline.**
- **Boundary validation practice.**
- **Practical migration experience.**

#### Practise it
1. Convert an any-typed API call to unknown plus Zod validation.
2. Write an exhaustive switch with a never check.
3. Explain any vs unknown in 30 seconds, out loud.

## Typing React components, props, events and hooks
- id: fe-ts-06
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: medium
- levels:
- tags: React, TypeScript, props, events, hooks

### Prompt
How do you type React components with TypeScript? Cover props (including children and native element props), event handlers, `useState`, `useReducer`, `useRef`, context, custom hooks, generic components and polymorphic `as` props. What patterns do you avoid?

### Answer
#### What the interviewer is really testing
- Practical, idiomatic **React + TypeScript** patterns.
- Correct types for **events, refs and state** (common stumbling blocks).
- **Reusable component typing**: extending native props, generics, polymorphism.
- Avoiding **anti-patterns** (`React.FC` debates, `any` events, over-loose children).

#### Key points
- Type props with a `type`/`interface` and annotate the function parameter; return type is inferred.
- **children**: `React.ReactNode` for anything renderable; more specific types when needed.
- **Extend native props**: `React.ComponentPropsWithoutRef<'button'>` (or `WithRef`) so wrappers accept all standard attributes.
- **Events**: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`, `React.MouseEvent<HTMLButtonElement>`; or type the handler prop as `React.ChangeEventHandler<HTMLInputElement>`.
- **useState**: inferred from initial value; provide a type for unions/null (`useState<User | null>(null)`).
- **useRef**: DOM refs `useRef<HTMLInputElement>(null)`; mutable values `useRef<number>()`.
- **useReducer** with discriminated union actions.
- **Context**: typed with `createContext<T | null>(null)` and a hook that throws if missing.
- **Custom hooks**: return objects (or `as const` tuples) for good inference.
- **Generic components** (Select, Table) and **polymorphic** components (`as` prop) for design systems.

#### Model answer
"I aim for components that are fully typed with minimal annotations, relying on inference where it's accurate.

**Props and children:**
```tsx
type AlertProps = {
  variant?: 'info' | 'warning' | 'error';
  title: string;
  children?: React.ReactNode;           // anything renderable
  onDismiss?: () => void;
};

function Alert({ variant = 'info', title, children, onDismiss }: AlertProps) {
  return (
    <div role="alert" className={`alert alert-${variant}`}>
      <strong>{title}</strong>
      {children}
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss">×</button>}
    </div>
  );
}
```
I usually avoid `React.FC`: it used to add implicit children and makes generics awkward; a plain function with typed props is clearer.

**Extending native element props:**
```tsx
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

function Button({ variant = 'primary', loading, disabled, children, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || loading} data-variant={variant} aria-busy={loading}>
      {children}
    </button>
  );
}
<Button type="submit" onClick={save} aria-describedby="hint">Save</Button>   // all native props allowed
```
In React 19, `ref` is a regular prop for function components, so `ComponentPropsWithRef<'button'>` works without `forwardRef`.

**Events:**
```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSearch(value); };
  return (
    <form onSubmit={handleSubmit}>
      <input value={value} onChange={handleChange} />
    </form>
  );
}
```
Inline handlers (`onChange={(e) => ...}`) are inferred automatically; explicit types are needed only for handlers defined separately.

**State, refs and reducers:**
```tsx
const [user, setUser] = useState<User | null>(null);        // union needs explicit type
const [count, setCount] = useState(0);                       // inferred number

const inputRef = useRef<HTMLInputElement>(null);             // DOM ref
inputRef.current?.focus();
const timerRef = useRef<ReturnType<typeof setTimeout>>();    // mutable value ref

type State = { items: Item[]; filter: 'all' | 'done' };
type Action = { type: 'add'; item: Item } | { type: 'setFilter'; filter: State['filter'] };
const [state, dispatch] = useReducer(reducer, { items: [], filter: 'all' });
dispatch({ type: 'setFilter', filter: 'done' });             // payload checked per action
```

**Context with a safe hook:**
```tsx
type AuthContextValue = { user: User | null; signIn: (email: string) => Promise<void>; signOut: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;                       // non-null from here on
}
```
This avoids fake default values and gives a clear error if the provider is missing.

**Custom hooks:**
```ts
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;     // tuple types preserved: [boolean, () => void]
}
```
Without `as const`, the return type would be `(boolean | (() => void))[]`.

**Generic components:**
```tsx
type SelectProps<T> = {
  options: T[];
  value: T | null;
  getLabel: (o: T) => string;
  getKey: (o: T) => string;
  onChange: (o: T) => void;
};
function Select<T>({ options, value, getLabel, getKey, onChange }: SelectProps<T>) {
  return (
    <select value={value ? getKey(value) : ''} onChange={(e) => onChange(options.find((o) => getKey(o) === e.target.value)!)}>
      {options.map((o) => <option key={getKey(o)} value={getKey(o)}>{getLabel(o)}</option>)}
    </select>
  );
}
<Select options={countries} value={country} getLabel={(c) => c.name} getKey={(c) => c.code} onChange={setCountry} />
```
`onChange` receives the exact option type (`Country`).

**Polymorphic components (design systems):**
```tsx
type TextProps<C extends React.ElementType> = {
  as?: C;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'children'>;

function Text<C extends React.ElementType = 'span'>({ as, children, ...rest }: TextProps<C>) {
  const Component = as ?? 'span';
  return <Component {...rest}>{children}</Component>;
}
<Text as="a" href="/docs">Docs</Text>     // href allowed because as="a"
<Text as="label" htmlFor="email">Email</Text>
```

**Patterns I avoid:** `any` for events or props; `!` non-null assertions to silence errors (prefer narrowing); prop types that duplicate API types (derive with `Pick`); huge prop interfaces (split components); `as` casts on context defaults."

#### Another worked example: a typed form field component
"Our design system's `TextField` extended `ComponentPropsWithoutRef<'input'>` minus `size` (which conflicted with our size prop), added `label`, `error` and `hint`, and wired `aria-describedby` automatically. Because all native input props passed through with correct types, teams used it for every input type without escape hatches, and TypeScript caught misuse like passing `onChange={(v: string) => ...}` instead of an event handler."

#### A third worked example: fixing a ref type error
"A developer typed `useRef<HTMLDivElement>()` and got 'Type MutableRefObject is not assignable to LegacyRef' when passing it to a div. Initialising with `null` (`useRef<HTMLDivElement>(null)`) creates the read-only RefObject type React expects for DOM refs. This is one of the most common React+TS questions."

#### Variations you might be asked
- "How do you type `forwardRef` components (pre-React 19)?": `forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => ...)`.
- "How do you type a component that accepts another component as a prop?": `React.ComponentType<Props>` or `React.ElementType`.
- "How do you type children as a render function?": `children: (state: State) => React.ReactNode`.

#### Step-by-step framework
1. **Props and children.**
2. **Extend native props.**
3. **Events and handlers.**
4. **State, refs, reducers.**
5. **Context and custom hooks.**
6. **Generic and polymorphic components**; anti-patterns.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `any` for events | Correct React event types |
| Re-declares button props manually | ComponentPropsWithoutRef |
| Context default `{} as Ctx` | Null default + throwing hook |
| Hook returns untyped array | `as const` tuples or objects |
| No generics/polymorphism | Generic Select, polymorphic Text |

#### Useful phrases
- "I extend native element props so wrappers accept every standard attribute."
- "DOM refs start as null, which gives the right ref type."
- "My context hook throws if the provider is missing, so consumers never handle null."
- "Generic components pass the exact item type back to callbacks."

#### Common pitfalls
- **Overusing `!`.**
- **Prop conflicts** when extending native props (e.g. `size`, `onChange`).
- **Losing generics** with React.FC or forwardRef.
- **Duplicated types** for API data.

#### Follow-ups to expect (with sample answers)
- **"ReactNode vs ReactElement vs JSX.Element?"**
  "ReactNode is anything renderable (strings, numbers, null, elements, arrays); ReactElement/JSX.Element is a single element object. Use ReactNode for children."
- **"How do you type default props?"**
  "With default values in destructuring; TypeScript infers the prop as optional with the default applied inside."
- **"How do you type a hook that wraps fetch?"**
  "Generic over the data type, ideally validated with a schema, returning a discriminated union or TanStack Query's typed result."

#### What senior interviewers look for
- **Idiomatic, inference-friendly typing.**
- **Design-system-level patterns.**
- **Avoidance of unsafe shortcuts.**

#### Practise it
1. Build Button and TextField wrappers extending native props.
2. Create a typed context with a throwing hook.
3. Build the generic Select and polymorphic Text, and explain them out loud.

## Conditional, mapped and template literal types
- id: fe-ts-07
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: hard
- levels: senior, staff
- tags: conditional types, mapped types, template literal types, type-level programming

### Prompt
Explain conditional types, mapped types with key remapping, and template literal types. Build a few practical type utilities, such as typed route parameters from a path string, typed event handler names, and a deep readonly type. When does advanced type-level code help, and when does it hurt?

### Answer
#### What the interviewer is really testing
- Fluency with **advanced type features** and how they combine.
- Building **practical utilities** that catch real bugs (routes, events, configs).
- Understanding **recursion, distribution and inference** at the type level.
- **Judgement**: maintainability, compile-time cost, and error message quality.

#### Key points
- **Conditional types** choose a type: `T extends U ? X : Y`; with `infer` they extract parts of types; they **distribute over unions** when T is a bare type parameter.
- **Mapped types** transform properties of an object type; **key remapping** (`as`) renames or filters keys.
- **Template literal types** build string literal types from other literals; combined with `infer` they can **parse strings** at the type level.
- **Recursive types** handle nested structures (DeepReadonly, DeepPartial, path strings) but have depth limits and compile costs.
- Libraries rely on these features: React Router and TanStack Router (typed params), tRPC, Zod, Prisma, i18n libraries.
- Use advanced types in **shared libraries and boundaries** where they prevent many bugs; prefer simple explicit types in application code.

#### Model answer
"These features let types be computed from other types. Used well, they remove whole classes of bugs, like misspelled route params or event names; used badly, they produce unreadable code and cryptic errors.

**Conditional types and infer:**
```ts
type ElementType<T> = T extends readonly (infer U)[] ? U : T;
type A = ElementType<string[]>;           // string
type B = ElementType<number>;             // number

type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;
type C = UnwrapPromise<Promise<Promise<User>>>;   // User

// Distribution: applied to each union member
type ToArray<T> = T extends unknown ? T[] : never;
type D = ToArray<string | number>;        // string[] | number[]
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type E = ToArrayNonDist<string | number>; // (string | number)[]
```

**Mapped types with key remapping:**
```ts
type EventHandlers<Events extends Record<string, unknown>> = {
  [K in keyof Events & string as `on${Capitalize<K>}`]?: (payload: Events[K]) => void;
};
type PlayerEvents = { play: { at: number }; pause: { at: number }; ended: void };
type PlayerProps = EventHandlers<PlayerEvents>;
// { onPlay?: (p: { at: number }) => void; onPause?: ...; onEnded?: (p: void) => void }

type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type StringFields = PickByValue<{ id: number; name: string; email: string }, string>;  // { name; email }
```

**Template literal types:**
```ts
type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'secondary';
type ButtonClass = `btn-${Variant}-${Size}`;   // 6 combinations, typo-proof

type CssVar = `--${string}`;
const style: Record<CssVar, string> = { '--brand': '#0af' };   // must start with --
```

**Parsing route params from a path string:**
```ts
type RouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

function buildPath<P extends string>(path: P, params: RouteParams<P>): string {
  return path.replace(/:(\w+)/g, (_, key) => encodeURIComponent((params as Record<string, string>)[key]));
}

buildPath('/users/:userId/orders/:orderId', { userId: '42', orderId: '7' });   // OK
buildPath('/users/:userId/orders/:orderId', { userId: '42' });                 // error: orderId missing
```
This is the same idea typed routers use: the path string itself defines which params are required.

**Deep readonly and dot paths:**
```ts
type DeepReadonly<T> =
  T extends (...args: any[]) => any ? T
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

type Paths<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object ? K | `${K}.${Paths<T[K]>}` : K }[keyof T & string]
  : never;

type Settings = { theme: { mode: 'dark' | 'light'; accent: string }; locale: string };
type SettingPath = Paths<Settings>;   // 'theme' | 'theme.mode' | 'theme.accent' | 'locale'
function getSetting(path: SettingPath) { /* ... */ }
getSetting('theme.mod');              // error: typo caught
```
Typed translation keys (`t('checkout.payment.title')`) use this pattern.

**When it helps:**
- **Shared libraries and design systems**: typed routes, event props, theme tokens, i18n keys, form field paths, used by many developers.
- **Boundaries** where a typo would otherwise be a silent runtime bug.
- Deriving types from a single source of truth (schemas, configs).

**When it hurts:**
- **Readability**: few teammates can maintain deeply recursive types.
- **Error messages** become huge and confusing.
- **Compile time and editor performance**: recursive types over large unions can slow the language server dramatically or hit 'type instantiation is excessively deep'.
- **Over-engineering** application code where a simple explicit type would do.

My rule: advanced types belong in a small, well-tested `types` module or library layer with type tests (`expectTypeOf` in Vitest, or `tsd`), while feature code consumes simple, well-named types."

#### Another worked example: typed design tokens
"A design system had spacing tokens like `space-1`…`space-8` and colour tokens per theme. We generated a `TokenName` union from the tokens JSON and built CSS variable names with template literal types (`var(--${TokenName})`) so components couldn't reference tokens that didn't exist. A removed token now caused compile errors in every component using it, instead of silently falling back to browser defaults."

#### A third worked example: an advanced type that was removed
"A teammate wrote a 120-line recursive type to infer API response shapes from URL strings. It slowed the editor noticeably (autocomplete took seconds) and produced 40-line error messages. We replaced it with generated types from the OpenAPI spec (a simple `paths[Url]['get']['responses']['200']` lookup), which was faster and easier to understand. Choosing generated types over clever types was the better engineering decision."

#### Variations you might be asked
- "How do you test types?": `expectTypeOf<RouteParams<'/a/:id'>>().toEqualTypeOf<{ id: string }>()` in Vitest, or `// @ts-expect-error` lines in a type test file.
- "What's the recursion limit?": TypeScript limits instantiation depth (around 50 levels for some recursive aliases, with tail-recursion optimisation for conditional types); deep recursion should be avoided.
- "Uppercase, Lowercase, Capitalize, Uncapitalize?": built-in intrinsic string manipulation types used with template literals.

#### Step-by-step framework
1. **Explain conditional types**, infer and distribution.
2. **Explain mapped types** with remapping.
3. **Explain template literal types.**
4. **Build practical utilities** (route params, event handlers, paths).
5. **Discuss testing types.**
6. **Weigh benefits vs costs**, and where to keep such code.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Can't explain infer | Uses infer to extract and parse |
| Toy examples | Routes, event props, setting paths, tokens |
| Unaware of distribution | Explains and controls it |
| Advanced types everywhere | Confined to libraries with type tests |
| Ignores compile cost | Mentions editor performance and depth limits |

#### Useful phrases
- "Template literal types let the path string define the required params."
- "Conditional types distribute over unions unless I wrap them in a tuple."
- "I keep clever types in one tested module and expose simple names."
- "If a type slows the editor, it's costing more than it saves."

#### Common pitfalls
- **Unreadable recursive types.**
- **Huge unions** causing slow checks.
- **No type tests** for complex utilities.
- **Using types where generated types would be simpler.**

#### Follow-ups to expect (with sample answers)
- **"How do typed routers do this?"**
  "They parse path patterns with template literal types and infer params, and some generate route types from the file system."
- **"How do you improve error messages for complex types?"**
  "Break types into named steps, use branded or constrained generic parameters, and provide helper functions with simpler signatures."
- **"What's a branded type?"**
  "A primitive intersected with a unique tag (`string & { __brand: 'UserId' }`) so different IDs can't be mixed up."

#### What senior interviewers look for
- **Deep type fluency.**
- **Practical bug-preventing utilities.**
- **Maintainability judgement.**

#### Practise it
1. Implement RouteParams and test it with expectTypeOf.
2. Build EventHandlers from an events map for a component.
3. Explain when you'd refuse an advanced type in code review, out loud.

## Declaration files, module augmentation and typing third-party code
- id: fe-ts-08
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: medium
- levels:
- tags: declaration files, d.ts, module augmentation, ambient types

### Prompt
What are `.d.ts` declaration files? How do you add types for an untyped npm package, a global script (like an analytics snippet), environment variables, or non-code imports (SVG, CSS modules)? How does module augmentation work, and how do you publish types for your own library?

### Answer
#### What the interviewer is really testing
- Understanding **declarations vs implementations** and **ambient** types.
- Practical skills: typing **untyped packages, globals, env vars, asset imports**.
- **Module augmentation and global augmentation** syntax.
- Publishing and consuming types: **DefinitelyTyped (@types)**, `types` field, `exports` with types.

#### Key points
- A **`.d.ts` file** contains only type information (no runtime code); it describes the shape of JavaScript that exists elsewhere.
- Types for packages come from: the package itself (`types`/`exports` in package.json), **@types/** packages (DefinitelyTyped), or your own declarations.
- **`declare module 'pkg'`** in a `.d.ts` gives types to an untyped module; a shorthand `declare module 'pkg';` makes it `any` (quick but unsafe).
- **Wildcard modules** type asset imports: `declare module '*.svg' { ... }`.
- **Global augmentation**: `declare global { interface Window { ... } }` inside a module file.
- **Module augmentation**: `declare module 'library' { interface X { ... } }` to add fields to a library's types (e.g. Express Request, theme types, router meta).
- **Env vars** (Vite): augment `ImportMetaEnv`; (Node/Next): augment `NodeJS.ProcessEnv`.
- Make sure declaration files are **included** by tsconfig (`include`, `typeRoots`).
- Library authors: emit `.d.ts` with `declaration: true` (or a bundler like tsup), point `types` in `exports`.

#### Model answer
"A declaration file tells TypeScript about the shape of code it can't see or that has no types, without containing any runtime code itself.

**1. An untyped npm package.** First check for `@types/package-name`. If none exists, write a minimal declaration for what we use:
```ts
// src/types/legacy-charts.d.ts
declare module 'legacy-charts' {
  export interface ChartOptions {
    type: 'line' | 'bar';
    data: Array<{ x: number | string; y: number }>;
    animate?: boolean;
  }
  export function createChart(el: HTMLElement, options: ChartOptions): { destroy(): void; update(data: ChartOptions['data']): void };
}
```
I type only the API surface we use, more precisely than `any`, and can contribute it to DefinitelyTyped later. The shorthand `declare module 'legacy-charts';` (everything `any`) is acceptable only as a temporary unblock.

**2. Globals from script tags:**
```ts
// src/types/globals.d.ts
export {};                          // makes this file a module so `declare global` is allowed
declare global {
  interface Window {
    dataLayer: unknown[];
    analytics?: { track(event: string, props?: Record<string, unknown>): void };
  }
}
window.analytics?.track('signup');   // typed, and optional because the script may be blocked
```
Marking it optional reflects reality: ad blockers often stop analytics scripts loading.

**3. Environment variables (Vite):**
```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SENTRY_DSN?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
```
For Node/Next.js: `declare global { namespace NodeJS { interface ProcessEnv { DATABASE_URL: string } } }`. Types don't guarantee values exist at runtime, so I also validate env vars at startup (e.g. with Zod) to fail fast.

**4. Non-code imports:**
```ts
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
```
Bundlers like Vite provide many of these in their client types; for stricter CSS module typing, tools can generate exact class name types.

**5. Module augmentation: adding to a library's types:**
```ts
// React Router / TanStack Router style: register your router for typed links
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

// Express: add the authenticated user to Request
declare module 'express-serve-static-core' {
  interface Request { user?: { id: string; roles: string[] } }
}
```
Augmentation works because interfaces merge. It must target the module path where the interface is declared, and the file must be a module (have an import/export) so it augments rather than replaces.

**6. Publishing types for my own library:**
```json
{
  "name": "@acme/ui",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "files": ["dist"]
}
```
With `declaration: true` in tsconfig (or tsup's `dts` option), TypeScript emits `.d.ts` files alongside JavaScript. `types` should come first in each `exports` condition. I'd check the published package with `arethetypeswrong` to catch ESM/CJS type resolution problems.

**Troubleshooting checklist:** is the `.d.ts` file included by `tsconfig.include`? Is a file accidentally a script (no import/export) when it should be a module, or vice versa? Is `skipLibCheck` hiding errors in third-party types? Are there duplicate `@types` versions?"

#### Another worked example: typing a payment widget script
"A payment provider loaded via a `<script>` tag exposed `window.PaymentSDK` with no types. We wrote a declaration for the subset we used (`mount(el, options): Promise<Instance>`, event callbacks), marked the global as possibly undefined, and wrapped it in a small typed loader that waited for the script and threw a clear error if it failed to load. Integration bugs dropped because options were autocompleted and checked."

#### A third worked example: env var bugs caught early
"A deploy broke because `VITE_API_URL` was misspelled as `VITE_APIURL` in one file, silently `undefined`. After declaring `ImportMetaEnv` with exact keys, TypeScript flagged the typo; adding startup validation also caught a missing variable in a preview environment before users hit it."

#### Variations you might be asked
- "What's the difference between `declare` and normal declarations?": `declare` says the value exists at runtime elsewhere; it emits no code.
- "What does `skipLibCheck` do?": skips type checking `.d.ts` files, speeding builds but hiding broken third-party types.
- "Triple-slash directives?": `/// <reference types="..." />` pulls in type packages; mostly replaced by tsconfig `types` and imports.

#### Step-by-step framework
1. **Explain .d.ts** and ambient declarations.
2. **Typing untyped packages** (@types first, then minimal declarations).
3. **Globals and env vars.**
4. **Asset imports** with wildcard modules.
5. **Module augmentation** examples.
6. **Publishing types** and troubleshooting.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `// @ts-ignore` the import | Writes a minimal precise declaration |
| `declare module 'x';` permanently | Types the used API surface |
| `window as any` | Global augmentation, optional where appropriate |
| Unaware of augmentation | Augments Request, router, theme types |
| Can't publish types | exports with types, declaration emit, attw check |

#### Useful phrases
- "A declaration file describes JavaScript that exists somewhere else."
- "I check DefinitelyTyped first, then type only what we use."
- "Augmentation works because interfaces merge."
- "Types don't guarantee env vars exist, so I also validate at startup."

#### Common pitfalls
- **Script vs module confusion** in .d.ts files.
- **Blanket any declarations.**
- **Declarations not included** by tsconfig.
- **Type-only guarantees** for runtime values.

#### Follow-ups to expect (with sample answers)
- **"Why must a global augmentation file have an export?"**
  "`declare global` is only allowed in modules; `export {}` turns the file into a module."
- **"How do you type a JSON import?"**
  "Enable `resolveJsonModule`; TypeScript infers the JSON's type automatically."
- **"How do you contribute to DefinitelyTyped?"**
  "Add a folder under `types/package-name` with index.d.ts and tests, following their guidelines, and open a PR."

#### What senior interviewers look for
- **Practical integration skills.**
- **Correct augmentation syntax.**
- **Library publishing knowledge.**

#### Practise it
1. Write a declaration for an untyped package you know.
2. Add typed env vars to a Vite project and validate them at startup.
3. Augment Window with an optional analytics global, and explain why optional, out loud.

## Migrating a large JavaScript codebase to strict TypeScript
- id: fe-ts-09
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: hard
- levels: senior, staff
- tags: migration, strict mode, TypeScript adoption, tech leadership

### Prompt
You're leading the migration of a 300,000-line JavaScript React app to TypeScript with strict mode. How do you plan it, keep shipping features during the migration, and measure progress? What would you prioritise and what would you avoid?

### Answer
#### What the interviewer is really testing
- **Incremental migration** strategy rather than a big-bang rewrite.
- Technical knowledge: **allowJs, checkJs, strictness flags, JSDoc, tooling**.
- **Prioritisation**: boundaries, shared code, high-churn areas.
- **People and process**: team buy-in, guidelines, measuring progress, avoiding stalls.

#### Key points
- Migrate **incrementally**: TypeScript can compile JS and TS side by side with `allowJs`.
- Start with **tooling** (tsconfig, build, lint, CI), then convert files gradually.
- **Strictness ramp**: start permissive, then enable `noImplicitAny`, `strictNullChecks` and the rest, possibly per directory, with tools like a strict-files allow-list or `// @ts-check` / `@ts-expect-error` budgets.
- **Prioritise**: shared utilities and API boundaries first (types flow outward), then high-churn and high-bug areas; leave stable, rarely touched code for last.
- **Type the boundaries**: API responses (generate from OpenAPI or validate with Zod), shared components' props, state stores.
- Rules for new code: **all new files in TS**; touched files converted opportunistically.
- **Measure**: % of files in TS, strict coverage, `any` count, escape hatch count; dashboard in CI.
- Avoid: big-bang rewrite, mass `any`, changing behaviour during conversion, blocking feature work.

#### Model answer
"I'd treat it as an incremental, measurable programme that runs alongside feature work, not a project that stops everything.

**1. Make the case and set goals.**
- Why: bug classes TypeScript prevents (null errors, wrong props, API shape mismatches), safer refactoring, better editor support and onboarding. I'd pull data: e.g. 30% of production errors last quarter were 'cannot read property of undefined' or wrong prop types.
- Goals: 100% TypeScript in 12 months, strict mode everywhere in 18, `any` count trending to near zero.
- Get engineering leadership agreement on a small ongoing capacity allocation and the 'new code in TS' rule.

**2. Set up tooling first (week 1–2).**
- `tsconfig.json` with `allowJs: true`, `checkJs: false`, `strict: false` initially, `noEmit` (the bundler builds), path aliases.
- Build: Vite/webpack/Next already handle TS; add `tsc --noEmit` to CI.
- ESLint with `typescript-eslint`; Jest/Vitest TS support.
- Install `@types/*` for dependencies; generate API types from the OpenAPI spec if available.

**3. Order of conversion.** Types flow from the bottom up, so converting leaf modules first gives the most value:
1. **Shared utilities and constants** (small, many dependents).
2. **API layer**: typed client, generated or Zod-validated response types. This is where most runtime bugs originate.
3. **State management** (stores, reducers, context) with discriminated unions for actions/state.
4. **Design system / shared components**: typed props benefit every team.
5. **Feature code**, prioritised by **churn** (files changed most often) and **bug density**; stable legacy screens last.

**4. Rules that keep momentum:**
- All **new files** must be TypeScript.
- **Boy scout rule**: if you substantially change a JS file, convert it (with a time cap so it doesn't derail the feature).
- Conversion PRs **don't change behaviour**: rename, add types, fix only genuine bugs found (in separate commits), so reviews stay easy.
- Codemods (`ts-migrate` from Airbnb) can bulk-convert files with `any` placeholders; useful to get everything compiling as TS quickly, then tighten.

**5. Strictness ramp.** Turning on `strict` for 300k lines at once might produce 20,000 errors. Options:
- Enable flags one at a time (`noImplicitAny`, then `strictNullChecks`, etc.).
- Use a **strict allow-list**: a second tsconfig (or a plugin like `typescript-strict-plugin`) that checks listed directories strictly; add directories as they're cleaned.
- Track `// @ts-expect-error` and `any` counts; CI fails if they increase (a ratchet).

**6. Measure and communicate.**
- Dashboard: % of files TS, % strict, `any` count, `@ts-expect-error` count, per team.
- Celebrate milestones; share examples of bugs caught.
- Monthly check-ins; adjust priorities.

**7. Enable the team.**
- Guidelines doc: type vs interface convention, typing props and events, API types, when `unknown` vs `any`, discriminated unions for state.
- Workshops and pairing sessions; TypeScript champions per team.
- Templates and examples for common patterns.

**What I'd avoid:**
- **Big-bang rewrite** or feature freeze.
- **`any` everywhere** to make errors go away (track and ratchet instead).
- **Mixing refactors with conversion**, which makes PRs risky and hard to review.
- **Over-clever types** early on; aim for clear, simple types.
- **Ignoring runtime validation**: types from `as` casts on API responses give false confidence."

#### Another worked example: a real migration timeline
"At a previous company, a 250k-line React app moved to TS over 14 months. Month 1: tooling, API client with generated types, the 'new files in TS' rule. Months 2–6: shared components and stores converted by a rotating pair from each team (about 10% capacity). Months 6–12: churn-prioritised feature conversion plus ts-migrate for the long tail. Strict mode was enabled per directory via an allow-list. Results: 'undefined property' production errors dropped by about 60%, and a later large refactor of the cart state took two weeks instead of the estimated six because the compiler found every affected call site."

#### A third worked example: the stalled migration
"Another team I joined had started a migration two years earlier and stalled at 40% TS with thousands of `any`s, because conversion was 'whenever someone has time'. Restarting with a dashboard, an any-count ratchet in CI, a small dedicated allocation and churn-based prioritisation got it to 95% in six months. Visibility and a ratchet mattered more than technical tricks."

#### Variations you might be asked
- "Would you use JSDoc types instead?": for some codebases (libraries that want to stay JS), `checkJs` with JSDoc types gives much of the benefit without a build step; for a large app, TS files are clearer.
- "How do you handle third-party libraries without types?": @types, minimal local declarations, or replacing unmaintained libraries.
- "How do you convince sceptical engineers?": show real bugs caught, editor productivity improvements, and keep friction low with good guidelines.

#### Step-by-step framework
1. **Make the case** with data and goals.
2. **Tooling first** with allowJs and CI.
3. **Convert bottom-up**: utilities, API, state, shared components, features by churn.
4. **Rules** for new and touched code; codemods for scale.
5. **Strictness ramp** with allow-lists and ratchets.
6. **Measure, communicate and enable** the team; avoid big-bang.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Convert everything in a sprint" | Incremental with allowJs |
| Random file order | Bottom-up, churn-prioritised |
| strict: true on day one | Strictness ramp with allow-list |
| any to silence errors | Ratcheted any count |
| No measurement | Dashboard and milestones |

#### Useful phrases
- "TypeScript can compile JS and TS side by side, so we migrate incrementally."
- "Types flow outward, so I start with utilities and the API layer."
- "A ratchet in CI stops any counts from going up."
- "Conversion PRs don't change behaviour."

#### Common pitfalls
- **Feature freeze for migration.**
- **Mass any.**
- **No ownership or visibility**, causing stalls.
- **Trusting cast API types.**

#### Follow-ups to expect (with sample answers)
- **"How long would 300k lines take?"**
  "Depends on team size and capacity; with ~10% capacity across 30 engineers plus codemods, roughly 9–15 months to full TS, longer for full strictness."
- **"What's the biggest risk?"**
  "Stalling halfway with a mixed, weakly typed codebase; mitigated with visibility, ratchets and leadership support."
- **"How do you type the API layer?"**
  "Generate types from OpenAPI/GraphQL schemas, or define Zod schemas and infer types, validating responses at runtime."

#### What senior interviewers look for
- **Programme-level leadership.**
- **Practical tooling knowledge.**
- **Pragmatic sequencing and measurement.**

#### Practise it
1. Write a one-page migration plan with phases, rules and metrics.
2. Set up a strict allow-list tsconfig in a sample project.
3. Explain your conversion order and why, out loud.

## Structural typing, variance and type compatibility
- id: fe-ts-10
- roles: frontend, fullstack
- round: TYPESCRIPT
- difficulty: hard
- levels: senior, staff
- tags: structural typing, variance, excess property checks, branded types

### Prompt
TypeScript uses structural typing. What does that mean, and how does it differ from nominal typing? Explain excess property checks, function parameter variance (covariance, contravariance, bivariance), readonly arrays, and how branded types simulate nominal typing.

### Answer
#### What the interviewer is really testing
- Understanding **assignability by shape** and its consequences.
- Knowing the **surprising cases**: excess property checks only on fresh literals, method bivariance, array covariance unsoundness.
- **Variance** concepts applied to callbacks and generics.
- Practical tools: **branded types, readonly, `satisfies`, `in`/`out` variance annotations**.

#### Key points
- **Structural typing**: types are compatible if their shapes are compatible, regardless of names. A value with extra properties is assignable to a type with fewer properties.
- **Nominal typing** (Java, C#): compatibility depends on declared names/inheritance.
- **Excess property checks** apply only to **fresh object literals** assigned directly; not to variables holding the same object.
- **Covariance**: if `Dog` is assignable to `Animal`, then `Dog[]` to `Animal[]` (outputs/readonly positions).
- **Contravariance**: function **parameters** should accept supertypes: a handler for `Animal` can be used where a handler for `Dog` is expected, not vice versa. With `strictFunctionTypes`, function-type properties are checked contravariantly; **methods** remain bivariant (unsound but practical).
- Mutable arrays are treated covariantly, which is **unsound** (you can push a Cat into a Dog[] via an Animal[] alias); `readonly` arrays avoid the issue.
- **Branded types** (`string & { __brand: 'UserId' }`) prevent mixing structurally identical primitives.
- TypeScript 4.7+ supports explicit **`in`/`out` variance annotations** on type parameters.

#### Model answer
"TypeScript checks compatibility by structure: if a value has at least the properties a type requires, with compatible types, it's assignable. Names don't matter.

**Structural vs nominal:**
```ts
interface Point { x: number; y: number }
class Vector { constructor(public x: number, public y: number, public z = 0) {} }

const p: Point = new Vector(1, 2);   // OK: Vector has x and y (extra z is fine)
function plot(pt: Point) {}
plot({ x: 1, y: 2 });                // OK
```
In a nominal language, `Vector` would need to explicitly implement `Point`. Structural typing fits JavaScript, where objects are often created ad hoc.

**Excess property checks: only for fresh literals**
```ts
plot({ x: 1, y: 2, z: 3 });          // error: 'z' does not exist in type 'Point' (likely a typo)

const coords = { x: 1, y: 2, z: 3 };
plot(coords);                        // OK: not a fresh literal, extra props allowed
```
The check exists to catch typos like `{ colour: 'red' }` for `{ color?: string }`. It disappears once the object is stored in a variable, which surprises people.

**Variance with arrays (covariance and its unsoundness):**
```ts
class Animal { name = '' }
class Dog extends Animal { bark() {} }
class Cat extends Animal { meow() {} }

const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;      // allowed (covariant)
animals.push(new Cat());             // allowed by the types...
dogs[1].bark();                      // ...runtime crash: it's a Cat
```
TypeScript accepts this for convenience. Using `readonly Animal[]` (or `ReadonlyArray`) makes the alias safe because you can't push into it. That's one reason I type function parameters as `readonly T[]` when they don't mutate.

**Function parameters (contravariance):**
```ts
type DogHandler = (d: Dog) => void;
type AnimalHandler = (a: Animal) => void;

const handleAnimal: AnimalHandler = (a) => console.log(a.name);
const handleDog: DogHandler = handleAnimal;     // OK: a function accepting any Animal can handle Dogs

const onlyDogs: DogHandler = (d) => d.bark();
const asAnimal: AnimalHandler = onlyDogs;       // error under strictFunctionTypes: could be called with a Cat
```
**Method bivariance:** parameters of methods declared with method syntax (`handle(d: Dog): void` inside an interface) are checked bivariantly even under `strictFunctionTypes`, for compatibility with common patterns (like DOM event handler types). Declaring them as properties with function types (`handle: (d: Dog) => void`) gets the stricter contravariant check.

**Summary:**
| Position | Variance | Example |
|---|---|---|
| Return values, readonly props | Covariant | `() => Dog` assignable to `() => Animal` |
| Function parameters (property syntax, strict) | Contravariant | `(a: Animal) => void` assignable to `(d: Dog) => void` |
| Method parameters | Bivariant (unsound) | Allowed both ways |
| Mutable arrays/props | Treated covariant (unsound) | `Dog[]` to `Animal[]` |

**Branded types: simulating nominal typing**
```ts
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

const asUserId = (s: string) => s as UserId;            // the only place a cast happens
function getOrder(id: OrderId) {}

const uid = asUserId('u_123');
getOrder(uid);                                          // error: UserId isn't OrderId
```
Brands prevent mixing up structurally identical values (IDs, currencies like `Pence` vs `Pounds`, validated vs unvalidated strings like `Email`). Zod supports `.brand()` so values become branded only after validation.

**Generics and explicit variance annotations (TS 4.7+):**
```ts
interface Producer<out T> { get(): T }          // covariant
interface Consumer<in T> { accept(value: T): void }   // contravariant
```
These document intent and can speed up checking for complex generic types.

**Practical implications in React code:**
- Passing an object with extra fields as props via spread is allowed, but an inline literal with a typo errors.
- Event handler props typed as methods are bivariant; typing callback props as function properties is stricter.
- Accept `readonly` arrays in props to avoid accidental mutation and to accept both mutable and readonly inputs."

#### Another worked example: an ID mix-up bug prevented with brands
"In a marketplace app, functions took `sellerId: string` and `buyerId: string`, and a refactor swapped two arguments, sending messages to the wrong users in staging. Introducing branded `SellerId` and `BuyerId` types, created only in the API layer after validation, made the swap a compile error. Similar brands for `Pence` vs `Pounds` caught a pricing bug where a value in pounds was passed to a function expecting pence."

#### A third worked example: a typo slipping past excess property checks
"A config object was built in a variable (`const opts = { retires: 3 }`) then passed to `createClient(opts)` where the type had optional `retries`. No error appeared because the literal wasn't fresh at the call site, and retries silently used the default. Using `satisfies ClientOptions` on the variable declaration (`const opts = { retries: 3 } satisfies ClientOptions`) re-enabled the excess property check."

#### Variations you might be asked
- "Why is TypeScript unsound on purpose?": to model common JavaScript patterns ergonomically; soundness everywhere would reject much valid real-world code.
- "What does `satisfies` do here?": validates an expression against a type (including excess property checks) without changing its inferred type.
- "How do private class fields affect compatibility?": classes with private/protected members are compared nominally-ish: instances are only compatible if the private members come from the same declaration.

#### Step-by-step framework
1. **Define structural typing** vs nominal.
2. **Excess property checks** and freshness.
3. **Array covariance** and unsoundness; readonly fix.
4. **Function parameter variance** and method bivariance.
5. **Branded types** for nominal behaviour.
6. **Practical React implications.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "TS checks types like Java" | Explains structural compatibility |
| Surprised by missing excess errors | Explains freshness, uses satisfies |
| No variance knowledge | Covariance, contravariance, method bivariance |
| Unaware of array unsoundness | Demonstrates and fixes with readonly |
| IDs as plain strings | Branded types for safety |

#### Useful phrases
- "In TypeScript, shape matters, not names."
- "Excess property checks only apply to fresh object literals."
- "A callback that handles any Animal can stand in for one that handles Dogs, not the reverse."
- "Branded types stop me passing a UserId where an OrderId is expected."

#### Common pitfalls
- **Relying on excess property checks** for variables.
- **Mutable array aliasing** across types.
- **Method syntax** hiding unsafe callbacks.
- **Primitive obsession** for IDs and units.

#### Follow-ups to expect (with sample answers)
- **"What's strictFunctionTypes?"**
  "A strict flag that checks function-type parameters contravariantly instead of bivariantly (methods excluded)."
- **"Can you make a class nominal?"**
  "Adding a private field (including `#brand`) makes instances only compatible with that class and its subclasses."
- **"Why does `{}` accept almost anything?"**
  "Structurally, an empty object type requires no properties, so any non-nullish value satisfies it."

#### What senior interviewers look for
- **Deep type-system understanding.**
- **Awareness of deliberate unsoundness.**
- **Practical safety patterns.**

#### Practise it
1. Reproduce the Dog[]/Cat unsoundness and fix it with readonly.
2. Add branded UserId/OrderId types and catch a swapped argument.
3. Explain contravariance with the handler example, out loud.
