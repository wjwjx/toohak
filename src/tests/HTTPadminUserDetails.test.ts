import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

beforeEach(() => {
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});
});

test('successful user details v1', () => {
  const res = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res.statusCode).toBe(200);
  const data = JSON.parse(res.body.toString());
  expect(data).toStrictEqual({ token: expect.any(String) });

  const res1 = request(
    'GET',
    `${url}:${port}/v1/admin/user/details`,
    { qs: { token: data.token } }
  );
  const data1 = JSON.parse(res1.body.toString());
  expect(res.statusCode).toBe(200);
  expect(data1).toStrictEqual({
    user: {
      userId: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
      numSuccessfulLogins: expect.any(Number),
      numFailedPasswordsSinceLastLogin: expect.any(Number),
    },
  });
});

test('fail - invalid token structure v1', () => {
  const res = request(
    'GET',
      `${url}:${port}/v1/admin/user/details`,
      { qs: { token: '912!@#' } }
  );
  const data = JSON.parse(res.body.toString());
  expect(res.statusCode).toBe(401);
  expect(data).toStrictEqual({ error: expect.any(String) });
});

test('fail - provided token is valid structure, but not for a currently logged in session v1', () => {
  const res = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res.statusCode).toBe(200);
  const data = JSON.parse(res.body.toString());
  expect(data).toStrictEqual({ token: expect.any(String) });

  const res1 = request(
    'GET',
    `${url}:${port}/v1/admin/user/details`,
    { qs: { token: (Number(data.token) + 1).toString() } }
  );

  const bodyObj = JSON.parse(res1.body.toString());
  expect(res1.statusCode).toBe(403);
  expect(bodyObj).toStrictEqual({ error: expect.any(String) });
});

// V2 ROUTE

test('successful user details v2', () => {
  const res = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res.statusCode).toBe(200);
  const data = JSON.parse(res.body.toString());
  expect(data).toStrictEqual({ token: expect.any(String) });

  const res1 = request(
    'GET',
    `${url}:${port}/v2/admin/user/details`,
    { headers: { token: data.token } }
  );
  const data1 = JSON.parse(res1.body.toString());
  expect(res.statusCode).toBe(200);
  expect(data1).toStrictEqual({
    user: {
      userId: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
      numSuccessfulLogins: expect.any(Number),
      numFailedPasswordsSinceLastLogin: expect.any(Number),
    },
  });
});

test('fail - invalid token structure v2', () => {
  const res = request(
    'GET',
      `${url}:${port}/v2/admin/user/details`,
      { headers: { token: '912!@#' } }
  );
  const data = JSON.parse(res.body.toString());
  expect(res.statusCode).toBe(401);
  expect(data).toStrictEqual({ error: expect.any(String) });
});

test('fail - provided token is valid structure, but not for a currently logged in session v2', () => {
  const res = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res.statusCode).toBe(200);
  const data = JSON.parse(res.body.toString());
  expect(data).toStrictEqual({ token: expect.any(String) });

  const res1 = request(
    'GET',
    `${url}:${port}/v2/admin/user/details`,
    { headers: { token: (Number(data.token) + 1).toString() } }
  );

  const bodyObj = JSON.parse(res1.body.toString());
  expect(res1.statusCode).toBe(403);
  expect(bodyObj).toStrictEqual({ error: expect.any(String) });
});
