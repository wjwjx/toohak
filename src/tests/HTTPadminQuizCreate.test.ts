import request from 'sync-request-curl';
import config from '../config.json';

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;
const port = config.port;
const url = config.url;

export interface userToken {
  token: string,
}

let USERDATA: userToken;
beforeEach(() => {
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  const USER = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      {
        json: {
          email: 'name@name.com',
          password: 'testpassword123',
          nameFirst: 'Hayden',
          nameLast: 'Smith'
        }
      }
  );
  expect(USER.statusCode).toBe(200);
  USERDATA = JSON.parse(USER.body.toString());
});

describe('successful quiz creations v1', () => {
  test('successful quiz creation', () => {
    const res = request(
      'POST',
            `${url}:${port}/v1/admin/quiz`,
            {
              json: {
                token: USERDATA.token,
                name: 'What is one plus one',
                description: 'the answer is obviously 3'
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({
      quizId: expect.any(Number),
    });
  });
});

describe('error 400 v1', () => {
  test('fail - name contains invalid characters', () => {
    const res = request(
      'POST',
            `${url}:${port}/v1/admin/quiz`,
            {
              json: {
                token: USERDATA.token,
                name: 'what? th!s should fa*l',
                description: 'quiz shouldn\'t get created',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v1', () => {
  test('fail - invalid token structure', () => {
    const res = request(
      'POST',
            `${url}:${port}/v1/admin/quiz`,
            {
              json: {
                token: 'asdj123@#@',
                name: 'name of quiz',
                description: 'this is a test quiz',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('fail - valid token structure but not for a logged in session', () => {
    const res = request(
      'POST',
            `${url}:${port}/v1/admin/quiz`,
            {
              json: {
                token: USERDATA.token + 1,
                name: 'trying out fanta',
                description: 'test quiz',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(LOGGED_IN_SESSION);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 ROUTES
describe('successful quiz creations v2', () => {
  test('successful quiz creation', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'What is one plus one',
                description: 'the answer is obviously 3'
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({
      quizId: expect.any(Number),
    });
  });
});

describe('error 400 v2', () => {
  test('fail - name contains invalid characters', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'what? th!s should fa*l',
                description: 'quiz shouldn\'t get created',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('fail - name is less than 3 characters', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'e',
                description: 'quiz shouldnt get created',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('fail - quiz name is already in use', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'name is already used',
                description: 'quiz should be created',
              },
            }
    );
    expect(res.statusCode).toBe(OK);
    const res2 = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'name is already used',
                description: 'quiz should fail',
              },
            }
    );
    const bodyObj = JSON.parse(res2.body.toString());
    expect(res2.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('fail - description is more than 100 characters', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'name of quiz',
                description: 't'.repeat(150),
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v2', () => {
  test('fail - invalid token structure', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: '!*@&#(*!@&',
              },
              json: {
                name: 'name of quiz',
                description: 'this is a test quiz',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('fail - invalid token structure 2', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: '!#*(*!@&#',
              },
              json: {
                name: 'name of quiz',
                description: 'test quiz',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('fail - valid token structure but not for a logged in session', () => {
    const res = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token + 1,
              },
              json: {
                name: 'trying out fanta',
                description: 'test quiz',
              },
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(LOGGED_IN_SESSION);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});
