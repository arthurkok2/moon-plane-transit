# Copilot Instructions for Moon Transit Tracker

## Repository Overview

**Moon Transit Tracker** is a React 18 + TypeScript web application that tracks when aircraft will pass in front of the moon from a user's location, perfect for planning spectacular photography shots. The app provides real-time aircraft tracking with dual visualization (sky map and horizon view), photography assistance, and precise astronomical calculations.

**Repository Stats:**
- Type: Single-page web application
- Size: ~287 lines of TypeScript/React code
- Languages: TypeScript (primary), CSS (Tailwind), HTML
- Framework: React 18 + Vite 5.4.20
- Target: Modern browsers with geolocation support
- Deployment: GitHub Pages with automated CI/CD

## Core Dependencies & Architecture

**Key Dependencies:**
- `astronomy-engine@^2.1.19` - Precise celestial calculations
- `dexie@^4.2.0` - IndexedDB wrapper for local storage
- `lucide-react@^0.344.0` - Icon library
- `react@^18.3.1` + `react-dom@^18.3.1` - UI framework

**Data Sources:**
- ADSB.One API (5s updates, 1 req/sec limit, 463km radius)
- OpenSky Network API (60s updates, 400 req/day limit, 250km radius)

## Build & Development Commands

### Prerequisites
```bash
# Node.js version (CRITICAL - must match .nvmrc)
node --version  # Must be v20.11.1
nvm use         # If using nvm
```

### Essential Commands (In Order)
```bash
# 1. Clean installation (ALWAYS run first for new changes)
npm install

# 2. Type checking (will show test file type errors - ignore)
npm run typecheck

# 3. Linting (must pass before commits)
npm run lint

# 4. Testing (all 46 tests should pass)
npm run test:run

# 5. Build (for production)
npm run build

# 6. Development server (uses port 5174 if 5173 busy)
npm run dev

# 7. Preview production build
npm run preview
```

### Known Build Issues & Workarounds

**TypeScript Errors in Test Files:**
- `npm run typecheck` shows 5 errors about `global` object in test files
- These are EXPECTED and can be IGNORED
- Tests use Node.js globals that TypeScript doesn't recognize in browser context
- Tests themselves run correctly with `npm run test:run`

**Clean Build Process:**
```bash
# For troubleshooting, always clean first:
rm -rf node_modules dist
npm install
npm run build
```

## Project Structure & Key Files

### Root Configuration Files
- `package.json` - Dependencies, scripts, project config
- `vite.config.ts` - Build config with `/moon-plane-transit/` base path for GitHub Pages
- `vitest.config.ts` - Test configuration with Node environment and setup file
- `eslint.config.js` - ESLint config with React hooks and TypeScript
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App-specific TypeScript config (strict mode enabled)
- `tsconfig.node.json` - Node.js TypeScript config for build tools
- `.nvmrc` - Node.js version lock (v20.11.1)

### Source Code Architecture

**Core Application (`src/`):**
- `App.tsx` - Main application component with state management
- `main.tsx` - React app entry point
- `index.css` - Global styles and Tailwind imports

**Components (`src/components/`):**
- `SkyMap.tsx` - Overhead sky visualization
- `HorizonView.tsx` - Side profile with compass
- `TransitList.tsx` - Predicted transits display
- `FlightList.tsx` - Aircraft tracking display
- `MoonInfo.tsx` - Moon phase and position info
- `CameraAssistant.tsx` - Photography guidance
- `DataSourceSelector.tsx` - ADS-B source selection

**Business Logic (`src/lib/`):**
- `astronomy.ts` - Moon position and celestial calculations
- `flights.ts` - Aircraft data fetching and processing
- `transitDetector.ts` - Core transit prediction algorithm
- `database.ts` - IndexedDB wrapper with Dexie

**Hooks (`src/hooks/`):**
- `useGeolocation.ts` - Location services
- `useMoonTracking.ts` - Moon position tracking
- `useFlightTracking.ts` - Aircraft data management
- `useDataSource.ts` - ADS-B source management
- `useLocalStorage.ts` - Browser storage utilities

**Tests (`src/test/`):**
- `setup.ts` - Test environment setup (mocks IndexedDB and localStorage)
- `*.test.ts` - Unit tests for database and transit detection

## Continuous Integration & Validation

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
**Trigger:** Push to `main` branch or manual dispatch
**Steps:**
1. Checkout code
2. Setup Node.js (uses package.json cache)
3. `npm ci` (clean install)
4. `npm run build`
5. Deploy to GitHub Pages

**Validation Pipeline:**
- Build must succeed (no TypeScript/build errors)
- Linting must pass (`npm run lint`)
- All tests must pass (46 tests in 5 files)

### Local Validation Steps
Before pushing changes, ALWAYS run:
```bash
npm run lint      # Must exit with code 0
npm run test:run  # All 46 tests must pass
npm run build     # Must complete successfully
```

## Development Guidelines

### Environment Setup
- **Node.js:** Must use v20.11.1 (see `.nvmrc`)
- **Package Manager:** npm (not yarn or pnpm)
- **IDE:** VS Code recommended with TypeScript and ESLint extensions

### Code Standards
- **TypeScript:** Strict mode enabled, no `any` types
- **React:** Functional components with hooks only
- **Styling:** Tailwind CSS classes, no custom CSS
- **Icons:** Lucide React only
- **State:** React hooks, no external state management

### Testing Requirements
- **Environment:** Node.js with jsdom
- **Database:** Uses `fake-indexeddb` for IndexedDB mocking
- **Coverage:** Test database operations and core business logic
- **Run Tests:** Always use `npm run test:run` for CI compatibility

### Common Pitfalls & Solutions

**Location Access:**
- App requires geolocation permissions
- Handle denial gracefully with clear error messages
- Test with location services enabled

**API Rate Limits:**
- ADSB.One: 1 request/second (strict)
- OpenSky: 400 requests/day (anonymous)
- Implement proper rate limiting and error handling

**Build Configuration:**
- Vite uses `/moon-plane-transit/` base path for GitHub Pages
- Build output goes to `dist/` directory
- Assets are properly hashed for caching

### Key Dependencies Not to Change
- `astronomy-engine` - Core astronomical calculations
- `dexie` - Database layer (complex setup)
- Node.js version - Locked to v20.11.1 for deployment compatibility

## Deployment Notes

- **Platform:** GitHub Pages
- **URL:** `https://arthurkok2.github.io/moon-plane-transit/`
- **Build:** Automated on push to main
- **Base Path:** `/moon-plane-transit/` (configured in vite.config.ts)

## Trust These Instructions

These instructions have been validated by running all commands and testing the complete build process. Only search for additional information if:
1. Commands fail with unexpected errors
2. New dependencies are being added
3. Major architectural changes are needed
4. Instructions prove to be outdated or incorrect

Always follow the exact command sequences provided above for reliable builds.