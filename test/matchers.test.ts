import '../src/vitest.js';

import { describe, expect, test } from 'vitest';

describe('toHaveStatus', () => {
  test('matches a response status', () => {
    const response = new Response(null, { status: 204 });

    expect(response).toHaveStatus(204);
    expect(() => expect(response).toHaveStatus(200)).toThrow(/Received status/);
  });

  test('rejects non-response values clearly', () => {
    expect(() => expect({ status: 200 }).toHaveStatus(200)).toThrow(
      /Fetch API Response/,
    );
  });
});

describe('toHaveHeader', () => {
  test('matches header presence, exact values, and patterns', () => {
    const response = Response.json(
      { ok: true },
      { headers: { 'x-request-id': 'req_123' } },
    );

    expect(response).toHaveHeader('content-type');
    expect(response).toHaveHeader('x-request-id', 'req_123');
    expect(response).toHaveHeader('content-type', /json/);
  });

  test('reports missing headers', () => {
    const response = new Response();

    expect(() => expect(response).toHaveHeader('x-request-id')).toThrow(
      /missing/,
    );
  });

  test('redacts sensitive values from failure messages', () => {
    const request = new Request('https://example.test/users', {
      headers: {
        authorization: 'Bearer actual-secret',
        'cf-access-client-secret': 'cloudflare-secret',
        cookie: 'session=cookie-secret',
        'x-api-key': 'api-key-secret',
        'x-auth-token': 'auth-token-secret',
        'x-user-password': 'user-password-value',
        'x_user_password': 'underscore-password-value',
        'x-credential': 'credential-value',
        'x-request-id': 'req_123',
      },
    });

    let message = '';
    try {
      expect(request).toHaveHeader(
        'authorization',
        'Bearer expected-secret',
      );
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('[redacted]');
    expect(message).toContain('req_123');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('api-key-secret');
    expect(message).not.toContain('auth-token-secret');
    expect(message).not.toContain('cloudflare-secret');
    expect(message).not.toContain('expected-secret');
    expect(message).not.toContain('cookie-secret');
    expect(message).not.toContain('user-password-value');
    expect(message).not.toContain('underscore-password-value');
    expect(message).not.toContain('credential-value');
  });

  test('matches request headers', () => {
    const request = new Request('https://example.test/users', {
      headers: { authorization: 'Bearer token' },
    });

    expect(request).toHaveHeader('authorization', /^Bearer /);
  });
});

describe('toHaveJson', () => {
  test('matches JSON and preserves the original body', async () => {
    const response = Response.json({ id: '123', name: 'Ada' });

    await expect(response).toHaveJson({
      id: expect.any(String),
      name: 'Ada',
    });

    await expect(response.json()).resolves.toEqual({
      id: '123',
      name: 'Ada',
    });
  });

  test('shows a useful error for invalid JSON', async () => {
    const response = new Response('not json', {
      headers: { 'content-type': 'application/json' },
    });

    await expect(expect(response).toHaveJson({ ok: true })).rejects.toThrow(
      /could not be parsed/,
    );
  });

  test('matches a request body without consuming it', async () => {
    const request = new Request('https://example.test/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada' }),
    });

    await expect(request).toHaveJson({ name: 'Ada' });
    await expect(request.json()).resolves.toEqual({ name: 'Ada' });
  });
});

describe('toHaveText', () => {
  test('matches exact strings and patterns without consuming the body', async () => {
    const response = new Response('Not found');

    await expect(response).toHaveText('Not found');
    await expect(response).toHaveText(/found$/);
    await expect(response.text()).resolves.toBe('Not found');
  });

  test('does not mutate reusable regular expressions', async () => {
    const expected = /found$/g;
    expected.lastIndex = 2;

    await expect(new Response('Not found')).toHaveText(expected);

    expect(expected.lastIndex).toBe(2);
  });
});

describe('toRedirectTo', () => {
  test('matches redirect location and status', () => {
    const response = new Response(null, {
      status: 307,
      headers: { location: '/login' },
    });

    expect(response).toRedirectTo('/login');
    expect(response).toRedirectTo('/login', 307);
  });

  test('requires a redirect status', () => {
    const response = new Response(null, {
      status: 200,
      headers: { location: '/login' },
    });

    expect(() => expect(response).toRedirectTo('/login')).toThrow(
      /Expected redirect/,
    );
  });

  test('redacts query values from redirect diagnostics', () => {
    const response = new Response(null, {
      status: 302,
      headers: {
        location: '/login?token=actual-secret&next=home',
      },
    });

    let message = '';
    try {
      expect(response).toRedirectTo('/login?token=expected-secret');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('token=%5Bredacted%5D');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('expected-secret');
    expect(message).not.toContain('next=home');
  });

  test('redacts credentials from redirect diagnostics', () => {
    const response = new Response(null, {
      status: 302,
      headers: {
        location: 'https://user:actual-secret@example.test/login',
      },
    });

    let message = '';
    try {
      expect(response).toRedirectTo('/other');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('https://example.test/login');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('user@');
  });

  test('redacts URL fragments from failure diagnostics', () => {
    const request = new Request(
      'https://example.test/callback#access_token=actual-secret',
    );

    let message = '';
    try {
      expect(request).toHaveUrl('/other#access_token=expected-secret');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('#[redacted]');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('expected-secret');
  });
});

describe('toSetCookie', () => {
  test('matches cookie values and security attributes', () => {
    const response = new Response(null, {
      headers: {
        'set-cookie':
          'session=abc123; Domain=.EXAMPLE.COM; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600',
      },
    });

    expect(response).toSetCookie('session');
    expect(response).toSetCookie('session', {
      value: /^abc/,
      domain: '.EXAMPLE.COM',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 3600,
    });
  });

  test('handles multiple cookies and Expires commas', () => {
    const headers = new Headers();
    headers.append(
      'set-cookie',
      'session=abc; Expires=Wed, 21 Oct 2037 07:28:00 GMT; HttpOnly',
    );
    headers.append('set-cookie', 'theme=dark; Path=/; SameSite=Strict');
    const response = new Response(null, { headers });

    expect(response).toSetCookie('session', {
      expires: /21 Oct 2037/,
      httpOnly: true,
    });
    expect(response).toSetCookie('theme', {
      value: 'dark',
      sameSite: 'strict',
    });
  });

  test('matches browser-tolerated whitespace around cookie fields', () => {
    const response = new Response(null, {
      headers: {
        'set-cookie':
          ' session = abc123 ; Domain = .EXAMPLE.COM ; Path = / ; SameSite = Lax ',
      },
    });

    expect(response).toSetCookie('session', {
      value: 'abc123',
      domain: 'example.com',
      path: '/',
      sameSite: 'lax',
    });
  });

  test('reports absent cookies', () => {
    const response = new Response();

    expect(() => expect(response).toSetCookie('session')).toThrow(
      /did not contain any Set-Cookie/,
    );
  });

  test('redacts cookie values from failure messages', () => {
    const response = new Response(null, {
      headers: {
        'set-cookie':
          'session=actual-secret; Path=/; HttpOnly, theme=private-value; Path=/',
      },
    });

    let message = '';
    try {
      expect(response).toSetCookie('session', {
        value: 'expected-secret',
        secure: true,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('[redacted]');
    expect(message).toContain('httpOnly');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('expected-secret');
    expect(message).not.toContain('private-value');
  });
});

describe('request matchers', () => {
  test('redacts query values from URL failure diagnostics', () => {
    const request = new Request(
      'https://example.test/reset?token=actual-secret&user=ada',
    );

    let message = '';
    try {
      expect(request).toHaveUrl('/reset?token=expected-secret');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('token=%5Bredacted%5D');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('expected-secret');
  });

  test('matches methods case-insensitively', () => {
    const request = new Request('https://example.test/users', {
      method: 'POST',
    });

    expect(request).toHaveMethod('post');
    expect(() => expect(request).toHaveMethod('GET')).toThrow(
      /Received method/,
    );
  });

  test('matches relative, absolute, URL, and patterned URLs', () => {
    const request = new Request(
      'https://example.test/users?page=2#results',
    );

    expect(request).toHaveUrl('/users?page=2#results');
    expect(request).toHaveUrl('?page=2#results');
    expect(request).toHaveUrl('#results');
    expect(request).toHaveUrl('users?page=2#results');
    expect(request).toHaveUrl(
      'https://example.test/users?page=2#results',
    );
    expect(request).toHaveUrl(
      new URL('https://example.test/users?page=2#results'),
    );
    expect(request).toHaveUrl(/^https:\/\/example\.test\/users/);
  });

  test('matches decoded query values and repeated parameters', () => {
    const request = new Request(
      'https://example.test/search?q=Ada%20Lovelace&tag=math&tag=code',
    );

    expect(request).toHaveQuery({
      q: 'Ada Lovelace',
      tag: ['math', 'code'],
    });
  });

  test('redacts query values from failure diagnostics', () => {
    const request = new Request(
      'https://example.test/search?token=actual-secret&tag=private-value',
    );

    let message = '';
    try {
      expect(request).toHaveQuery({
        token: 'expected-secret',
        tag: 'expected-value',
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('token');
    expect(message).toContain('[redacted]');
    expect(message).not.toContain('actual-secret');
    expect(message).not.toContain('expected-secret');
    expect(message).not.toContain('private-value');
    expect(message).not.toContain('expected-value');
  });

  test('preserves query names that overlap object prototype properties', () => {
    const request = new Request(
      'https://example.test/search?__proto__=safe&constructor=native',
    );

    expect(request).toHaveQuery(
      Object.fromEntries([
        ['__proto__', 'safe'],
        ['constructor', 'native'],
      ]),
    );
  });

  test('matches form data and preserves the original body', async () => {
    const form = new FormData();
    form.append('name', 'Ada');
    form.append('role', 'admin');
    form.append('role', 'author');
    const request = new Request('https://example.test/users', {
      method: 'POST',
      body: form,
    });

    await expect(request).toHaveFormData({
      name: 'Ada',
      role: ['admin', 'author'],
    });

    await expect(request.formData()).resolves.toMatchObject({
      get: expect.any(Function),
    });
  });

  test('preserves form field names that overlap object prototype properties', async () => {
    const form = new FormData();
    form.append('__proto__', 'safe');
    form.append('constructor', 'native');
    const request = new Request('https://example.test/users', {
      method: 'POST',
      body: form,
    });

    await expect(request).toHaveFormData(
      Object.fromEntries([
        ['__proto__', 'safe'],
        ['constructor', 'native'],
      ]),
    );
  });

  test('rejects response-only and request-only matcher inputs', () => {
    const response = new Response();
    const request = new Request('https://example.test');

    expect(() => expect(response).toHaveMethod('GET')).toThrow(
      /Fetch API Request/,
    );
    expect(() => expect(request).toHaveStatus(200)).toThrow(
      /Fetch API Response/,
    );
  });

  test('rejects malformed structural lookalikes with matcher guidance', () => {
    const responseLike = {
      status: 200,
      headers: {},
      clone: null,
    };
    const requestLike = {
      method: 42,
      url: new URL('https://example.test'),
      headers: new Headers(),
      clone() {
        return this;
      },
    };

    expect(() => expect(responseLike).toHaveStatus(200)).toThrow(
      /Fetch API Response/,
    );
    expect(() => expect(requestLike).toHaveMethod('GET')).toThrow(
      /Fetch API Request/,
    );
    expect(() => expect(responseLike).toHaveHeader('content-type')).toThrow(
      /Fetch API Request or Response/,
    );
  });
});
