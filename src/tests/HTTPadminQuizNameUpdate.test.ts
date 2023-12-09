import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const ERROR = { error: expect.any(String) };

interface DataQuizCreate {
  quizId: number,
}
interface DataRegister {
  token: string,
}

let bodyObj: DataQuizCreate;
let data1: DataRegister;

// beforeEach, clear, register a user and create a valid quiz
// bodyObj.quizId should give the quizId of the created quiz
// data1.token should give the token of the registered user
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
  data1 = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  const res2 = request(
    'POST',
          `${url}:${port}/v2/admin/quiz`,
          {
            headers: { token: data1.token },
            json: {
              name: 'What is one plus one',
              description: 'the answer is obviously 3'
            },
          }
  );
  bodyObj = JSON.parse(res2.body.toString());
  expect(res2.statusCode).toBe(200);
  expect(bodyObj).toStrictEqual({
    quizId: expect.any(Number),
  });
});

test('V2 Success: Update quiz name', () => {
  const quizIdString: string = bodyObj.quizId.toString();
  const res = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
    {
      headers: { token: data1.token },
      json: { name: 'New Quiz Name' }
    }
  );
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body.toString())).toEqual({});
});

describe('V2 Error: Incorrect input information', () => {
  test('Error Incorrect Input Information', () => {
    const quizIdString: string = bodyObj.quizId.toString();
    // Name contains invalid characters
    const res = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: data1.token },
        json: { name: 'Invalid*Name' }
      }
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toEqual(ERROR);
    // Name more than 30 characters
    const res1 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: data1.token },
        json: { name: 'I'.repeat(31) }
      }
    );
    expect(res1.statusCode).toBe(400);
    expect(JSON.parse(res1.body.toString())).toEqual(ERROR);
    // Name less than 30 characters
    const res2 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: data1.token },
        json: { name: 'II' }
      }
    );
    expect(res2.statusCode).toBe(400);
    expect(JSON.parse(res2.body.toString())).toEqual(ERROR);
    // Invalid token structure
    const res3 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: 'AD2*1' },
        json: { name: 'New Quiz Name' }
      }
    );
    expect(res3.statusCode).toBe(401);
    expect(JSON.parse(res3.body.toString())).toEqual(ERROR);
    // Valid structure, not for current user
    const res4 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: data1.token + '1' },
        json: { name: 'New Quiz Name' }
      }
    );
    expect(res4.statusCode).toBe(403);
    expect(JSON.parse(res4.body.toString())).toEqual(ERROR);
    // Name only spaces
    const res5 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/name`,
      {
        headers: { token: data1.token },
        json: { name: '    ' }
      }
    );
    expect(res5.statusCode).toBe(400);
    expect(JSON.parse(res5.body.toString())).toEqual(ERROR);
    // QuizId does not refer to a valid quiz
    const quizIdStringInvalid: string = (bodyObj.quizId + 1).toString();
    const res6 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdStringInvalid}/name`,
      {
        headers: { token: data1.token },
        json: { name: 'New Quiz Name' }
      }
    );
    expect(res6.statusCode).toBe(400);
    expect(JSON.parse(res6.body.toString())).toEqual(ERROR);
  });
});

describe('V1 Cases', () => {
  test('401 and 403 Error Token Issues', () => {
    const quizIdString: string = bodyObj.quizId.toString();
    // Invalid token structure
    const res3 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/name`,
      { json: { token: 'AD2*1', name: 'New Quiz Name' } }
    );
    expect(res3.statusCode).toBe(401);
    expect(JSON.parse(res3.body.toString())).toEqual(ERROR);
    // Valid structure, not for current user
    const res4 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/name`,
      { json: { token: data1.token + '1', name: 'New Quiz Name' } }
    );
    expect(res4.statusCode).toBe(403);
    expect(JSON.parse(res4.body.toString())).toEqual(ERROR);
  });
  test('200 and 400 Success: Update quiz name', () => {
    const quizIdString: string = bodyObj.quizId.toString();
    // Name less than 30 characters
    const res2 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/name`,
      { json: { token: data1.token, name: 'II' } }
    );
    expect(res2.statusCode).toBe(400);
    expect(JSON.parse(res2.body.toString())).toEqual(ERROR);

    // 200 Success Case
    const res = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/name`,
      { json: { token: data1.token, name: 'New Quiz Name' } }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body.toString())).toEqual({});
  });
});
