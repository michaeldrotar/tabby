# Testing Guidelines

## Test Framework

- Use Vitest for testing with `// @vitest-environment jsdom` for React component tests.

## When to Write Tests

- Tests are not needed for relatively simple changes like new features or modifications.
- **Bug fixes must include tests to prevent regressions.**
- Dummy UI components should have tests for their functionality, if any (e.g., conditional rendering, event handling).

## Testing Principles

- **Test Functionality, Not Implementation:** Tests should verify behavior and user-visible state (e.g., `aria-current`, `data-active`) rather than implementation details like CSS classes.

## Example Test Structure

See `packages/ui/lib/TabItem.spec.tsx` for reference:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

describe('ComponentName', () => {
  it('should do something', () => {
    // Arrange, Act, Assert
  })
})
```
