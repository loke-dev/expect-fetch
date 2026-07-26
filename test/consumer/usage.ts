import { expect } from 'vitest';

import {
  getSetCookieHeaders,
  matchers,
  type CookieExpectation,
} from 'expect-fetch';
import 'expect-fetch/vitest';

declare const response: Response;
declare const request: Request;

expect(response).toHaveStatus(200);
expect(response).toHaveHeader('content-type', /json/);
await expect(response).toHaveJson({ ok: true });
await expect(response).toHaveText(/success/i);
expect(response).toRedirectTo('/login', 307);
expect(response).toSetCookie('session', {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
} satisfies CookieExpectation);

getSetCookieHeaders(response.headers);
Object.keys(matchers);

expect(request).toHaveMethod('POST');
expect(request).toHaveUrl('/users?page=2');
expect(request).toHaveQuery({ page: '2' });
expect(request).toHaveHeader('authorization', /^Bearer /);
await expect(request).toHaveJson({ name: 'Ada' });
await expect(request).toHaveFormData({ name: 'Ada' });
