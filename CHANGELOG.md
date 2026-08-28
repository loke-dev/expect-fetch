# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Changed

- Describe native `Request` support in the package metadata.

### Fixed

- Redact embedded URL credentials from matcher failure diagnostics.
- Redact query values from URL failure diagnostics.
- Redact URL fragments from matcher failure diagnostics.
- Redact API key, token, and secret header values from matcher failure
  diagnostics.
- Redact authorization and cookie values from matcher failure diagnostics.
- Preserve query and form field names that overlap object prototype properties.
- Ignore malformed `Max-Age` cookie attributes instead of treating them as
  valid numeric values.
- Normalize cookie domains to lowercase without an obsolete leading dot.
- Trim boundary whitespace from cookie names, values, and attributes.
- Keep quoted cookie-extension commas within their original cookie.
- Reject malformed Request and Response lookalikes with clear matcher errors.
- Preserve reusable regular expressions when evaluating matcher expectations.
- Match `Domain` and `SameSite` cookie expectations case-insensitively and
  ignore obsolete leading dots in expected domains.
- Match `Date` cookie expiration expectations at HTTP-date second precision.

## 0.1.0 - 2026-07-26

### Added

- Vitest integration for native Fetch API `Response` objects.
- `toHaveStatus`, `toHaveHeader`, `toHaveJson`, `toHaveText`,
  `toRedirectTo`, and `toSetCookie` matchers.
- Request support for `toHaveHeader`, `toHaveJson`, and `toHaveText`.
- `toHaveMethod`, `toHaveUrl`, `toHaveQuery`, and `toHaveFormData` matchers.
- Safe response-body cloning for JSON and text assertions.
- Multiple `Set-Cookie` header parsing, including `Expires` values.
- TypeScript declarations and zero production dependencies.
