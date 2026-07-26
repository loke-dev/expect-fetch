import {
  cookieMatches,
  getSetCookieHeaders,
  parseSetCookie,
} from './cookies.js';
import type {
  CookieExpectation,
  HeaderExpectation,
  MatcherContext,
  MatcherResult,
} from './types.js';
import {
  createResult,
  formatHeaders,
  matcherError,
  matchesValue,
  requireResponse,
  responseSummary,
} from './utils.js';

export function toHaveStatus(
  this: MatcherContext,
  received: unknown,
  expected: number,
): MatcherResult {
  const invalid = requireResponse(this, 'toHaveStatus', received);
  if (invalid) return invalid;

  const response = received as Response;
  const pass = response.status === expected;

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveStatus'),
        '',
        `Expected status: ${this.utils.printExpected(expected)}`,
        `Received status: ${this.utils.printReceived(response.status)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    response.status,
    expected,
  );
}

export function toHaveHeader(
  this: MatcherContext,
  received: unknown,
  name: string,
  expected?: HeaderExpectation,
): MatcherResult {
  const invalid = requireResponse(this, 'toHaveHeader', received);
  if (invalid) return invalid;

  const response = received as Response;
  const actual = response.headers.get(name);
  const pass =
    actual !== null &&
    (expected === undefined || matchesValue(actual, expected));

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveHeader'),
        '',
        expected === undefined
          ? `Expected response to contain header ${this.utils.printExpected(name)}.`
          : `Expected header:\n  ${name}: ${this.utils.printExpected(expected)}`,
        actual === null
          ? `Received header:\n  ${name}: (missing)`
          : `Received header:\n  ${name}: ${this.utils.printReceived(actual)}`,
        '',
        'All response headers:',
        formatHeaders(response.headers),
      ].join('\n'),
    actual,
    expected,
  );
}

export async function toHaveJson(
  this: MatcherContext,
  received: unknown,
  expected: unknown,
): Promise<MatcherResult> {
  const invalid = requireResponse(this, 'toHaveJson', received);
  if (invalid) return invalid;

  const response = received as Response;
  let actual: unknown;

  try {
    actual = await response.clone().json();
  } catch (error) {
    return matcherError(
      this,
      'toHaveJson',
      [
        'Expected response to contain valid JSON, but its body could not be parsed.',
        `Reason: ${error instanceof Error ? error.message : String(error)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    );
  }

  const pass = this.equals(actual, expected);
  const difference = pass ? undefined : this.utils.diff(expected, actual);

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveJson'),
        '',
        'Response JSON did not match.',
        difference ??
          `Expected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(actual)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    actual,
    expected,
  );
}

export async function toHaveText(
  this: MatcherContext,
  received: unknown,
  expected: string | RegExp,
): Promise<MatcherResult> {
  const invalid = requireResponse(this, 'toHaveText', received);
  if (invalid) return invalid;

  const response = received as Response;
  let actual: string;

  try {
    actual = await response.clone().text();
  } catch (error) {
    return matcherError(
      this,
      'toHaveText',
      `Could not read the response body: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const pass = matchesValue(actual, expected);

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveText'),
        '',
        `Expected text: ${this.utils.printExpected(expected)}`,
        `Received text: ${this.utils.printReceived(actual)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    actual,
    expected,
  );
}

export function toRedirectTo(
  this: MatcherContext,
  received: unknown,
  expectedLocation: string | URL,
  expectedStatus?: number,
): MatcherResult {
  const invalid = requireResponse(this, 'toRedirectTo', received);
  if (invalid) return invalid;

  const response = received as Response;
  const location = response.headers.get('location');
  const expected = expectedLocation.toString();
  const statusMatches =
    expectedStatus === undefined
      ? response.status >= 300 && response.status < 400
      : response.status === expectedStatus;
  const pass = statusMatches && location === expected;

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toRedirectTo'),
        '',
        `Expected redirect: ${expectedStatus ?? '3xx'} ${this.utils.printExpected(expected)}`,
        `Received response: ${response.status} ${this.utils.printReceived(location)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    { location, status: response.status },
    { location: expected, status: expectedStatus ?? '3xx' },
  );
}

export function toSetCookie(
  this: MatcherContext,
  received: unknown,
  name: string,
  expected: CookieExpectation = {},
): MatcherResult {
  const invalid = requireResponse(this, 'toSetCookie', received);
  if (invalid) return invalid;

  const response = received as Response;
  const rawCookies = getSetCookieHeaders(response.headers);
  const cookies = rawCookies
    .map(parseSetCookie)
    .filter((cookie) => cookie !== undefined);
  const namedCookies = cookies.filter((cookie) => cookie.name === name);
  const pass = namedCookies.some((cookie) => cookieMatches(cookie, expected));

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toSetCookie'),
        '',
        `Expected cookie ${this.utils.printExpected(name)} with:`,
        `  ${this.utils.printExpected(expected)}`,
        '',
        namedCookies.length === 0
          ? `No cookie named ${this.utils.printExpected(name)} was found.`
          : `Received matching-name cookies:\n${namedCookies
              .map((cookie) => `  ${this.utils.printReceived(cookie)}`)
              .join('\n')}`,
        '',
        rawCookies.length === 0
          ? 'The response did not contain any Set-Cookie headers.'
          : `All Set-Cookie headers:\n${rawCookies.map((cookie) => `  ${cookie}`).join('\n')}`,
      ].join('\n'),
    namedCookies,
    expected,
  );
}

export const matchers = {
  toHaveHeader,
  toHaveJson,
  toHaveStatus,
  toHaveText,
  toRedirectTo,
  toSetCookie,
};
