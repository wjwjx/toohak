import request from 'sync-request-curl';
import config from '../config.json';
import { quizReturn, userToken } from './HTTPadminQuestionDelete.test';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;

let USERDATA: userToken;

beforeEach(() => {
  // clear all data

  const clearRes = request(
    'DELETE',
        `${url}:${port}/v1/clear`,
        { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  // register a user

  const userRegister = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(userRegister.statusCode).toBe(200);
  const data1 = JSON.parse(userRegister.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  // setting USERDATA

  USERDATA = JSON.parse(userRegister.body.toString());

  // registered user creates a quiz

  const quizCreate = request(
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
  const bodyObj = JSON.parse(quizCreate.body.toString());
  expect(quizCreate.statusCode).toBe(OK);
  expect(bodyObj).toStrictEqual({ quizId: expect.any(Number) });
  const quizIdStringObj: quizReturn = JSON.parse(quizCreate.body.toString());
  const quizIdString: string = quizIdStringObj.quizId.toString();

  const quizCreatev2 = request(
    'POST',
        `${url}:${port}/v2/admin/quiz`,
        {
          headers: {
            token: USERDATA.token,
          },
          json: {
            name: 'test 3',
            description: 'this is a test quiz'
          },
        }
  );
  const bodyObj2 = JSON.parse(quizCreatev2.body.toString());
  expect(quizCreatev2.statusCode).toBe(OK);
  expect(bodyObj2).toStrictEqual({ quizId: expect.any(Number) });
  const quizIdStringObjv2: quizReturn = JSON.parse(quizCreatev2.body.toString());
  const quizIdStringv2: string = quizIdStringObjv2.quizId.toString();

  const resRemove = request(
    'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizIdString}`,
        { qs: { token: USERDATA.token } }
  );
  expect(resRemove.statusCode).toBe(200);
  const dataRemove = JSON.parse(resRemove.body.toString());
  expect(dataRemove).toStrictEqual({});

  const resRemovev2 = request(
    'DELETE',
        `${url}:${port}/v2/admin/quiz/${quizIdStringv2}`,
        { headers: { token: USERDATA.token } }
  );
  expect(resRemovev2.statusCode).toBe(200);
  const dataRemovev2 = JSON.parse(resRemovev2.body.toString());
  expect(dataRemovev2).toStrictEqual({});
});

describe('successful trash viewing! wow... v1', () => {
  test('viewing trash successfully', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/trash`,
            {
              qs: {
                token: USERDATA.token,
              }
            }
    );
    expect(trashView.statusCode).toBe(OK);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        },
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        }
      ]
    });
  });
});

describe('error 401 v1', () => {
  test('token is not a valid structure', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/trash`,
            {
              qs: {
                token: '!@O#&1#',
              }
            }
    );
    expect(trashView.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('provided token is valid structure, but not for currently logged in session', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/trash`,
            {
              qs: {
                token: USERDATA.token + 1,
              }
            }
    );
    expect(trashView.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 Routes
describe('successful trash viewing! wow... v2', () => {
  test('viewing trash successfully', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v2/admin/quiz/trash`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(trashView.statusCode).toBe(OK);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        },
        {
          quizId: expect.any(Number),
          name: expect.any(String),
        },
      ]
    });
  });
});

describe('error 401 v2', () => {
  test('token is not a valid structure', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v2/admin/quiz/trash`,
            {
              headers: {
                token: '!@O#&1#',
              }
            }
    );
    expect(trashView.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('provided token is valid structure, but not for currently logged in session', () => {
    const trashView = request(
      'GET',
            `${url}:${port}/v2/admin/quiz/trash`,
            {
              headers: {
                token: USERDATA.token + 1,
              }
            }
    );
    expect(trashView.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(trashView.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});
