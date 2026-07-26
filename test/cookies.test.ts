import { describe, expect, test } from 'vitest';

import {
  cookieMatches,
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

  test('does not split quoted extension attributes into phantom cookies', () => {
    expect(
      splitCombinedSetCookie(
        'session=abc; Extension="high,phantom=value", theme=dark; Path=/',
      ),
    ).toEqual([
      'session=abc; Extension="high,phantom=value"',
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

  test('accepts integer Max-Age values and ignores malformed values', () => {
    expect(parseSetCookie('session=abc; Max-Age=0')).toMatchObject({
      maxAge: 0,
    });
    expect(parseSetCookie('session=abc; Max-Age=-1')).toMatchObject({
      maxAge: -1,
    });
    expect(parseSetCookie('session=abc; Max-Age=')).not.toHaveProperty(
      'maxAge',
    );
    expect(parseSetCookie('session=abc; Max-Age=1.5')).not.toHaveProperty(
      'maxAge',
    );
    expect(parseSetCookie('session=abc; Max-Age=12seconds')).not.toHaveProperty(
      'maxAge',
    );
  });

  test('normalizes cookie domains case-insensitively without a leading dot', () => {
    expect(parseSetCookie('session=abc; Domain=.EXAMPLE.COM')).toMatchObject({
      domain: 'example.com',
    });
  });

  test('trims whitespace around cookie and attribute values', () => {
    expect(
      parseSetCookie(
        ' session \t= \tabc=123 \t; Domain \t= .EXAMPLE.COM \t; Path = /app ; SameSite = Lax ',
      ),
    ).toMatchObject({
      name: 'session',
      value: 'abc=123',
      domain: 'example.com',
      path: '/app',
      sameSite: 'lax',
    });
  });
});

describe('cookieMatches', () => {
  test('matches Domain and SameSite expectations case-insensitively', () => {
    expect(
      cookieMatches(
        {
          name: 'session',
          value: 'abc123',
          domain: 'example.com',
          sameSite: 'lax',
          secure: false,
          httpOnly: false,
        },
        { domain: '.EXAMPLE.COM', sameSite: 'Lax' },
      ),
    ).toBe(true);
  });

  test('does not mutate reusable regular expressions', () => {
    const expectedValue = /^abc/g;
    const expectedExpires = /2037/g;
    expectedValue.lastIndex = 2;
    expectedExpires.lastIndex = 3;

    expect(
      cookieMatches(
        {
          name: 'session',
          value: 'abc123',
          expires: 'Wed, 21 Oct 2037 07:28:00 GMT',
          secure: false,
          httpOnly: false,
        },
        { value: expectedValue, expires: expectedExpires },
      ),
    ).toBe(true);
    expect(expectedValue.lastIndex).toBe(2);
    expect(expectedExpires.lastIndex).toBe(3);
  });
});
