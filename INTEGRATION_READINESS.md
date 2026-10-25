# FEMORA Core Engine integration boundary

The frontend is prepared to connect to Person 2's Core Engine once the agreed `INTEGRATION_CONTRACT.md`, exported source, original Integration Plan, and Backend Schema are available.

## Required before connecting

1. Import the actual public API from the agreed engine package/module; do not implement substitute security functions here.
2. Map profile lifecycle and health-record persistence to the contract's real profile-scoped APIs.
3. Connect PIN setup, unlock, lock, session invalidation, `isEncrypted`, persistent-storage request/result, backup export/import/validation, `requiresPlaintextWarning`, and profile wiping to exact exported signatures.
4. Gate protected routes using the engine's actual lock state; do not infer lock state from local UI state.
5. Render backup acknowledgement whenever the engine says a plaintext warning is required, and do not continue the applicable action until acknowledged.
6. Run integration tests for profile isolation, lock bypass, failed imports, restore, and wipe/session cleanup.

## Important

No encryption, PIN verification, or engine API is simulated by this readiness note. The integration is not considered connected until the real engine is present and the frontend tests pass.
