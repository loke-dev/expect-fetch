import type { CookieExpectation, ParsedCookie } from './types.js';
import { matchesRegExp } from './utils.js';

export function getSetCookieHeaders(headers: Headers): string[] {
  const getSetCookie = Reflect.get(headers, 'getSetCookie') as unknown;
  const values =
    typeof getSetCookie === 'function'
      ? (getSetCookie.call(headers) as string[])
      : undefined;

  if (values && values.length > 0) {
    return values;
  }

  const combined = headers.get('set-cookie');
  return combined ? splitCombinedSetCookie(combined) : [];
}

export function splitCombinedSetCookie(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"') {
      let backslashes = 0;
      for (
        let cursor = index - 1;
        cursor >= 0 && value[cursor] === '\\';
        cursor -= 1
      ) {
        backslashes += 1;
      }
      if (backslashes % 2 === 0) quoted = !quoted;
    } else if (
      value[index] === ',' &&
      !quoted &&
      /^\s*[^;,=\s]+=[^;,]*/.test(value.slice(index + 1))
    ) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

export function parseSetCookie(value: string): ParsedCookie | undefined {
  const parts = value.split(';').map((part) => part.trim());
  const pair = parts.shift();

  if (!pair) {
    return undefined;
  }

  const equalsIndex = pair.indexOf('=');
  if (equalsIndex === -1) {
    return undefined;
  }

  const name = pair.slice(0, equalsIndex).trim();
  if (!name) {
    return undefined;
  }

  const cookie: ParsedCookie = {
    name,
    value: pair.slice(equalsIndex + 1).trim(),
    secure: false,
    httpOnly: false,
  };

  for (const attribute of parts) {
    const attributeEqualsIndex = attribute.indexOf('=');
    const rawName =
      attributeEqualsIndex === -1
        ? attribute
        : attribute.slice(0, attributeEqualsIndex).trim();
    const rawValue =
      attributeEqualsIndex === -1
        ? undefined
        : attribute.slice(attributeEqualsIndex + 1).trim();

    switch (rawName.toLowerCase()) {
      case 'domain':
        if (rawValue !== undefined) {
          cookie.domain = rawValue.replace(/^\./, '').toLowerCase();
        }
        break;
      case 'path':
        if (rawValue !== undefined) cookie.path = rawValue;
        break;
      case 'expires':
        if (rawValue !== undefined) cookie.expires = rawValue;
        break;
      case 'max-age': {
        if (rawValue !== undefined && /^-?\d+$/.test(rawValue)) {
          const maxAge = Number(rawValue);
          if (Number.isFinite(maxAge)) {
            cookie.maxAge = maxAge;
          }
        }
        break;
      }
      case 'secure':
        cookie.secure = true;
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'samesite':
        if (rawValue !== undefined) {
          cookie.sameSite = rawValue.toLowerCase();
        }
        break;
    }
  }

  return cookie;
}

export function cookieMatches(
  cookie: ParsedCookie,
  expected: CookieExpectation,
): boolean {
  return (
    matchesString(cookie.value, expected.value) &&
    matchesDomain(cookie.domain, expected.domain) &&
    matchesOptional(cookie.path, expected.path) &&
    matchesExpires(cookie.expires, expected.expires) &&
    matchesOptional(cookie.maxAge, expected.maxAge) &&
    matchesOptional(cookie.secure, expected.secure) &&
    matchesOptional(cookie.httpOnly, expected.httpOnly) &&
    matchesSameSite(cookie.sameSite, expected.sameSite)
  );
}

function matchesString(
  actual: string,
  expected: string | RegExp | undefined,
): boolean {
  if (expected === undefined) {
    return true;
  }

  if (expected instanceof RegExp) {
    return matchesRegExp(actual, expected);
  }

  return actual === expected;
}

function matchesOptional<T>(
  actual: T | undefined,
  expected: T | undefined,
): boolean {
  return expected === undefined || actual === expected;
}

function matchesDomain(
  actual: string | undefined,
  expected: string | undefined,
): boolean {
  return (
    expected === undefined ||
    actual === expected.replace(/^\./, '').toLowerCase()
  );
}

function matchesSameSite(
  actual: string | undefined,
  expected: string | undefined,
): boolean {
  return expected === undefined || actual === expected.toLowerCase();
}

function matchesExpires(
  actual: string | undefined,
  expected: Date | string | RegExp | undefined,
): boolean {
  if (expected === undefined) {
    return true;
  }

  if (actual === undefined) {
    return false;
  }

  if (expected instanceof RegExp) {
    return matchesRegExp(actual, expected);
  }

  if (expected instanceof Date) {
    const actualTime = new Date(actual).getTime();
    const expectedTime = expected.getTime();

    return (
      Number.isFinite(actualTime) &&
      Number.isFinite(expectedTime) &&
      Math.floor(actualTime / 1_000) === Math.floor(expectedTime / 1_000)
    );
  }

  return actual === expected;
}
