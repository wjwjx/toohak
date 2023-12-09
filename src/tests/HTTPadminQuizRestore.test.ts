import request from 'sync-request';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;

export interface userToken {
  token: string,
}

let USERDATA: userToken;
let quizIdString: string;
let quizid: number;

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
  const bodyObj = JSON.parse(quizCreate.body.toString()); // bodyObj is an object which is quizReturn
  expect(quizCreate.statusCode).toBe(OK);
  expect(bodyObj).toStrictEqual({ quizId: expect.any(Number) });

  quizIdString = bodyObj.quizId.toString();
  quizid = bodyObj.quizId;

  const resRemove = request(
    'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizIdString}`,
        { qs: { token: USERDATA.token } }
  );
  expect(resRemove.statusCode).toBe(200);
  const dataRemove = JSON.parse(resRemove.body.toString());
  expect(dataRemove).toStrictEqual({});
});

describe('successful restoration v1', () => {
  test('successfully restored quiz!', () => {
    const quizRestore = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${quizIdString}/restore`,
            {
              json: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(OK);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v1', () => {
  test('quizid does not refer to a valid quiz', () => {
    const quizRestore = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${quizid + 2}/restore`,
            {
              json: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });

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
    const bodyObj2 = JSON.parse(quizCreate.body.toString()); // bodyObj is an object which is quizReturn
    expect(quizCreate.statusCode).toBe(OK);
    expect(bodyObj2).toStrictEqual({ quizId: expect.any(Number) });

    const quizRestore2 = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${bodyObj2.quizId}/restore`,
            {
              json: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore2.statusCode).toBe(INPUT_ERROR);
    const bodyObj3 = JSON.parse(quizRestore2.body.toString());
    expect(bodyObj3).toStrictEqual({ error: expect.any(String) });

    // register a user

    const userRegister = request(
      'POST',
          `${url}:${port}/v1/admin/auth/register`,
          { json: { email: 'name.ndsame1@test.com', password: 'Passtedsast123', nameFirst: 'Codsarrect', nameLast: 'Corrdsaect' } }
    );
    expect(userRegister.statusCode).toBe(200);
    const data1 = JSON.parse(userRegister.body.toString());
    expect(data1).toStrictEqual({ token: expect.any(String) });

    // setting USERDATA

    const USERDATA2 = JSON.parse(userRegister.body.toString());

    const quizRestore3 = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${quizid}/restore`,
            {
              json: {
                token: USERDATA2.token,
              }
            }
    );
    expect(quizRestore3.statusCode).toBe(INPUT_ERROR);
    const bodyObj4 = JSON.parse(quizRestore3.body.toString());
    expect(bodyObj4).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v1', () => {
  test('Token is not a valid structure', () => {
    const quizRestore = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${quizIdString}/restore`,
            {
              json: {
                token: ')!(##*@!)',
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('token is valid structure, but not for currently logged in session', () => {
    let tokenNumber = parseInt(USERDATA.token);
    tokenNumber += 1;
    const wrongToken = tokenNumber.toString();
    const quizRestore = request(
      'POST',
            `${url}:${port}/v1/admin/quiz/${quizIdString}/restore`,
            {
              json: {
                token: wrongToken,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 Routes
describe('successful restoration v2', () => {
  test('successfully restored quiz!', () => {
    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${quizIdString}/restore`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(OK);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v2', () => {
  test('quizid does not refer to a valid quiz', () => {
    quizid += 1;
    const quizIdString2 = quizid.toString();
    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${quizIdString2}/restore`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('quizid does not refer to a quiz that this user owns', () => {
    // register a second user
    const userRegister = request(
      'POST',
            `${url}:${port}/v1/admin/auth/register`,
            { json: { email: 'name.name2@test.com', password: 'Pass2est123', nameFirst: 'Corwect', nameLast: 'Corwect' } }
    );
    expect(userRegister.statusCode).toBe(200);
    const data1 = JSON.parse(userRegister.body.toString());
    expect(data1).toStrictEqual({ token: expect.any(String) });
    // due to clear, this user will have ID 1

    const userRegister2 = request(
      'POST',
            `${url}:${port}/v1/admin/auth/register`,
            { json: { email: 'name.na1e@test.com', password: 'Pa2s2est123', nameFirst: 'CDSAect', nameLast: 'CorwedSAt' } }
    );
    expect(userRegister.statusCode).toBe(200);
    const data2 = JSON.parse(userRegister2.body.toString());
    expect(data2).toStrictEqual({ token: expect.any(String) });
    const thirdUser: string = data2.token;
    // this user should have ID 2

    // create a quiz with the third user
    const quizCreate = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: thirdUser,
              },
              json: {
                name: 'What is one plus two',
                description: 'the answer is obviously 4'
              },
            }
    );
    const quizData1 = JSON.parse(quizCreate.body.toString());
    expect(quizCreate.statusCode).toBe(OK);
    expect(quizData1).toStrictEqual({ quizId: expect.any(Number) });
    const secondQuizIdString = quizData1.quizId.toString();

    // remove the second quiz with the third user
    const resRemove = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${secondQuizIdString}`,
            { headers: { token: thirdUser } }
    );
    expect(resRemove.statusCode).toBe(200);
    const dataRemove = JSON.parse(resRemove.body.toString());
    expect(dataRemove).toStrictEqual({});

    // attempting to restore the second quiz with the first user
    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${secondQuizIdString}/restore`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('quizid refers to quiz not currently in trash', () => {
    const quizCreate = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA.token,
              },
              json: {
                name: 'What ialus one',
                description: 'the ansy 3'
              },
            }
    );
    const bodyObj = JSON.parse(quizCreate.body.toString());
    expect(quizCreate.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({ quizId: expect.any(Number) });

    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${bodyObj.quizId}}/restore`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INPUT_ERROR);
    const bodyObj2 = JSON.parse(quizRestore.body.toString());
    expect(bodyObj2).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v2', () => {
  test('Token is not a valid structure', () => {
    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${quizIdString}/restore`,
            {
              headers: {
                token: ')!(##*@!)',
              }
            }
    );
    expect(quizRestore.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('token is valid structure, but not for currently logged in session', () => {
    let tokenNumber = parseInt(USERDATA.token);
    tokenNumber += 1;
    const wrongToken = tokenNumber.toString();
    const quizRestore = request(
      'POST',
            `${url}:${port}/v2/admin/quiz/${quizIdString}/restore`,
            {
              headers: {
                token: wrongToken,
              }
            }
    );
    expect(quizRestore.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(quizRestore.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});
