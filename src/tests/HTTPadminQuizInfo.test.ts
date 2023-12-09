import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody, Answer } from '../dataStore';

const port: string = config.port;
const url: string = config.url;

const ERROR = { error: expect.any(String) };

interface validInput {
  questionBody: QuestionBody,
}
interface DataQuizCreate {
  quizId: number,
}
interface DataRegister {
  token: string,
}
interface questionBodyOld {
  question: string,
  duration: number,
  points: number,
  answers: Answer[],
}
interface validInputOld {
  token: string,
  questionBody: questionBodyOld
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let dataQuizCreate: DataQuizCreate;
let validQuestion: validInput;
let validQuestionOld: validInputOld;
// beforeEach, clear, create a user and create a valid quiz
// quizId is in dataQuizCreate.quizId
// token -> dataRegister.token
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
});

describe('Errors V2 Tests', () => {
  test('Errors V2 Simple', () => {
    // Error: Provided token is valid structure, but is not for a currently logged in session
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const resInfo = request(
      'GET',
      `${url}:${port}/v2/admin/quiz/${quizIdString}`,
      { headers: { token: dataRegister.token + 1 } }
    );
    expect(resInfo.statusCode).toBe(403);
    const dataInfo = JSON.parse(resInfo.body.toString());
    expect(dataInfo).toStrictEqual(ERROR);
    // Error: Token is not a valid structure
    const resInfo2 = request(
      'GET',
      `${url}:${port}/v2/admin/quiz/${quizIdString}`,
      { headers: { token: 'DS89$' } }
    );
    expect(resInfo2.statusCode).toBe(401);
    const dataInfo2 = JSON.parse(resInfo2.body.toString());
    expect(dataInfo2).toStrictEqual(ERROR);
    // Error: QuizId does not refer to a valid quiz
    const quizIdStringInvalid: string = (dataQuizCreate.quizId + 1).toString();
    const resInfo3 = request(
      'GET',
      `${url}:${port}/v2/admin/quiz/${quizIdStringInvalid}`,
      { headers: { token: dataRegister.token } }
    );
    expect(resInfo3.statusCode).toBe(400);
    const dataInfo3 = JSON.parse(resInfo3.body.toString());
    expect(dataInfo3).toStrictEqual(ERROR);
  });
  test('Errors V2: This user does not own this quiz', () => {
    const res2 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name1.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({ token: expect.any(String) });

    const quizIdString: string = (dataQuizCreate.quizId).toString();
    const resInfo = request(
      'GET',
      `${url}:${port}/v2/admin/quiz/${quizIdString}`,
      { headers: { token: data2.token } }
    );
    expect(resInfo.statusCode).toBe(400);
    const dataInfo = JSON.parse(resInfo.body.toString());
    expect(dataInfo).toStrictEqual(ERROR);
  });
});
describe('Success V2 Tests', () => {
  test('Success retrieval quizInfo', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();

    validQuestion = {
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

    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion
      }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ questionId: expect.any(Number) });

    const resInfo = request(
      'GET',
      `${url}:${port}/v2/admin/quiz/${quizIdString}`,
      { headers: { token: dataRegister.token } }
    );
    expect(resInfo.statusCode).toBe(200);
    const dataInfo = JSON.parse(resInfo.body.toString());

    expect(dataInfo).toStrictEqual({
      quizId: expect.any(Number),
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: expect.any(Number),
      questions: expect.arrayContaining([
        {
          questionId: expect.any(Number),
          question: expect.any(String),
          duration: expect.any(Number),
          thumbnailUrl: expect.any(String),
          points: expect.any(Number),
          answers: expect.arrayContaining([
            {
              answerId: expect.any(Number),
              answer: expect.any(String),
              colour: expect.any(String),
              correct: expect.any(Boolean),
            }
          ]),
        }
      ]),
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String),
    });
  });
});
describe('V1 Tests', () => {
  test('403 Error: Provided token is valid structure, but is not for a currently logged in session', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const resInfo = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${quizIdString}`,
      { qs: { token: dataRegister.token + 1 } }
    );
    expect(resInfo.statusCode).toBe(403);
    const dataInfo = JSON.parse(resInfo.body.toString());
    expect(dataInfo).toStrictEqual(ERROR);
  });
  test('401 Error: Token is not a valid structure', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const resInfo = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${quizIdString}`,
      { qs: { token: 'DS89$' } }
    );
    expect(resInfo.statusCode).toBe(401);
    const dataInfo = JSON.parse(resInfo.body.toString());
    expect(dataInfo).toStrictEqual(ERROR);
  });
  test('400 Error: QuizId does not refer to a valid quiz', () => {
    const quizIdString: string = (dataQuizCreate.quizId + 1).toString();
    const resInfo = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${quizIdString}`,
      { qs: { token: dataRegister.token } }
    );
    expect(resInfo.statusCode).toBe(400);
    const dataInfo = JSON.parse(resInfo.body.toString());
    expect(dataInfo).toStrictEqual(ERROR);
  });
  test('200 Successful retrieval of relevant information about the current quiz', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();

    validQuestionOld = {
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

    const res = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
      { json: validQuestionOld }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ questionId: expect.any(Number) });

    const resInfo = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${quizIdString}`,
      { qs: { token: dataRegister.token } }
    );
    expect(resInfo.statusCode).toBe(200);
    const dataInfo = JSON.parse(resInfo.body.toString());

    expect(dataInfo).toStrictEqual({
      quizId: expect.any(Number),
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: expect.any(Number),
      questions: expect.arrayContaining([
        {
          questionId: expect.any(Number),
          question: expect.any(String),
          duration: expect.any(Number),
          points: expect.any(Number),
          answers: expect.arrayContaining([
            {
              answerId: expect.any(Number),
              answer: expect.any(String),
              colour: expect.any(String),
              correct: expect.any(Boolean),
            }
          ]),
        }
      ]),
      duration: expect.any(Number)
    });
  });
});
