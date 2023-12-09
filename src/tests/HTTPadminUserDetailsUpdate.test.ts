import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

export interface usertoken {
    token: string,
}

let USERDATA1: usertoken;
let USERDATA2: usertoken;

beforeEach(() => {
  // clear the data
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  // register 1 user
  const res1 = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  const data1 = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  USERDATA1 = JSON.parse(res1.body.toString());

  // register 2nd user
  const res2 = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'test.test@test.com', password: 'PassTEST143', nameFirst: 'Incorrect', nameLast: 'Incorrect' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2 = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  USERDATA2 = JSON.parse(res2.body.toString());
});

describe('successful detail update v1', () => {
  test('success in changing user 1', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v1/admin/user/details`,
        {
          headers: {
            token: USERDATA1.token,
          },
          json: {
            email: 'test124@test.com',
            nameFirst: 'pAss',
            nameLast: 'pSa',
          }
        }
    );
    expect(update1.statusCode).toBe(200);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({});
  });
});

describe('error 400 v1', () => {
  test('email is already used by another user', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v1/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'test.test@test.com',
          nameFirst: 'sup-e314',
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v1', () => {
  test('token is invalid structure', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v1/admin/user/details`,
        {
          headers: {
            token: ')!(@*#@!*',
          },
          json: {
            email: 'yeah124@test.com',
            nameFirst: 'thajdkash',
            nameLast: 'pean ut',
          }
        }
    );
    expect(update1.statusCode).toBe(401);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('nameFirst contains more than 20 characters', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v1/admin/user/details`,
        {
          headers: {
            token: USERDATA1.token + 5,
          },
          json: {
            email: 'yeah124@test.com',
            nameFirst: 'tdjaslkdj',
            nameLast: 'pean ut',
          }
        }
    );
    expect(update1.statusCode).toBe(403);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 ROUTES
describe('successful detail update v2', () => {
  test('success in changing user 1', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v2/admin/user/details`,
        {
          headers: {
            token: USERDATA1.token,
          },
          json: {
            email: 'test124@test.com',
            nameFirst: 'pAss',
            nameLast: 'pSa',
          }
        }
    );
    expect(update1.statusCode).toBe(200);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({});
  });
  test('success in changing user 2', () => {
    const update2 = request(
      'PUT',
        `${url}:${port}/v2/admin/user/details`,
        {
          headers: {
            token: USERDATA2.token,
          },
          json: {
            email: 'yeah123@test.com',
            nameFirst: 'sup-e',
            nameLast: 'pean ut',
          }
        }
    );
    expect(update2.statusCode).toBe(200);
    const data = JSON.parse(update2.body.toString());
    expect(data).toStrictEqual({});
  });
  test('success in changing user 2 with apostrophies, spaces, hypens, etc.', () => {
    const update2 = request(
      'PUT',
        `${url}:${port}/v2/admin/user/details`,
        {
          headers: {
            token: USERDATA2.token,
          },
          json: {
            email: 'ye123@test.com',
            nameFirst: "su'-",
            nameLast: 'pean -ut',
          }
        }
    );
    expect(update2.statusCode).toBe(200);
    const data = JSON.parse(update2.body.toString());
    expect(data).toStrictEqual({});
  });
});

describe('error 400 v2', () => {
  test('email is already used by another user', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'test.test@test.com',
          nameFirst: 'sup-e314',
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('email does not satisfy validator email', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA2.token,
        },
        json: {
          email: '(*!@&#LPA',
          nameFirst: 'sup-e314',
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameFirst contains letters other than lowercase, uppercase, spaces, hyphens, etc.', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 'sup-!&!(e314',
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameLast contains letters other than lowercase, uppercase, spaces, hyphens, etc.', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 'sup-314',
          nameLast: 'pean)!(*@#',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameFirst contains less than 2 characters', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 's',
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameFirst contains more than 20 characters', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 't'.repeat(50),
          nameLast: 'pean ut',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameLast contains less than 2 characters', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 'tasjkdn',
          nameLast: 'p',
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
  test('nameLast contains more than 20 characters', () => {
    const update1 = request(
      'PUT',
      `${url}:${port}/v2/admin/user/details`,
      {
        headers: {
          token: USERDATA1.token,
        },
        json: {
          email: 'yeah124@test.com',
          nameFirst: 'tkjkahd',
          nameLast: 'peanut'.repeat(20),
        }
      }
    );
    expect(update1.statusCode).toBe(400);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v2', () => {
  test('token is invalid structure', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v2/admin/user/details`,
        {
          headers: {
            token: ')!(@*#@!*',
          },
          json: {
            email: 'yeah124@test.com',
            nameFirst: 'thajdkash',
            nameLast: 'pean ut',
          }
        }
    );
    expect(update1.statusCode).toBe(401);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('nameFirst contains more than 20 characters', () => {
    const update1 = request(
      'PUT',
        `${url}:${port}/v2/admin/user/details`,
        {
          headers: {
            token: USERDATA1.token + 5,
          },
          json: {
            email: 'yeah124@test.com',
            nameFirst: 'tdjaslkdj',
            nameLast: 'pean ut',
          }
        }
    );
    expect(update1.statusCode).toBe(403);
    const data = JSON.parse(update1.body.toString());
    expect(data).toStrictEqual({ error: expect.any(String) });
  });
});
