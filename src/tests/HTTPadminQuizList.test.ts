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

interface Quiz {
  quizId: number,
  name: string,
}

interface QuizList {
  quizzes: Quiz[],
}

let bodyObj: DataQuizCreate;
let data1: DataRegister;
let dataList: QuizList;

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

// V2 Routes
test('Success: Lists the 1 created quiz associated with that user', () => {
  const res = request(
    'GET',
    `${url}:${port}/v2/admin/quiz/list`,
    { headers: { token: data1.token } }
  );
  expect(res.statusCode).toBe(200);
  dataList = JSON.parse(res.body.toString());
  expect(dataList).toStrictEqual({
    quizzes: [
      {
        quizId: expect.any(Number),
        name: 'What is one plus one'
      }
    ]
  });
});

test('Error: Invalid token structure', () => {
  const res = request(
    'GET',
    `${url}:${port}/v2/admin/quiz/list`,
    { headers: { token: 'AD2*1' } }
  );
  expect(res.statusCode).toBe(401);
  expect(JSON.parse(res.body.toString())).toEqual(ERROR);
});

test('Error: Valid token structure, not for currently logged in user', () => {
  const res = request(
    'GET',
    `${url}:${port}/v2/admin/quiz/list`,
    { headers: { token: data1.token + '1' } }
  );
  expect(res.statusCode).toBe(403);
  expect(JSON.parse(res.body.toString())).toEqual(ERROR);
});

// V1 Routes
test('V1 Success: Lists the 1 created quiz associated with that user', () => {
  const res = request(
    'GET',
    `${url}:${port}/v1/admin/quiz/list`,
    { qs: { token: data1.token } }
  );
  expect(res.statusCode).toBe(200);
  dataList = JSON.parse(res.body.toString());
  expect(dataList).toStrictEqual({
    quizzes: [
      {
        quizId: expect.any(Number),
        name: 'What is one plus one'
      }
    ]
  });
});

test('V1 Error: Invalid token structure', () => {
  const res = request(
    'GET',
    `${url}:${port}/v1/admin/quiz/list`,
    { qs: { token: 'AD2*1' } }
  );
  expect(res.statusCode).toBe(401);
  expect(JSON.parse(res.body.toString())).toEqual(ERROR);
});

test('V1 Error: Valid token structure, not for currently logged in user', () => {
  const res = request(
    'GET',
    `${url}:${port}/v1/admin/quiz/list`,
    { qs: { token: data1.token + '1' } }
  );
  expect(res.statusCode).toBe(403);
  expect(JSON.parse(res.body.toString())).toEqual(ERROR);
});
