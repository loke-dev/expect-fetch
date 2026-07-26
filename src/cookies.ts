import type { CookieExpectation, ParsedCookie } from './types.js';

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
  return value
    .split(/,(?=\s*[^;,=\s]+=[^;,]*)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseSetCookie(value: string): ParsedCookie | undefined {
  const parts = value.split(';').map((part) => part.trim());
  const pair = parts.shift();

  if (!pair) {
    return undefined;
  }

  const equalsIndex = pair.indexOf('=');
  if (equalsIndex <= 0) {
    return undefined;
  }

  const cookie: ParsedCookie = {
    name: pair.slice(0, equalsIndex),
    value: pair.slice(equalsIndex + 1),
    secure: false,
    httpOnly: false,
  };

  for (const attribute of parts) {
    const attributeEqualsIndex = attribute.indexOf('=');
    const rawName =
      attributeEqualsIndex === -1
        ? attribute
        : attribute.slice(0, attributeEqualsIndex);
    const rawValue =
      attributeEqualsIndex === -1
        ? undefined
        : attribute.slice(attributeEqualsIndex + 1);

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
    matchesOptional(cookie.domain, expected.domain) &&
    matchesOptional(cookie.path, expected.path) &&
    matchesExpires(cookie.expires, expected.expires) &&
    matchesOptional(cookie.maxAge, expected.maxAge) &&
    matchesOptional(cookie.secure, expected.secure) &&
    matchesOptional(cookie.httpOnly, expected.httpOnly) &&
    matchesOptional(cookie.sameSite, expected.sameSite)
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
    expected.lastIndex = 0;
    return expected.test(actual);
  }

  return actual === expected;
}

function matchesOptional<T>(
  actual: T | undefined,
  expected: T | undefined,
): boolean {
  return expected === undefined || actual === expected;
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
    expected.lastIndex = 0;
    return expected.test(actual);
  }

  if (expected instanceof Date) {
    return new Date(actual).getTime() === expected.getTime();
  }

  return actual === expected;
}
