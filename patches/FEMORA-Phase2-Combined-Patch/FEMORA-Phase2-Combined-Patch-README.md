# FEMORA Phase 2 Combined Patch

This is a single consolidated patch combining the previously supplied Phase 2 input-validation and standardized-error-contract changes.

## Apply once
1. Make a backup or commit your current FEMORA working tree.
2. Open a terminal at the repository root (the folder containing `src/` and `tests/`).
3. Apply `FEMORA-Phase2-Combined.patch` using `git apply FEMORA-Phase2-Combined.patch` (or `patch -p1 < FEMORA-Phase2-Combined.patch`).
4. Do not apply the two earlier patches separately if you use this combined patch; it contains both sets of changes.
5. Run the project's existing typecheck, lint, test, and build scripts.

## Scope
- `src/data/access.ts`: validation/error handling changes from the earlier Phase 2 validation patch.
- `tests/core.test.ts`: regression tests from both earlier patches.

## Verification
The consolidated patch passed a dry-run application against the uploaded 25 October 2026 snapshot. This verifies patch context only; it does not prove the app's tests pass. The earlier test run was blocked because the uploaded `node_modules` lacked Rollup's Linux optional binary. Run checks on the actual Windows project after applying.

This patch does not mark clinical rules as approved and does not modify the user's local working tree or remote repository.
