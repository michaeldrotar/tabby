# Command Execution Guidelines

## DO NOT Run Automatically

- `pnpm dev` - Never run this
- `pnpm build` - Only run when explicitly asked
- `pnpm test` or `pnpm test:watch` - Only run when explicitly asked or when working specifically on test changes

## Run When Appropriate

- `pnpm type-check` - Use to verify TypeScript changes
- `pnpm lint:fix` - Use to automatically fix linting issues
- `pnpm format` - Use to format code

## Rationale

Build and dev server commands are resource-intensive and time-consuming. The user will run them when ready. Focus on making code changes and using lightweight verification commands.

## Available Development Commands

```bash
pnpm dev              # Start dev server with HMR (watches all packages)
pnpm build            # Production build (outputs to dist/)
pnpm zip              # Build + create distributable zip file
pnpm test             # Run all Vitest tests
pnpm test:watch       # Run tests in watch mode
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # Type-check entire monorepo
pnpm clean            # Clean all build artifacts and node_modules
```

## Turborepo Tasks

- `ready` - Build packages that other packages depend on (runs before dev/build)
- `dev` - Watch mode for development
- `build` - Production builds
- All tasks configured in `turbo.json` with dependency graphs
