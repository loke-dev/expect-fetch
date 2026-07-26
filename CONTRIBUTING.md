# Contributing

Contributions and focused bug reports are welcome.

## Development

expect-fetch requires Node.js 20 or newer and uses npm.

```sh
npm ci
npm run check
npm test
npm run build
npm run check:consumer
```

`npm run prepublishOnly` runs the complete local release gate.

## Pull requests

- Add tests for behavioral changes.
- Keep matchers compatible with standards-based `Request` and `Response`
  objects instead of relying on a specific framework implementation.
- Preserve response and request bodies by cloning before reading them.
- Include clear failure messages that show the expected and received HTTP
  state.
- Update the README and changelog for public API changes.

CI verifies Node.js 20, 22, and 24, plus Vitest 2, 3, and 4.

## Releases

Releases are generated from `v*` tags. The tag must exactly match the version in
`package.json`, for example `v0.2.0`.

The release workflow:

1. Runs the complete release gate.
2. Packs one immutable tarball.
3. Publishes that tarball to npm through trusted publishing.
4. Verifies the registry integrity against the local tarball.
5. Creates a GitHub release containing the same tarball.
