import {
  cookieMatches,
  getSetCookieHeaders,
  parseSetCookie,
} from './cookies.js';
import type {
  CookieExpectation,
  FormDataExpectation,
  HeaderExpectation,
  MatcherContext,
  MatcherResult,
  QueryExpectation,
  UrlExpectation,
} from './types.js';
import {
  createResult,
  fetchMessageSummary,
  formatHeaders,
  matcherError,
  matchesValue,
  redactHeaderValue,
  redactUrl,
  requireFetchMessage,
  requireRequest,
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
  const invalid = requireFetchMessage(this, 'toHaveHeader', received);
  if (invalid) return invalid;

  const message = received as Request | Response;
  const actual = message.headers.get(name);
  const pass =
    actual !== null &&
    (expected === undefined || matchesValue(actual, expected));
  const displayedActual =
    actual === null ? null : redactHeaderValue(name, actual);
  const displayedExpected =
    expected === undefined ? undefined : redactHeaderValue(name, expected);

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveHeader'),
        '',
        expected === undefined
          ? `Expected message to contain header ${this.utils.printExpected(name)}.`
          : `Expected header:\n  ${name}: ${this.utils.printExpected(displayedExpected)}`,
        actual === null
          ? `Received header:\n  ${name}: (missing)`
          : `Received header:\n  ${name}: ${this.utils.printReceived(displayedActual)}`,
        '',
        'All headers:',
        formatHeaders(message.headers),
      ].join('\n'),
    displayedActual,
    displayedExpected,
  );
}

export async function toHaveJson(
  this: MatcherContext,
  received: unknown,
  expected: unknown,
): Promise<MatcherResult> {
  const invalid = requireFetchMessage(this, 'toHaveJson', received);
  if (invalid) return invalid;

  const message = received as Request | Response;
  let actual: unknown;

  try {
    actual = await message.clone().json();
  } catch (error) {
    return matcherError(
      this,
      'toHaveJson',
      [
        'Expected message to contain valid JSON, but its body could not be parsed.',
        `Reason: ${error instanceof Error ? error.message : String(error)}`,
        '',
        fetchMessageSummary(message),
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
        'JSON body did not match.',
        difference ??
          `Expected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(actual)}`,
        '',
        fetchMessageSummary(message),
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
  const invalid = requireFetchMessage(this, 'toHaveText', received);
  if (invalid) return invalid;

  const message = received as Request | Response;
  let actual: string;

  try {
    actual = await message.clone().text();
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
        fetchMessageSummary(message),
      ].join('\n'),
    actual,
    expected,
  );
}

export function toHaveMethod(
  this: MatcherContext,
  received: unknown,
  expected: string,
): MatcherResult {
  const invalid = requireRequest(this, 'toHaveMethod', received);
  if (invalid) return invalid;

  const request = received as Request;
  const normalizedExpected = expected.toUpperCase();
  const pass = request.method.toUpperCase() === normalizedExpected;

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveMethod'),
        '',
        `Expected method: ${this.utils.printExpected(normalizedExpected)}`,
        `Received method: ${this.utils.printReceived(request.method)}`,
        '',
        fetchMessageSummary(request),
      ].join('\n'),
    request.method,
    normalizedExpected,
  );
}

export function toHaveUrl(
  this: MatcherContext,
  received: unknown,
  expected: UrlExpectation,
): MatcherResult {
  const invalid = requireRequest(this, 'toHaveUrl', received);
  if (invalid) return invalid;

  const request = received as Request;
  const url = new URL(request.url);
  const relative =
    typeof expected === 'string' && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(expected);
  const actual = relative ? requestPath(url) : request.url;
  const normalizedExpected =
    expected instanceof URL ? expected.toString() : expected;
  let comparableExpected: string | RegExp = normalizedExpected;
  if (relative) {
    try {
      comparableExpected = requestPath(new URL(expected, url));
    } catch {
      comparableExpected = expected;
    }
  }
  const displayedActual = redactUrl(actual);
  const displayedExpected =
    normalizedExpected instanceof RegExp
      ? '[redacted URL pattern]'
      : redactUrl(normalizedExpected);
  const pass =
    comparableExpected instanceof RegExp
      ? matchesValue(actual, comparableExpected)
      : actual === comparableExpected;

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveUrl'),
        '',
        `Expected URL: ${this.utils.printExpected(displayedExpected)}`,
        `Received URL: ${this.utils.printReceived(displayedActual)}`,
        '',
        fetchMessageSummary(request),
      ].join('\n'),
    displayedActual,
    displayedExpected,
  );
}

export function toHaveQuery(
  this: MatcherContext,
  received: unknown,
  expected: QueryExpectation,
): MatcherResult {
  const invalid = requireRequest(this, 'toHaveQuery', received);
  if (invalid) return invalid;

  const request = received as Request;
  const actual = searchParamsToObject(new URL(request.url).searchParams);
  const pass = this.equals(actual, expected);
  const displayedActual = redactQueryValues(actual);
  const displayedExpected = redactQueryValues(expected);
  const difference =
    pass || this.equals(displayedExpected, displayedActual)
      ? undefined
      : this.utils.diff(displayedExpected, displayedActual);

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveQuery'),
        '',
        'Request query parameters did not match.',
        difference ??
          `Expected: ${this.utils.printExpected(displayedExpected)}\nReceived: ${this.utils.printReceived(displayedActual)}`,
        '',
        fetchMessageSummary(request),
      ].join('\n'),
    displayedActual,
    displayedExpected,
  );
}

export async function toHaveFormData(
  this: MatcherContext,
  received: unknown,
  expected: FormDataExpectation,
): Promise<MatcherResult> {
  const invalid = requireFetchMessage(this, 'toHaveFormData', received);
  if (invalid) return invalid;

  const message = received as Request | Response;
  let actual: Record<string, unknown>;

  try {
    actual = formDataToObject(await message.clone().formData());
  } catch (error) {
    return matcherError(
      this,
      'toHaveFormData',
      [
        'Expected message to contain valid form data, but its body could not be parsed.',
        `Reason: ${error instanceof Error ? error.message : String(error)}`,
        '',
        fetchMessageSummary(message),
      ].join('\n'),
    );
  }

  const pass = this.equals(actual, expected);
  const difference = pass ? undefined : this.utils.diff(expected, actual);

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toHaveFormData'),
        '',
        'Form data did not match.',
        difference ??
          `Expected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(actual)}`,
        '',
        fetchMessageSummary(message),
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
  const displayedLocation =
    location === null ? null : redactUrl(location);
  const displayedExpected = redactUrl(expected);
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
        `Expected redirect: ${expectedStatus ?? '3xx'} ${this.utils.printExpected(displayedExpected)}`,
        `Received response: ${response.status} ${this.utils.printReceived(displayedLocation)}`,
        '',
        responseSummary(response),
      ].join('\n'),
    { location: displayedLocation, status: response.status },
    { location: displayedExpected, status: expectedStatus ?? '3xx' },
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
  const displayedCookies = namedCookies.map((cookie) => ({
    ...cookie,
    value: '[redacted]',
  }));
  const displayedExpected =
    expected.value === undefined
      ? expected
      : { ...expected, value: '[redacted]' };

  return createResult(
    pass,
    () =>
      [
        this.utils.matcherHint('toSetCookie'),
        '',
        `Expected cookie ${this.utils.printExpected(name)} with:`,
        `  ${this.utils.printExpected(displayedExpected)}`,
        '',
        namedCookies.length === 0
          ? `No cookie named ${this.utils.printExpected(name)} was found.`
          : `Received matching-name cookies:\n${displayedCookies
              .map((cookie) => `  ${this.utils.printReceived(cookie)}`)
              .join('\n')}`,
        '',
        rawCookies.length === 0
          ? 'The response did not contain any Set-Cookie headers.'
          : `All Set-Cookie headers:\n${rawCookies.map(() => '  [redacted]').join('\n')}`,
      ].join('\n'),
    displayedCookies,
    displayedExpected,
  );
}

export const matchers = {
  toHaveFormData,
  toHaveHeader,
  toHaveJson,
  toHaveMethod,
  toHaveQuery,
  toHaveStatus,
  toHaveText,
  toHaveUrl,
  toRedirectTo,
  toSetCookie,
};

function searchParamsToObject(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const entries = [...new Set(searchParams.keys())].map((key) => {
    const values = searchParams.getAll(key);
    return [key, values.length === 1 ? values[0]! : values] as const;
  });

  return Object.fromEntries(entries);
}

function requestPath(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function redactQueryValues(
  query: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(() => '[redacted]') : '[redacted]',
    ]),
  );
}

function formDataToObject(formData: FormData): Record<string, unknown> {
  const entries = [...new Set(formData.keys())].map((key) => {
    const values = formData.getAll(key);
    return [key, values.length === 1 ? values[0]! : values] as const;
  });

  return Object.fromEntries(entries);
}
