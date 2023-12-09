import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  const res1 = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  const data1 = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });
});

// Register a second user. Login with an email different from the 2 registered
test('Error: Email address does not exist', () => {
  const res2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2 = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  const resLogin = request(
    'POST',
    `${url}:${port}/v1/admin/auth/login`,
    { json: { email: 'name.name3@test.com', password: 'Passtest123' } }
  );
  expect(resLogin.statusCode).toBe(400);
  const dataLogin = JSON.parse(resLogin.body.toString());
  expect(dataLogin).toStrictEqual(ERROR);
});
// Login using the incorrect password
test('Error: Password is not correct for the given email', () => {
  const resLogin = request(
    'POST',
    `${url}:${port}/v1/admin/auth/login`,
    { json: { email: 'name.name1@test.com', password: 'Passtest12345' } }
  );
  expect(resLogin.statusCode).toBe(400);
  const dataLogin = JSON.parse(resLogin.body.toString());
  expect(dataLogin).toStrictEqual(ERROR);
});
// Successful login
test('Success: Valid Email and Password only 1 user', () => {
  const resLogin = request(
    'POST',
    `${url}:${port}/v1/admin/auth/login`,
    { json: { email: 'name.name1@test.com', password: 'Passtest123' } }
  );
  expect(resLogin.statusCode).toBe(200);
  const dataLogin = JSON.parse(resLogin.body.toString());
  expect(dataLogin).toStrictEqual({ token: expect.any(String) });
});
// Register a second user. Login with the first to ensure data saved correctly
test('Success: Valid Email and Password 2 users', () => {
  const res2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2 = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  const resLogin = request(
    'POST',
    `${url}:${port}/v1/admin/auth/login`,
    { json: { email: 'name.name1@test.com', password: 'Passtest123' } }
  );
  expect(resLogin.statusCode).toBe(200);
  const dataLogin = JSON.parse(resLogin.body.toString());
  expect(dataLogin).toStrictEqual({ token: expect.any(String) });
});
// Register 4 more users. Login using the last one correctly
test('Success: Valid Email and Password last user of 5 users', () => {
  const res2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2 = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  const res3 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name3@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res3.statusCode).toBe(200);
  const data3 = JSON.parse(res3.body.toString());
  expect(data3).toStrictEqual({ token: expect.any(String) });

  const res4 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name4@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res4.statusCode).toBe(200);
  const data4 = JSON.parse(res4.body.toString());
  expect(data4).toStrictEqual({ token: expect.any(String) });

  const res5 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name5@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res5.statusCode).toBe(200);
  const data5 = JSON.parse(res5.body.toString());
  expect(data5).toStrictEqual({ token: expect.any(String) });

  const resLogin = request(
    'POST',
    `${url}:${port}/v1/admin/auth/login`,
    { json: { email: 'name.name5@test.com', password: 'Passtest123' } }
  );
  expect(resLogin.statusCode).toBe(200);
  const dataLogin = JSON.parse(resLogin.body.toString());
  expect(dataLogin).toStrictEqual({ token: expect.any(String) });
});
