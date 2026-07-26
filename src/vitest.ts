import { expect } from 'vitest';

import { matchers } from './matchers.js';
import type {
  CookieExpectation,
  FormDataExpectation,
  HeaderExpectation,
  QueryExpectation,
  UrlExpectation,
} from './types.js';

expect.extend(matchers);

declare module 'vitest' {
  // Vitest declares this generic with `any`; merged declarations must match.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveStatus(expected: number): T;
    toHaveHeader(name: string, expected?: HeaderExpectation): T;
    toHaveJson(expected: unknown): Promise<T>;
    toHaveFormData(expected: FormDataExpectation): Promise<T>;
    toHaveMethod(expected: string): T;
    toHaveQuery(expected: QueryExpectation): T;
    toHaveText(expected: string | RegExp): Promise<T>;
    toHaveUrl(expected: UrlExpectation): T;
    toRedirectTo(location: string | URL, status?: number): T;
    toSetCookie(name: string, expected?: CookieExpectation): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveStatus(expected: number): unknown;
    toHaveHeader(name: string, expected?: HeaderExpectation): unknown;
    toHaveMethod(expected: string): unknown;
    toHaveQuery(expected: QueryExpectation): unknown;
    toHaveUrl(expected: UrlExpectation): unknown;
    toRedirectTo(location: string | URL, status?: number): unknown;
    toSetCookie(name: string, expected?: CookieExpectation): unknown;
  }
}
