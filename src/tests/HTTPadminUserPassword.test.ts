import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;
const ERROR = { error: expect.any(String) };

interface DataRegister {
  token: string,
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;

beforeEach(() => {
  clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  dataClear = JSON.parse(clearRes.body.toString());
  expect(dataClear).toEqual({});

  resRegister = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(resRegister.statusCode).toBe(200);
  dataRegister = JSON.parse(resRegister.body.toString());
  expect(dataRegister).toStrictEqual({ token: expect.any(String) });
});

// V2 Routes
test('Token is not a valid structure ', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: '12*!@#' },
      json: { oldPassword: 'Passtest123', newPassword: 'Newpass123' }
    }
  );
  expect(resPass.statusCode).toBe(401);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('Token is valid but not for a currently logged in session', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token + 1 },
      json: { oldPassword: 'Passtest123', newPassword: 'Newpass123' }
    }
  );
  expect(resPass.statusCode).toBe(403);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('Old password is not the correct old password', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest1234', newPassword: 'Newpass123' }
    }
  );
  expect(resPass.statusCode).toBe(400);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('New password has already been used before by its user', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest123', newPassword: 'Passtest1234' }
    }
  );
  expect(resPass.statusCode).toBe(200);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual({});

  const resPass2 = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest1234', newPassword: 'Passtest123' }
    }
  );
  expect(resPass2.statusCode).toBe(400);
  const dataPass2 = JSON.parse(resPass2.body.toString());
  expect(dataPass2).toStrictEqual(ERROR);
});

test('New password is less than 8 characters', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest123', newPassword: 'hello1' }
    }
  );
  expect(resPass.statusCode).toBe(400);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('New password does not contain at least one number and at least one letter', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest123', newPassword: '@#$^%@#$^%' }
    }
  );
  expect(resPass.statusCode).toBe(400);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('New password exactly same as old password', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest123', newPassword: 'Passtest123' }
    }
  );
  expect(resPass.statusCode).toBe(400);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('Success in changing passwords', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v2/admin/user/password`,
    {
      headers: { token: dataRegister.token },
      json: { oldPassword: 'Passtest123', newPassword: 'Newtest1234' }
    }
  );
  expect(resPass.statusCode).toBe(200);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual({});
});

// V1 Routes
test('V1 Token is not a valid structure ', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v1/admin/user/password`,
    { json: { token: '12*!@#', oldPassword: 'Passtest123', newPassword: 'Newpass123' } }
  );
  expect(resPass.statusCode).toBe(401);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('V1 Token is valid but not for a currently logged in session', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v1/admin/user/password`,
    { json: { token: dataRegister.token + 1, oldPassword: 'Passtest123', newPassword: 'Newpass123' } }
  );
  expect(resPass.statusCode).toBe(403);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('V1 Old password is not the correct old password', () => {
  const resPass = request(
    'PUT',
    `${url}:${port}/v1/admin/user/password`,
    { json: { token: dataRegister.token, oldPassword: 'Passtest1234', newPassword: 'Newpass123' } }
  );
  expect(resPass.statusCode).toBe(400);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual(ERROR);
});

test('V1 Success in changing passwords', () => {
  const resPass = request(
    'PUT',
      `${url}:${port}/v1/admin/user/password`,
      { json: { token: dataRegister.token, oldPassword: 'Passtest123', newPassword: 'Newtest1234' } }
  );
  expect(resPass.statusCode).toBe(200);
  const dataPass = JSON.parse(resPass.body.toString());
  expect(dataPass).toStrictEqual({});
});
