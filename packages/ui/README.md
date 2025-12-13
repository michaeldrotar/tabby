# UI Package

This package provides components that make up the UI.

## Installation

First, move to the page you want to use.

```shell
cd pages/options
```

Add the following to the dependencies in `package.json`.

```json
{
  "dependencies": {
    "@extension/ui": "workspace:*"
  }
}
```

Then, run:

```shell
pnpm install
```

Add the following to the `tailwind.config.ts` file.

```ts
import baseConfig from '@extension/tailwindcss-config'
import { withUI } from '@extension/ui'

export default withUI({
  ...baseConfig,
  content: ['./index.html', './src/**/*.tsx'],
})
```

Add the following to the first line of `index.css` file.

```css
@import '@extension/ui/global.css';
```

## Add Custom Component

Add the following to the `lib/components/index.ts` file.

```tsx
export * from './CustomComponent.js'
```

Add the following to the `lib/components/CustomComponent.tsx` file.

```tsx
import { cn } from '@/lib/utils.js'
import type { ComponentPropsWithoutRef } from 'react'

type CustomComponentProps = ComponentPropsWithoutRef<'section'>

export const CustomComponent = ({
  children,
  ...props
}: CustomComponentProps) => {
  return <section {...props}>{children}</section>
}
```

## Usage

```tsx
import { CustomComponent, ErrorDisplay, LoadingSpinner } from '@extension/ui'

const Page = () => {
  return <CustomComponent>Hi, I'm a custom component.</CustomComponent>
}

export default withErrorBoundary(
  withSuspense(Page, <LoadingSpinner />),
  ErrorDisplay,
)
```

> [!TIP]
> You are able to set other size of the loading spinner by passing the `size` prop to the `<LoadingSpinner />`.

## Modifying the tailwind config of the UI library

Modify the `tailwind.config.ts` file to make global style changes to the package.

## Modifying the css variable of the UI library

Modify the css variable in the `ui/lib/global.css` code to change the css variable of all pages(with UI).
