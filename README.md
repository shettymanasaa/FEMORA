# FEMORA — Care for Every Phase of Her Life

A privacy-first women's health tracking and education platform for menstrual health, maternity, and menopause. Built with React, TypeScript, and a local-first architecture featuring on-device safety guidance, AI-powered insights with privacy safeguards, and reviewed educational content.

---

## Workspace Structure

```
FEMORA/
├── src/                # Core Engine implementation (IndexedDB/Dexie, AES-GCM vault, journeys, safety)
├── tests/              # Core test suite (Vitest)
├── docs/               # Architecture specs, schema references, integration contracts
├── patches/            # Patch files and patch notes
├── archives/           # Exported zip bundles and historical snapshots
├── package.json        # NPM dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── eslint.config.js    # Linting & architectural import rules
```

---

## Documentation

- **[Core Engine Overview](docs/CORE_ENGINE.md)**: Architecture, isolation, vault cryptographic design, safety boundaries.
- **[Database Schema Reference](docs/BACKEND_SCHEMA_REFERENCE.md)**: Dexie tables, compound indexes, version migrations (v1–v4).
- **[Integration Contract](docs/INTEGRATION_CONTRACT.md)**: Shared API contracts between Frontend, Core Engine, and AI/Reports.
- **[Integration Plan](docs/INTEGRATION_PLAN_RECONSTRUCTED.md)**: Project implementation roadmap.
- **[Clinical Review Gap Register](docs/FEMORA-Clinical-Review-Gap-Register.md)**: Safety rule catalog audit and clinical review statuses.

---

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run test suite
npm test

# Build production bundle
npm run build
```
