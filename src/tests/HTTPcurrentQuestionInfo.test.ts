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
});

describe('Error, res code 400', () => {
  test('Testing Error 400 cases', async () => {
    // Session is in Lobby state
    const questionInfoRes = request(
      'GET',
      `${url}:${port}/v1/player/${dataPlayerJoin.playerId.toString()}/question/1`
    );
    expect(questionInfoRes.statusCode).toBe(400);
    const questionInfoData = JSON.parse(questionInfoRes.body.toString());
    expect(questionInfoData).toStrictEqual(ERROR);

    // starting session
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

    // PlayerId does not exist
    const playerIdString1 = (dataPlayerJoin.playerId + 1).toString();
    const questionInfoRes1 = request(
      'GET',
      `${url}:${port}/v1/player/${playerIdString1}/question/1`
    );
    expect(questionInfoRes1.statusCode).toBe(400);
    const questionInfoData1 = JSON.parse(questionInfoRes1.body.toString());
    expect(questionInfoData1).toStrictEqual(ERROR);

    // Question position is not valid for session
    const playerIdString2 = dataPlayerJoin.playerId.toString();
    const questionInfoRes2 = request(
      'GET',
      `${url}:${port}/v1/player/${playerIdString2}/question/3`
    );
    expect(questionInfoRes2.statusCode).toBe(400);
    const questionInfoData2 = JSON.parse(questionInfoRes2.body.toString());
    expect(questionInfoData2).toStrictEqual(ERROR);

    // Session is not currently on this question
    const questionInfoRes3 = request(
      'GET',
      `${url}:${port}/v1/player/${playerIdString2}/question/2`
    );
    expect(questionInfoRes3.statusCode).toBe(400);
    const questionInfoData3 = JSON.parse(questionInfoRes3.body.toString());
    expect(questionInfoData3).toStrictEqual(ERROR);

    // Session is in End state
    const resEND = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      {
        headers: { token: dataRegister.token },
        json: { action: 'END' },
      }
    );
    expect(resEND.statusCode).toBe(200);
    const dataEND = JSON.parse(resEND.body.toString());
    expect(dataEND).toEqual({});

    const questionInfoRes4 = request(
      'GET',
      `${url}:${port}/v1/player/${playerIdString2}/question/1`
    );
    expect(questionInfoRes4.statusCode).toBe(400);
    const questionInfoData4 = JSON.parse(questionInfoRes4.body.toString());
    expect(questionInfoData4).toStrictEqual(ERROR);
  });
});

describe('Success, res code 200', () => {
  test('Testing success case', async () => {
    const resStartQuiz = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      {
        headers: { token: dataRegister.token },
        json: { action: 'NEXT_QUESTION' },
      }
    );
    expect(resStartQuiz.statusCode).toBe(200);
    const dataStartQuiz = JSON.parse(resStartQuiz.body.toString());
    expect(dataStartQuiz).toEqual({});

    await delay(100); // Wait for 100ms (0.1s) for state change to QUESTION_OPEN

    const questionInfoRes5 = request(
      'GET',
      `${url}:${port}/v1/player/${dataPlayerJoin.playerId.toString()}/question/1`
    );
    expect(questionInfoRes5.statusCode).toBe(200);
    const questionInfoData5 = JSON.parse(questionInfoRes5.body.toString());
    expect(questionInfoData5).toStrictEqual({
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
        },
      ]),
    });

    const resEND = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${dataQuizCreate.quizId.toString()}/session/${dataStartSession.sessionId.toString()}`,
      {
        headers: { token: dataRegister.token },
        json: { action: 'END' },
      }
    );
    expect(resEND.statusCode).toBe(200);
    const dataEND = JSON.parse(resEND.body.toString());
    expect(dataEND).toEqual({});
  });
});
