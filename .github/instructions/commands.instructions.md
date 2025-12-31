# Command Execution Guidelines

## CRITICAL: Use Package.json Scripts, Not Direct Tool Invocation

**Always use the npm scripts defined in package.json**, not the underlying tools directly.

### ❌ WRONG - Never invoke turbo or other tools directly:

```bash
pnpm turbo run build --filter="./pages/tab-manager"
pnpm turbo watch dev
turbo build
turbo dev
```

### ✅ CORRECT - Use the npm scripts:

```bash
pnpm build
pnpm dev
pnpm type-check
```

### Why This Matters:

**Environment Setup:** The npm scripts (like `pnpm build` and `pnpm dev`) run essential setup scripts:

- `set-global-env` sets environment variables like `CLI_CEB_DEV` to control build vs dev behavior
- Without this setup, builds may run in the wrong mode (e.g., dev mode when you want production)

- Directly invoking `turbo` bypasses all environment configuration

**Correct Configuration:** Scripts ensure proper sequencing:

- `pnpm build` → runs `set-global-env` (CLI_CEB_DEV=false) → `turbo build`
- `pnpm dev` → runs `set-global-env CLI_CEB_DEV=true` → `turbo ready` → `turbo watch dev`

**Filtering:** If you need to build/dev specific packages, the scripts handle it correctly. For workspace-specific operations, use workspace filtering with the npm scripts:

```bash
pnpm --filter "./pages/tab-manager" build
```

## DO NOT Run Automatically

**These rules apply whether using npm scripts OR their underlying tools** (which you shouldn't use directly anyway):

- `pnpm dev` (or `turbo dev`, `turbo watch dev`) - Never run these
- `pnpm build` (or `turbo build`, `turbo run build`) - Only run when explicitly asked
- `pnpm test` (or `vitest`) - Only run when explicitly asked or when working specifically on test changes

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
