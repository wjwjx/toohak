import request from 'sync-request';
import config from '../config.json';
import { userToken, quizReturn } from './HTTPadminQuestionDelete.test';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;

let USERDATA: userToken;
let USERDATA2: userToken;
let createdQuiz1: quizReturn;
let createdQuiz2: quizReturn;

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

  // create 2 new users

  const userRegister = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(userRegister.statusCode).toBe(200);
  const data1 = JSON.parse(userRegister.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  const userRegister2 = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name.nam3211@test.com', password: 'Pass2st123', nameFirst: 'Cordsaect', nameLast: 'Corsaect' } }
  );
  expect(userRegister2.statusCode).toBe(200);
  const data2 = JSON.parse(userRegister2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  // setting USERDATA

  USERDATA = JSON.parse(userRegister.body.toString());
  USERDATA2 = JSON.parse(userRegister2.body.toString());

  // make 2 quizzes

  // quiz 1
  const quizCreate1 = request(
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
  createdQuiz1 = JSON.parse(quizCreate1.body.toString());
  expect(quizCreate1.statusCode).toBe(OK);
  expect(createdQuiz1).toStrictEqual({ quizId: expect.any(Number) });

  // quiz 2
  const quizCreate2 = request(
    'POST',
        `${url}:${port}/v1/admin/quiz`,
        {
          json: {
            token: USERDATA.token,
            name: 'What is one plus nine',
            description: 'the answer is obviously 7'
          },
        }
  );
  createdQuiz2 = JSON.parse(quizCreate2.body.toString());
  expect(quizCreate2.statusCode).toBe(OK);
  expect(createdQuiz2).toStrictEqual({ quizId: expect.any(Number) });

  createdQuiz1 = JSON.parse(quizCreate1.body.toString());
  expect(quizCreate1.statusCode).toBe(OK);
  expect(createdQuiz1).toStrictEqual({ quizId: expect.any(Number) });

  // createdQuiz1 and createdQuiz2 are quizId1 and quizId2
  const quizId1String = createdQuiz1.quizId.toString();
  const quizId2String = createdQuiz2.quizId.toString();

  // remove both of them

  const resRemove1 = request(
    'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizId1String}`,
        { qs: { token: data1.token } }
  );
  expect(resRemove1.statusCode).toBe(200);
  const dataRemove1 = JSON.parse(resRemove1.body.toString());
  expect(dataRemove1).toStrictEqual({});

  const resRemove2 = request(
    'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizId2String}`,
        { qs: { token: data1.token } }
  );
  expect(resRemove2.statusCode).toBe(200);
  const dataRemove2 = JSON.parse(resRemove2.body.toString());
  expect(dataRemove2).toStrictEqual({});
});

describe('statusCode 200 v1', () => {
  test('successfully delete 1 quiz', () => {
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/trash/empty`,
            {
              qs: {
                token: USERDATA.token,
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(OK);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v1', () => {
  test('one quiz is not valid', () => {
    const newQuizId = createdQuiz1.quizId - 1;
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/trash/empty`,
            {
              qs: {
                token: USERDATA.token,
                quizIds: [newQuizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v1', () => {
  test('token is invalid structure', () => {
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/trash/empty`,
            {
              qs: {
                token: '!@&#)@&!#',
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('token is valid structure but not for logged in session', () => {
    let tempToken = parseInt(USERDATA2.token);
    tempToken += 1;
    const newToken = tempToken.toString();
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/trash/empty`,
            {
              qs: {
                token: newToken,
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 Routes
describe('statusCode 200 v2', () => {
  test('successfully delete 1 quiz', () => {
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA.token,
              },
              qs: {
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(OK);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({});
  });
  test('successfully deleting multiple quizzes', () => {
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA.token,
              },
              qs: {
                quizIds: [createdQuiz1.quizId, createdQuiz2.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(OK);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v2', () => {
  test('one quiz is not valid', () => {
    const newQuizId = createdQuiz1.quizId - 1;
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA.token,
              },
              qs: {
                quizIds: [newQuizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('multiple quizzes are not valid', () => {
    const newQuizId1 = createdQuiz1.quizId - 1;
    const newQuizId2 = createdQuiz2.quizId - 5;
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA.token,
              },
              qs: {
                quizIds: [newQuizId1, newQuizId2],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('One or more of the Quiz IDs refers to a quiz that this current user does not own', () => {
    // create a new quiz
    const quizCreate1 = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA2.token,
              },
              json: {
                name: 'What is one plus twenty',
                description: 'the answer is obviously twelve'
              },
            }
    );
    const tempCreatedQuiz1 = JSON.parse(quizCreate1.body.toString());
    expect(quizCreate1.statusCode).toBe(OK);
    expect(tempCreatedQuiz1).toStrictEqual({ quizId: expect.any(Number) });
    const tempQuizId = tempCreatedQuiz1.quizId.toString();

    const resRemove1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${tempQuizId}`,
            { headers: { token: USERDATA2.token } }
    );
    expect(resRemove1.statusCode).toBe(200);
    const dataRemove1 = JSON.parse(resRemove1.body.toString());
    expect(dataRemove1).toStrictEqual({});

    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA.token,
              },
              qs: {
                quizIds: [tempQuizId.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('One or more of the Quiz IDs is not currently in the trash', () => {
    const quizCreate1 = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: {
                token: USERDATA2.token,
              },
              json: {
                name: 'What is one plus fifty',
                description: 'the answer is obviously 10'
              },
            }
    );
    const tempCreatedQuiz1 = JSON.parse(quizCreate1.body.toString());
    expect(quizCreate1.statusCode).toBe(OK);
    expect(tempCreatedQuiz1).toStrictEqual({ quizId: expect.any(Number) });
    const tempQuizId = tempCreatedQuiz1.quizId;

    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: USERDATA2.token,
              },
              qs: {
                quizIds: [tempQuizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INPUT_ERROR);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v2', () => {
  test('token is invalid structure', () => {
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: '(*&@#(!*))',
              },
              qs: {
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(INVALID_TOKEN);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('token is valid structure but not for logged in session', () => {
    let tempToken = parseInt(USERDATA2.token);
    tempToken += 1;
    const newToken = tempToken.toString();
    const deleteQuiz1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/trash/empty`,
            {
              headers: {
                token: newToken,
              },
              qs: {
                quizIds: [createdQuiz1.quizId],
              }
            }
    );
    expect(deleteQuiz1.statusCode).toBe(LOGGED_IN_SESSION);
    const bodyObj = JSON.parse(deleteQuiz1.body.toString());
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});
