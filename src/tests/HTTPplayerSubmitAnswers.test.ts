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
interface DataPlayerJoin {
  playerId: number,
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let quizIdString: string;
let dataQuizCreate: DataQuizCreate;
let validQuestion: validInput;
let validQuestion2: validInput;
let dataQuestionCreate: DataQuestionCreate;
let dataQuestionCreate2: DataQuestionCreate;
let resQuizQuestionCreate;
let resQuizQuestionCreate2;
let resStartSession;
let dataStartSession: DataStartSession;
let resPlayerJoin;
let dataPlayerJoin: DataPlayerJoin;

// beforeEach test, clear data, register a user, create a quiz and creates a question, starts a session
// Then, create one guest user, and start the quiz
// The questionId should be in dataQuestionCreate.questionId
// The token should be in dataRegister.token
// The sessionId should be in dataStartSession.sessionId
// The quizId should be in dataQuizCreate.quizId
// The playerId should be in dataPlayerJoin.playerId
// In our beforeEach we will have an AWAIT
//
// Allow this question to run for 50 seconds, in order for our test cases to be all tested
//
// For this test, a second question is also created in order to test session is not yet up to this question
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
      duration: 50,
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

  validQuestion2 = {
    questionBody: {
      question: 'Second valid question',
      duration: 50,
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

  resQuizQuestionCreate2 = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion2
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

  resPlayerJoin = request(
    'POST',
    `${url}:${port}/v1/player/join`,
    { json: { sessionId: dataStartSession.sessionId, name: 'Josh Reynolds' } }
  );
  expect(resPlayerJoin.statusCode).toBe(200);
  dataPlayerJoin = JSON.parse(resPlayerJoin.body.toString());
  expect(dataPlayerJoin).toStrictEqual({ playerId: expect.any(Number) });

  const resStartQuiz = request(
    'PUT',
    `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
    {
      headers: { token: dataRegister.token },
      json: { action: 'NEXT_QUESTION' }
    }
  );
  expect(resStartQuiz.statusCode).toBe(200);
  const dataStartQuiz = JSON.parse(resStartQuiz.body.toString());
  expect(dataStartQuiz).toEqual({});

  await delay(100); // Wait for 100ms (0.1s) for state change to QUESTION_OPEN
});

describe('PUT /v1/player/:playerid/question/:questionposition/answer - Submits an answer for a question', () => {
  test('Success', () => {
    const res = request(
      'PUT',
      `${url}:${port}/v1/player/${dataPlayerJoin.playerId.toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [1] }
      }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toEqual({});

    const resEND = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      {
        headers: { token: dataRegister.token },
        json: { action: 'END' }
      }
    );
    expect(resEND.statusCode).toBe(200);
  });
});

describe('PUT /v1/player/:playerid/question/:questionposition/answer - Error cases', () => {
  test('Error cases', () => {
    // 1. player ID does not exist
    const res = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId + 1).toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [1] }
      }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toEqual(ERROR);
    // 2. Question position is not valid for the session this player is in
    const res2 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'3'}/answer`,
      {
        json: { answerIds: [1] }
      }
    );
    expect(res2.statusCode).toBe(400);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toEqual(ERROR);
    // 3. Less than 1 answer ID was submitted
    const res3 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [] }
      }
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toEqual(ERROR);
    // 4. Answer IDs are not valid for this particular question
    const res4 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [3] }
      }
    );
    expect(res4.statusCode).toBe(400);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toEqual(ERROR);
    // 5. There are duplicate answer IDs provided
    const res5 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [1, 1] }
      }
    );
    expect(res5.statusCode).toBe(400);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toEqual(ERROR);
    // 7. Session is not yet up to this question
    const res7 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'2'}/answer`,
      {
        json: { answerIds: [1] }
      }
    );
    expect(res7.statusCode).toBe(400);
    const data7 = JSON.parse(res7.body.toString());
    expect(data7).toEqual(ERROR);
    // 8. Session is not in QUESTION_OPEN state
    // Send the question to END state
    const resEND = request(
      'PUT',
    `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
    {
      headers: { token: dataRegister.token },
      json: { action: 'END' }
    }
    );
    expect(resEND.statusCode).toBe(200);
    const dataEND = JSON.parse(resEND.body.toString());
    expect(dataEND).toEqual({});
    // Try to answer the question
    const res8 = request(
      'PUT',
      `${url}:${port}/v1/player/${(dataPlayerJoin.playerId).toString()}/question/${'1'}/answer`,
      {
        json: { answerIds: [1] }
      }
    );
    expect(res8.statusCode).toBe(400);
    const data8 = JSON.parse(res8.body.toString());
    expect(data8).toEqual(ERROR);
  });
});
