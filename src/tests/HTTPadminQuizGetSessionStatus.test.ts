import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody } from '../dataStore';

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
interface DataQuestionCreate {
  questionId: number,
}
interface DataStartSession {
  sessionId: number,
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let quizIdString: string;
let dataQuizCreate: DataQuizCreate;
let validQuestion: validInput;
let dataQuestionCreate: DataQuestionCreate;
let resQuizQuestionCreate;
let resStartSession;
let dataStartSession: DataStartSession;

// beforeEach test, clear data, register a user, create a quiz and creates a question, starts a session
// The questionId should be in dataQuestionCreate.questionId
// The token should be in dataRegister.token
// The sessionId should be in dataStartSession.sessionId
// The quizId should be in dataQuizCreate.quizId
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

  quizIdString = dataQuizCreate.quizId.toString();
  resQuizQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion
    }
  );
  expect(resQuizQuestionCreate.statusCode).toBe(200);
  dataQuestionCreate = JSON.parse(resQuizQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  resStartSession = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/session/start`,
    {
      headers: { token: dataRegister.token },
      json: { autoStartNum: 3 },
    }
  );
  expect(resStartSession.statusCode).toBe(200);
  dataStartSession = JSON.parse(resStartSession.body.toString());
  expect(dataStartSession).toStrictEqual({ sessionId: expect.any(Number) });
});

describe('GET /v1/admin/quiz/:quizid/session/:sessionid - Success: Returns an object with information', () => {
  test('Success: Returns correct object', () => {
    const res = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      { headers: { token: dataRegister.token } }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());

    expect(data).toStrictEqual({
      state: expect.any(String),
      atQuestion: expect.any(Number),
      players: expect.any(Array),
      metadata: {
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
      }
    });
  });
});

describe('GET /v1/admin/quiz/:quizid/session/:sessionid - Throw Errors', () => {
  test('Error Cases', () => {
    // Token is not a valid structure
    const res = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      { headers: { token: 'd$612&g' } }
    );
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
    // 'Provided token is valid structure, but is not for a currently logged in session
    const res2 = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      { headers: { token: dataRegister.token + '1' } }
    );
    expect(res2.statusCode).toBe(403);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual(ERROR);
    // Quiz ID does not refer to a valid quiz
    const res3 = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${(dataQuizCreate.quizId + 1).toString()}/session/${dataStartSession.sessionId.toString()}`,
      { headers: { token: dataRegister.token } }
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual(ERROR);
    // Session Id does not refer to a valid session
    const res4 = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${(dataQuizCreate.quizId).toString()}/session/${(dataStartSession.sessionId + 1).toString()}`,
      { headers: { token: dataRegister.token } }
    );
    expect(res4.statusCode).toBe(400);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toStrictEqual(ERROR);
    // The Quiz ID passed in is not the correct quiz for the session
    // Create a second Quiz, under the same first registered user
    const resQuizCreate2 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz`,
      {
        headers: { token: dataRegister.token },
        json: { name: 'What is one plus ones', description: 'the answer is obviously 3s' }
      }
    );
    const dataQuizCreate2 = JSON.parse(resQuizCreate2.body.toString());
    expect(resQuizCreate2.statusCode).toBe(200);
    expect(dataQuizCreate2).toStrictEqual({ quizId: expect.any(Number) });
    // Pass in the second created quiz ID
    const res5 = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${(dataQuizCreate2.quizId).toString()}/session/${(dataStartSession.sessionId).toString()}`,
      { headers: { token: dataRegister.token } }
    );
    expect(res5.statusCode).toBe(400);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toStrictEqual(ERROR);
    // Quiz ID does not refer to quiz that this user owns
    // Register a second user
    const resRegister2 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(resRegister2.statusCode).toBe(200);
    const dataRegister2 = JSON.parse(resRegister2.body.toString());
    expect(dataRegister2).toStrictEqual({ token: expect.any(String) });
    // Create a quiz using the second user
    const resQuizCreate3 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz`,
      {
        headers: { token: dataRegister2.token },
        json: { name: 'What is one plus ones', description: 'the answer is obviously 3s' }
      }
    );
    const dataQuizCreate3 = JSON.parse(resQuizCreate3.body.toString());
    expect(resQuizCreate3.statusCode).toBe(200);
    expect(dataQuizCreate3).toStrictEqual({ quizId: expect.any(Number) });
    // Use the quizId of the second user, as input for the quiz created and started by the first
    const res6 = request(
      'GET',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate3.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      { headers: { token: dataRegister.token } }
    );
    expect(res6.statusCode).toBe(400);
    const data6 = JSON.parse(res6.body.toString());
    expect(data6).toStrictEqual(ERROR);
  });
});
