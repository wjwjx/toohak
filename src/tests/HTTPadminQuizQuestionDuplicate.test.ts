import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody } from '../dataStore';

const port: string = config.port;
const url: string = config.url;
const ERROR = { error: expect.any(String) };

interface updatedValidInput {
  questionBody: QuestionBody
}
interface DataQuizCreate {
  quizId: number,
}
interface DataRegister {
  token: string,
}
interface v1ValidInput {
  token: string,
  questionBody: QuestionBody,
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let dataQuizCreate: DataQuizCreate;
let updatedValidQuestion: updatedValidInput;
let v1ValidQuestion: v1ValidInput;
// let USERDATA: userToken;

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

  resQuizCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz`,
    {
      headers: { token: dataRegister.token },
      json: { name: 'What is one plus one', description: 'the answer is obviously 3' }
    }
  );
  dataQuizCreate = JSON.parse(resQuizCreate.body.toString());
  expect(resQuizCreate.statusCode).toBe(200);
  expect(dataQuizCreate).toStrictEqual({ quizId: expect.any(Number) });

  v1ValidQuestion = {
    token: dataRegister.token,
    questionBody: {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Harry',
          correct: false
        }
      ]
    }
  };

  updatedValidQuestion = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      thumbnailUrl: 'https://static.wikia.nocookie.net/youtube/images/3/35/Pusheenthecat.jpeg',
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Prince Harry',
          correct: false
        }
      ]
    }
  };
});

// V2 Routes
test('Error: Token is not a valid structure.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    {
      headers: {
        token: ')*(@!#92',
      }
    }
  );
  expect(resDup.statusCode).toBe(401);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Provided token is valid structure, but is not for a currently logged in session.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { headers: { token: dataRegister.token + 1 } }
  );
  expect(resDup.statusCode).toBe(403);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Quiz ID does not refer to a quiz that this user owns.', () => {
  const resRegister2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name1.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(resRegister2.statusCode).toBe(200);
  const dataRegister2 = JSON.parse(resRegister2.body.toString());
  expect(dataRegister2).toStrictEqual({ token: expect.any(String) });

  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { headers: { token: dataRegister2.token } }
  );
  expect(resDup.statusCode).toBe(400);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Quiz ID does not refer to a valid quiz.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const invalidQuizId: string = (dataQuizCreate.quizId + 1).toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${invalidQuizId}/question/${quizQuestionId}/duplicate`,
    { headers: { token: dataRegister.token } }
  );
  expect(resDup.statusCode).toBe(400);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Question Id does not refer to a valid question within this quiz.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = (dataQuestionCreate.questionId + 1).toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { headers: { token: dataRegister.token } }
  );
  expect(resDup.statusCode).toBe(400);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

// V1
test('Error: Token is not a valid structure V1.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
    { json: v1ValidQuestion }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { json: { token: ')*(@!#92' } }
  );
  expect(resDup.statusCode).toBe(401);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Provided token is valid structure, but is not for a currently logged in session V1.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
    { json: v1ValidQuestion }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { json: { token: dataRegister.token + 1 } }
  );
  expect(resDup.statusCode).toBe(403);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

test('Error: Quiz ID does not refer to a quiz that this user owns V1.', () => {
  const resRegister2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name1.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(resRegister2.statusCode).toBe(200);
  const dataRegister2 = JSON.parse(resRegister2.body.toString());
  expect(dataRegister2).toStrictEqual({ token: expect.any(String) });

  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
    { json: v1ValidQuestion }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { json: { token: dataRegister2.token } }
  );
  expect(resDup.statusCode).toBe(400);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual(ERROR);
});

// V1
test('Success: Quiz qustion is duplicated V1.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
    { json: v1ValidQuestion }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { json: { token: dataRegister.token } }
  );
  expect(resDup.statusCode).toBe(200);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual({ newQuestionId: expect.any(Number) });
});

// V2
test('Success: Quiz qustion is duplicated.', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: updatedValidQuestion
    }
  );
  expect(resQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const quizQuestionId: string = dataQuestionCreate.questionId.toString();
  const resDup = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${quizQuestionId}/duplicate`,
    { headers: { token: dataRegister.token } }
  );
  expect(resDup.statusCode).toBe(200);
  const dataDup = JSON.parse(resDup.body.toString());
  expect(dataDup).toStrictEqual({ newQuestionId: expect.any(Number) });
});
