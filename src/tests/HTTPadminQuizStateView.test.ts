import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody } from '../dataStore';

const port: string = config.port;
const url: string = config.url;

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
let dataQuestionCreate2: DataQuestionCreate;
let resQuizQuestionCreate2;
let resStartSession;
let dataStartSession: DataStartSession;
let resStartSession2;
let dataStartSession2: DataStartSession;

// beforeEach test, clear data, register a user, create a quiz and creates a question, starts a session
// Then, create one guest user, and start the quiz
// The questionId should be in dataQuestionCreate.questionId
// The token should be in dataRegister.token
// The sessionId should be in dataStartSession.sessionId
// The quizId should be in dataQuizCreate.quizId
// The playerId should be in dataPlayerJoin.playerId
// In our beforeEach we will have an AWAIT
beforeEach(async () => {
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

  resQuizQuestionCreate2 = request(
    'POST',
        `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
        {
          headers: { token: dataRegister.token },
          json: validQuestion
        }
  );
  expect(resQuizQuestionCreate2.statusCode).toBe(200);
  dataQuestionCreate2 = JSON.parse(resQuizQuestionCreate2.body.toString());
  expect(dataQuestionCreate2).toStrictEqual({ questionId: expect.any(Number) });

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

  resStartSession2 = request(
    'POST',
        `${url}:${port}/v1/admin/quiz/${quizIdString}/session/start`,
        {
          headers: { token: dataRegister.token },
          json: { autoStartNum: 3 },
        }
  );
  expect(resStartSession2.statusCode).toBe(200);
  dataStartSession2 = JSON.parse(resStartSession2.body.toString());
  expect(dataStartSession2).toStrictEqual({ sessionId: expect.any(Number) });

  const resEND = request(
    'PUT',
        `${url}:${port}/v1/admin/quiz/${quizIdString}/session/${dataStartSession2.sessionId.toString()}`,
        {
          headers: { token: dataRegister.token },
          json: { action: 'END' }
        }
  );
  expect(resEND.statusCode).toBe(200);
  const dataEND = JSON.parse(resEND.body.toString());
  expect(dataEND).toEqual({});
});

test('Success, retrieved active & inactive session ids', () => {
  const resViewSession = request(
    'GET',
        `${url}:${port}/v1/admin/quiz/${quizIdString}/sessions`,
        { headers: { token: dataRegister.token } }
  );
  expect(resViewSession.statusCode).toBe(200);
  const dataViewSession = JSON.parse(resViewSession.body.toString());
  expect(dataViewSession).toStrictEqual({
    activeSessions: expect.arrayContaining([expect.any(Number)]),
    inactiveSessions: expect.arrayContaining([expect.any(Number)]),
  });
});
