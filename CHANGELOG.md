# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-07-26

### Added

- Vitest integration for native Fetch API `Response` objects.
- `toHaveStatus`, `toHaveHeader`, `toHaveJson`, `toHaveText`,
  `toRedirectTo`, and `toSetCookie` matchers.
- Safe response-body cloning for JSON and text assertions.
- Multiple `Set-Cookie` header parsing, including `Expires` values.
- TypeScript declarations and zero production dependencies.
