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
});

describe('Endpoint Tests ERROR: POST /v1/admin/auth/register', () => {
  // Email Issues
  test.each([
    ['Invalid email format - No @', 'name.nametest.com', 'Passtest123', 'Correct', 'Correct'],
    ['Invalid email format - No top-level domain', 'name.name@test', 'Passtest123', 'Correct', 'Correct'],
    ['Invalid email format - No domain name before top-level domain', 'name.name@.com', 'Passtest123', 'Correct', 'Correct'],
    ['Invalid email format - Two periods in a row', 'name.name@test..com', 'Passtest123', 'Correct', 'Correct'],
    ['Invalid email format - No attempt at typing email correctly', 'namenametestcom', 'Passtest123', 'Correct', 'Correct'],
  ])('Error: %s',
    (description, email, password, nameFirst, nameLast) => {
      const res = request(
        'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast } }
      );
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body.toString());
      expect(data).toStrictEqual(ERROR);

      const res2 = request(
        'POST',
        `${url}:${port}/v1/admin/auth/login`,
        { json: { email: email, password: password } }
      );
      expect(res2.statusCode).toBe(400);
      const data2 = JSON.parse(res2.body.toString());
      expect(data2).toStrictEqual(ERROR);
    }
  );
  test('Error: Email address is used by another user', () => {
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ token: expect.any(String) });

    const res1 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res1.statusCode).toBe(400);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual(ERROR);

    const res2 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/login`,
      { json: { email: 'name.name@test.com', password: 'Passtest123' } }
    );

    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({ token: expect.any(String) });
  });
  // Name Issues
  test.each([
    ['Invalid characters in first name', 'name.name@test.com', 'Passtest123', 'Incorrect%^$', 'Correct'],
    ['First name length not in range - Less than 2 characters', 'name.name@test.com', 'Passtest123', 'I', 'Correct'],
    ['First name length not in range - More than 20 characters', 'name.name@test.com', 'Passtest123', 'I'.repeat(21), 'Correct'],
    ['Invalid characters in last name', 'name.name@test.com', 'Passtest123', 'Correct', 'Incorrect%^$'],
    ['Last name length not in range - Less than 2 characters', 'name.name@test.com', 'Passtest123', 'Correct', 'I'],
    ['Last name length not in range - More than 20 characters', 'name.name@test.com', 'Passtest123', 'Correct', 'I'.repeat(21)]
  ])('Error: %s',
    (description, email, password, nameFirst, nameLast) => {
      const res = request(
        'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast } }
      );
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body.toString());
      expect(data).toStrictEqual(ERROR);

      const res2 = request(
        'POST',
        `${url}:${port}/v1/admin/auth/login`,
        { json: { email: email, password: password } }
      );
      expect(res2.statusCode).toBe(400);
      const data2 = JSON.parse(res2.body.toString());
      expect(data2).toStrictEqual(ERROR);
    });
  // Password Issues
  test.each([
    ['Password less than 8 characters', 'name.name@test.com', 'Pass', 'Correct', 'Correct'],
    ['Password 8 or more characters but has no numbers', 'name.name@test.com', 'Passtest', 'Correct', 'Correct'],
    ['Password 8 or more characters but has no letters', 'name.name@test.com', '12345678', 'Correct', 'Correct']
  ])('Error: %s',
    (description, email, password, nameFirst, nameLast) => {
      const res = request(
        'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast } }
      );
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body.toString());
      expect(data).toStrictEqual(ERROR);

      const res2 = request(
        'POST',
        `${url}:${port}/v1/admin/auth/login`,
        { json: { email: email, password: password } }
      );
      expect(res2.statusCode).toBe(400);
      const data2 = JSON.parse(res2.body.toString());
      expect(data2).toStrictEqual(ERROR);
    }
  );
});

describe('Endpoint Tests SUCCESS: POST /v1/admin/auth/register', () => {
  test('Success: 2 users register with different emails', () => {
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    const res1 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res1.statusCode).toBe(200);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual({ token: expect.any(String) });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ token: expect.any(String) });
  });
  test.each([
    ['Correct email format - Standard', 'name.name@test.com', 'Passtest123', 'Correct', 'Correct'],
    ['Correct email format - Multi domain', 'name.name@test.co.uk', 'Passtest123', 'Correct', 'Correct'],
    ['Correct email format - Sign tagging', 'name.name+tag@test.com', 'Passtest123', 'Correct', 'Correct'],
    ['Correct email format - Complex', 'name.name+tag@test.co.uk', 'Passtest123', 'Correct', 'Correct'],
    ['Correct name - Simple Name All Characters Valid', 'name.name@test.com', 'Passtest123', 'Correct', 'Correct'],
    ['Correct name - Complex Name All Characters Valid', 'name.name@test.com', 'Passtest123', "CoR rEcT'-", "CoR rEcT'-"],
    ['Correct First and Last Name Length - Between 2 and 20 characters - 2 Characters', 'name.name@test.com', 'Passtest123', 'II', 'II'],
    ['Correct First and Last Name Length - Between 2 and 20 characters - 20 Characters', 'name.name@test.com', 'Passtest123', 'I'.repeat(20), 'I'.repeat(20)]
  ])('Success: %s',
    (description, email, password, nameFirst, nameLast) => {
      const res = request(
        'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast } }
      );
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body.toString());
      expect(data).toStrictEqual({ token: expect.any(String) });
    });
});
