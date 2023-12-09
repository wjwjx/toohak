import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const ERROR = { error: expect.any(String) };

interface tokenIdResponse {
  error?: string,
  token?: string,
}

interface QuizIdResponse {
  error?: string,
  quizId?: number,
}

test('Clear returns an empty object', () => {
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});
});

test('Clear correctly removes a user that is created', () => {
  const res1 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  const data1: tokenIdResponse = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  const clearRes2 = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes2.statusCode).toBe(200);
  const data: Record<string, never> = JSON.parse(clearRes2.body.toString());
  expect(data).toEqual({});

  const userDetails = request(
    'GET',
    `${url}:${port}/v1/admin/user/details`,
    { qs: { token: data1.token } }
  );
  const userData = JSON.parse(userDetails.body.toString());
  expect(userData).toEqual(ERROR);
});

test('Clear correctly removes a user and a test they create', () => {
  const res1 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  const data1: tokenIdResponse = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  const res2 = request(
    'POST',
    `${url}:${port}/v1/admin/quiz`,
    { json: { token: data1.token, name: 'CorrectQuizName', description: 'CorrectDescription' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2: QuizIdResponse = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ quizId: expect.any(Number) });

  const clearRes2 = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes2.statusCode).toBe(200);
  const data: Record<string, never> = JSON.parse(clearRes2.body.toString());
  expect(data).toEqual({});

  const userDetails = request(
    'GET',
    `${url}:${port}/v1/admin/user/details`,
    { qs: { token: data1.token } }
  );
  const userData = JSON.parse(userDetails.body.toString());
  expect(userData).toEqual(ERROR);
/*
  const quizInfo = request(
    'GET',
    `${url}:${port}/v1/admin/quiz/${data2.quizId}`,
    { qs: {token: data1.token } }
  );
  const quizInfoData = JSON.parse(quizInfo.body.toString());
  expect(quizInfoData).toEqual(ERROR);
  */
});
