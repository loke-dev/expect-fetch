import { describe, expect, test } from 'vitest';

import {
  parseSetCookie,
  splitCombinedSetCookie,
} from '../src/cookies.js';

describe('splitCombinedSetCookie', () => {
  test('does not split the comma inside Expires', () => {
    expect(
      splitCombinedSetCookie(
        'session=abc; Expires=Wed, 21 Oct 2037 07:28:00 GMT, theme=dark; Path=/',
      ),
    ).toEqual([
      'session=abc; Expires=Wed, 21 Oct 2037 07:28:00 GMT',
      'theme=dark; Path=/',
    ]);
  });
});

describe('parseSetCookie', () => {
  test('parses common cookie attributes case-insensitively', () => {
    expect(
      parseSetCookie(
        'session=abc=123; DOMAIN=example.com; Path=/; HTTPONLY; SECURE; SameSite=None; Max-Age=60',
      ),
    ).toEqual({
      name: 'session',
      value: 'abc=123',
      domain: 'example.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60,
    });
  });
});
