export interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}

export interface MatcherContext {
  equals(actual: unknown, expected: unknown): boolean;
  isNot: boolean;
  utils: {
    diff(expected: unknown, actual: unknown): string | undefined;
    matcherHint(name: string, received?: string, expected?: string): string;
    printExpected(value: unknown): string;
    printReceived(value: unknown): string;
  };
}

export type HeaderExpectation = string | RegExp;

export interface CookieExpectation {
  value?: string | RegExp;
  domain?: string;
  path?: string;
  expires?: Date | string | RegExp;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
}
