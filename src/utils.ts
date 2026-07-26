import type {
  HeaderExpectation,
  MatcherContext,
  MatcherResult,
} from './types.js';

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'set-cookie',
]);

export function matcherError(
  context: MatcherContext,
  matcherName: string,
  details: string,
): MatcherResult {
  return {
    pass: false,
    message: () =>
      `${context.utils.matcherHint(matcherName)}\n\n${details}`,
  };
}

export function requireResponse(
  context: MatcherContext,
  matcherName: string,
  received: unknown,
): MatcherResult | undefined {
  if (
    !isFetchMessageLike(received) ||
    typeof (received as { status?: unknown }).status !== 'number'
  ) {
    return matcherError(
      context,
      matcherName,
      `Expected a Fetch API Response, but received ${context.utils.printReceived(received)}.`,
    );
  }

  return undefined;
}

export function requireRequest(
  context: MatcherContext,
  matcherName: string,
  received: unknown,
): MatcherResult | undefined {
  if (
    !isFetchMessageLike(received) ||
    typeof (received as { method?: unknown }).method !== 'string' ||
    typeof (received as { url?: unknown }).url !== 'string'
  ) {
    return matcherError(
      context,
      matcherName,
      `Expected a Fetch API Request, but received ${context.utils.printReceived(received)}.`,
    );
  }

  return undefined;
}

export function requireFetchMessage(
  context: MatcherContext,
  matcherName: string,
  received: unknown,
): MatcherResult | undefined {
  if (!isFetchMessageLike(received)) {
    return matcherError(
      context,
      matcherName,
      `Expected a Fetch API Request or Response, but received ${context.utils.printReceived(received)}.`,
    );
  }

  return undefined;
}

function isFetchMessageLike(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  const message = value as { clone?: unknown; headers?: unknown };
  if (typeof message.clone !== 'function') return false;
  if (message.headers === null || typeof message.headers !== 'object') {
    return false;
  }
  const headers = message.headers as { entries?: unknown; get?: unknown };
  return (
    typeof headers.get === 'function' && typeof headers.entries === 'function'
  );
}

export function matchesValue(
  actual: string,
  expected: HeaderExpectation,
): boolean {
  if (expected instanceof RegExp) {
    expected.lastIndex = 0;
    return expected.test(actual);
  }

  return actual === expected;
}

export function redactHeaderValue(name: string, value: unknown): unknown {
  return SENSITIVE_HEADER_NAMES.has(name.toLowerCase())
    ? '[redacted]'
    : value;
}

export function formatHeaders(headers: Headers): string {
  const entries = [...headers.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length === 0) {
    return '  (none)';
  }

  return entries
    .map(([name, value]) => `  ${name}: ${redactHeaderValue(name, value)}`)
    .join('\n');
}

export function responseSummary(response: Response): string {
  return [
    `Response: ${response.status} ${response.statusText}`.trimEnd(),
    'Headers:',
    formatHeaders(response.headers),
  ].join('\n');
}

export function fetchMessageSummary(message: Request | Response): string {
  if ('status' in message) {
    return responseSummary(message);
  }

  return [
    `Request: ${message.method} ${message.url}`,
    'Headers:',
    formatHeaders(message.headers),
  ].join('\n');
}

export function createResult(
  pass: boolean,
  message: () => string,
  actual?: unknown,
  expected?: unknown,
): MatcherResult {
  const result: MatcherResult = { pass, message };

  if (actual !== undefined) {
    result.actual = actual;
  }

  if (expected !== undefined) {
    result.expected = expected;
  }

  return result;
}
