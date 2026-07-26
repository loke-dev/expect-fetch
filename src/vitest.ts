import { expect } from 'vitest';

import { matchers } from './matchers.js';
import type { CookieExpectation, HeaderExpectation } from './types.js';

expect.extend(matchers);

declare module 'vitest' {
  // Vitest declares this generic with `any`; merged declarations must match.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveStatus(expected: number): T;
    toHaveHeader(name: string, expected?: HeaderExpectation): T;
    toHaveJson(expected: unknown): Promise<T>;
    toHaveText(expected: string | RegExp): Promise<T>;
    toRedirectTo(location: string | URL, status?: number): T;
    toSetCookie(name: string, expected?: CookieExpectation): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveStatus(expected: number): unknown;
    toHaveHeader(name: string, expected?: HeaderExpectation): unknown;
    toRedirectTo(location: string | URL, status?: number): unknown;
    toSetCookie(name: string, expected?: CookieExpectation): unknown;
  }
}
