# MEDUSA — Frontend Testing Strategy

## Test Architecture

The testing suite covers four tiers:
1. **Unit Tests**: API Client, error handling, formatters, and state adapters.
2. **Component Tests**: TaskCard, SkipTaskModal (with commitment phrase validation), AbandonTaskModal (with penalty confirmation), GitDotGraph (5-mode rendering), and FocusTimerWidget.
3. **Integration Tests**: Auth flow, Task mutations, Daily closure, and Realtime event cache invalidations.
4. **Contract Verification**: Strict validation against NestJS DTOs and Prisma enums.

## Running Tests
```bash
cd frontend
npm test
```
