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
});

describe('toHaveText', () => {
  test('matches exact strings and patterns without consuming the body', async () => {
    const response = new Response('Not found');

    await expect(response).toHaveText('Not found');
    await expect(response).toHaveText(/found$/);
    await expect(response.text()).resolves.toBe('Not found');
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
});

describe('toSetCookie', () => {
  test('matches cookie values and security attributes', () => {
    const response = new Response(null, {
      headers: {
        'set-cookie':
          'session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600',
      },
    });

    expect(response).toSetCookie('session');
    expect(response).toSetCookie('session', {
      value: /^abc/,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
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

  test('reports absent cookies', () => {
    const response = new Response();

    expect(() => expect(response).toSetCookie('session')).toThrow(
      /did not contain any Set-Cookie/,
    );
  });
});
