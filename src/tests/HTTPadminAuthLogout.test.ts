import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;
const ERROR = { error: expect.any(String) };

interface DataRegister {
    token: string,
}

let res1;
let data1: DataRegister;

beforeEach(() => {
  const clearRes = request(
    'DELETE',
      `${url}:${port}/v1/clear`,
      { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  res1 = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  data1 = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });
});

// V2 Routes
test('Error: Token is not a valid structure', () => {
  const resLogout = request(
    'POST',
        `${url}:${port}/v2/admin/auth/logout`,
        { headers: { token: ')*(@!#92' } }
  );
  expect(resLogout.statusCode).toBe(401);
  const dataLogout = JSON.parse(resLogout.body.toString());
  expect(dataLogout).toStrictEqual(ERROR);
});

test('Sucessful logout & then Error: This token is for a user who has already logged out', () => {
  const resLogoutSucess = request(
    'POST',
        `${url}:${port}/v2/admin/auth/logout`,
        { headers: { token: data1.token } }
  );
  expect(resLogoutSucess.statusCode).toBe(200);
  const dataLogout1 = JSON.parse(resLogoutSucess.body.toString());
  expect(dataLogout1).toStrictEqual({});

  const resLogoutFail = request(
    'POST',
        `${url}:${port}/v2/admin/auth/logout`,
        { headers: { token: data1.token } }
  );
  expect(resLogoutFail.statusCode).toBe(400);
  const dataLogout2 = JSON.parse(resLogoutFail.body.toString());
  expect(dataLogout2).toStrictEqual(ERROR);
});

// V1 Routes
test('V1 Error: Token is not a valid structure', () => {
  const resLogout = request(
    'POST',
        `${url}:${port}/v1/admin/auth/logout`,
        { json: { token: ')*(@!#92' } }
  );
  expect(resLogout.statusCode).toBe(401);
  const dataLogout = JSON.parse(resLogout.body.toString());
  expect(dataLogout).toStrictEqual(ERROR);
});

test('V1 Sucessful logout & then Error: This token is for a user who has already logged out', () => {
  const resLogoutSucess = request(
    'POST',
        `${url}:${port}/v1/admin/auth/logout`,
        { json: { token: data1.token } }
  );
  expect(resLogoutSucess.statusCode).toBe(200);
  const dataLogout1 = JSON.parse(resLogoutSucess.body.toString());
  expect(dataLogout1).toStrictEqual({});

  const resLogoutFail = request(
    'POST',
        `${url}:${port}/v1/admin/auth/logout`,
        { json: { token: data1.token } }
  );
  expect(resLogoutFail.statusCode).toBe(400);
  const dataLogout2 = JSON.parse(resLogoutFail.body.toString());
  expect(dataLogout2).toStrictEqual(ERROR);
});
