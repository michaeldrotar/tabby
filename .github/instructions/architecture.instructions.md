# Architecture & Component Design

## Core Architectural Principles

These principles guide all development and refactoring decisions:

### DRY (Don't Repeat Yourself)

- Eliminate code duplication by extracting shared logic into reusable functions or components
- Always check for existing implementations before creating new ones
- If you find duplicated code, refactor it into a shared location
- **Derive, don't duplicate:** When consolidating similar definitions, derive one from another rather than maintaining parallel structures (e.g., derive a type from an array using `typeof arr[number]` instead of maintaining both separately)
- **Single source of truth for constants:** When platform APIs define enums/constants (like `chrome.tabGroups.Color`), ensure your definitions align with them

### Separation of Concerns (SoC)

The system is divided into distinct layers, each handling a specific responsibility:

- **Presentation Layer (UI):** Visual components in `packages/ui` and page-specific components
- **Business Logic:** Chrome API interactions, data transformations, state management in `packages/chrome`
- **Data Access:** Storage abstractions in `packages/storage`

Changes to one layer should have minimal impact on others.

### Component Architecture Pattern

**Dumb Visual Components:**

- Visual components should be "dumb" - they receive data via props and render UI
- No direct Chrome API calls or complex business logic
- Live in `packages/ui` for reusability

**Smart Page Composition:**

- Pages in `pages/` composite dumb visual components
- Pages wire in Chrome API data using hooks from `@extension/chrome`
- Handle user interactions and coordinate data flow

Example:

```typescript
// Dumb component in packages/ui
export const TabList = ({ tabs, onTabClick }) => { /* pure rendering */ }

// Smart page composition
export const TabManager = () => {
  const tabs = useTabs() // Chrome API hook
  const handleClick = (tab) => chrome.tabs.update(tab.id, { active: true })
  return <TabList tabs={tabs} onTabClick={handleClick} />
}
```

### Loose Coupling & High Cohesion

- **Loose Coupling:** Components should be independent and not rely on internal implementation details of other components
- **High Cohesion:** Code within a single component should be highly related and focused on a single purpose
- Use clear interfaces (props, types) to define boundaries between components

### Modularity

- Build small, independent, and interchangeable modules
- Makes it easier to manage complexity, test in isolation, and reuse code
- Each package in `packages/` represents a distinct module with a specific responsibility

### Simplicity (KISS - Keep It Simple, Stupid)

- Prioritize simple, straightforward solutions over complex or over-engineered ones
- **YAGNI (You Aren't Gonna Need It):** Only introduce abstractions when clearly warranted by current needs
- Avoid premature optimization or building for hypothetical future requirements
- If a simple solution works, prefer it over a clever one
- **Consolidate fallback logic:** When refactoring, ensure fallback/default handling exists in ONE place, not duplicated across callers and helpers
- **Question existing patterns:** When consolidating code, don't blindly preserve existing structure—ask if the original approach was optimal

### Readability & Understandability

- **Code should be self-documenting:** Use clear, semantically rich naming for variables, functions, and components
- Choose names that explain intent: `getActiveTabsInWindow()` not `getTabs()`
- Avoid inline comments within function bodies - instead refactor complex logic into well-named functions
- Reserve comments for doc comments (JSDoc) that explain the "why" or API contracts

## Code Organization Principles

### Feature-Based Organization

Group components, hooks, and utils by feature (e.g., `omnibar/`) rather than by type (e.g., `components/`, `hooks/`, or `types/`).

### General Utilities

General utilities that don't belong to a specific feature should be placed in a `utils/` folder. Each utility should be in its own file (e.g., `utils/formatTimeAgo.ts`).

### Single File Exports

Prefer single file exports for everything, including types and utils:

- Components with a props type can export both the component function and prop type.
- Avoid creating "bag" files like `utils.ts` or `types.ts` that contain multiple unrelated exports.
- Types should also follow this rule. For example, `DataAttributes` should be in `DataAttributes.ts`, not `types.ts`.
- **ESLint Enforcement:** The custom `prefer-inline-export` rule automatically transforms standalone exports into inline exports (e.g., `export const foo = ...` instead of `const foo = ...; export { foo }`).

### Co-location

Tightly coupled components (e.g., `TabList`, `TabListItem`) should be defined in the same file to improve maintainability and discoverability.

## Naming Conventions

- Name feature-specific types and utils to include the feature name (e.g., `OmnibarSearchItem`, `getOmnibarActionLabel`).

## Component Design

### Minimal Props

Custom components should have minimal properties. Avoid extending full HTML attributes (like `React.ButtonHTMLAttributes`) unless absolutely necessary.

### DRY Principle

- Always check for existing components before creating new ones.
- Shared components (like `Favicon`, `Omnibar`) should live in `packages/ui`.
- If you find duplicated code, refactor it into a shared location.
- Remove unused code, imports, and files when refactoring or deleting features.

## Documentation Standards

- Doc comments (JSDoc) are encouraged for components and utilities to explain their purpose and usage.
- Avoid inline comments within function bodies. Code should be self-documenting with clear variable and function names.
- If logic is complex enough to warrant a comment, consider refactoring into well-named functions or variables that explain the intent.

## Styling Guidelines

### Tailwind-First Approach

- **Prefer Tailwind classes over inline styles:** Use `className="bg-blue-500"` instead of `style={{ backgroundColor: '#3b82f6' }}`
- **Use Tailwind's color palette:** When defining color constants, use Tailwind class names rather than hex values
- **Consistency:** All visual styling should go through Tailwind to ensure theme compatibility and dark mode support
- **Avoid style prop for colors:** The `style` prop with hardcoded colors breaks theme consistency and dark mode

### Color Constants Pattern

When defining color-related constants:

```typescript
// ✅ Good: Tailwind classes that work with theme
const COLORS = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' },
} as const

// ❌ Bad: Hex values that ignore theme
const COLORS = {
  blue: { hex: '#3b82f6' },
}
```

## Working with Workspace Packages

When importing from internal packages:

```typescript
import { Omnibar } from '@extension/ui'
import { usePlatformInfo } from '@extension/chrome'
import { preferenceStorage } from '@extension/storage'
import { useThemeApplicator } from '@extension/shared'
```

### Package Structure Conventions

- Each package has `ready` script for build/type-gen (runs automatically)
- Main entry points use `.mts` extension for ES modules
- Package versions are `0.0.0` (only root package.json has real version)
- Use `workspace:*` for internal dependencies in package.json

## Configuration Patterns

### Vite Configuration

Pages use `withPageConfig` from `@extension/vite-config`:

```typescript
import { withPageConfig } from '@extension/vite-config'

export default withPageConfig({
  build: {
    outDir: resolve(__dirname, '..', '..', 'dist', 'omnibar-overlay'),
  },
})
```

### Tailwind Configuration

Pages extend UI package styles via `withUI`:

```typescript
import { withUI } from '@extension/ui'

export default withUI({
  content: ['./src/**/*.{ts,tsx}'],
})
```

This automatically includes `packages/ui/lib/**/*.{ts,tsx}` and applies the base preset with custom dark mode handling.
