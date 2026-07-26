# expect-fetch

Jest DOM-style assertions for native Fetch API responses.

`expect-fetch` adds expressive HTTP matchers to Vitest without mocking
`globalThis.fetch`. Use it to test Next.js route handlers, Remix loaders,
SvelteKit and Astro endpoints, Hono applications, Cloudflare Workers, or any
function that returns a native `Response`.

```ts
import 'expect-fetch/vitest';

const response = await app.request('/users/123');

expect(response).toHaveStatus(200);
expect(response).toHaveHeader('content-type', /json/);

await expect(response).toHaveJson({
  id: '123',
  name: 'Ada',
});
```

## Installation

```sh
npm install --save-dev expect-fetch
```

Add the integration to a Vitest setup file:

```ts
// test/setup.ts
import 'expect-fetch/vitest';
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
  },
});
```

You can also import the integration directly in an individual test file.

## Matchers

### `toHaveStatus`

```ts
expect(response).toHaveStatus(201);
```

### `toHaveHeader`

Header names are case-insensitive. Values can be exact strings or regular
expressions.

```ts
expect(response).toHaveHeader('content-type');
expect(response).toHaveHeader('content-type', /application\/json/);
expect(response).toHaveHeader('x-request-id', 'req_123');
```

### `toHaveJson`

The response is cloned before its body is read, so the matcher does not consume
the original body. Vitest asymmetric matchers are supported.

```ts
await expect(response).toHaveJson({
  id: expect.any(String),
  role: 'admin',
});
```

### `toHaveText`

```ts
await expect(response).toHaveText('Not found');
await expect(response).toHaveText(/not found/i);
```

### `toRedirectTo`

Without an explicit status, any status from 300 through 399 is accepted.

```ts
expect(response).toRedirectTo('/login');
expect(response).toRedirectTo('/login', 307);
```

### `toSetCookie`

```ts
expect(response).toSetCookie('session', {
  value: /^eyJ/,
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 3600,
});
```

Supported expectations are `value`, `domain`, `path`, `expires`, `maxAge`,
`secure`, `httpOnly`, and `sameSite`. Omitted fields are not checked.

`Set-Cookie` is intentionally supported for server-side response tests. Browsers
do not expose this response header to client-side JavaScript.

## Why not fetch-mock?

Fetch mocking tools fake the server that your code calls. `expect-fetch`
verifies the `Response` produced by the server or handler you are building.
They solve different problems and can be used together.

## Compatibility

- Node.js 20 or newer
- Vitest 2, 3, or 4
- Any framework returning standards-compatible Fetch API `Response` objects

The matchers use structural checks rather than `instanceof Response`, allowing
responses created in another JavaScript realm or by compatible runtimes.

## License

MIT
