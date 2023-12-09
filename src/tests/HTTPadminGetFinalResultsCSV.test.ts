import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody } from '../dataStore';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface userToken {
    token: string,
}

export interface quizData {
    quizId: number,
}

export interface questionData {
    questionId: number,
}

interface validInput {
    questionBody: QuestionBody,
}

interface sessionData {
    sessionId: number,
}

interface playerData {
    playerId: number,
}

let USERDATA: userToken;
let QUIZDATA: quizData;
let questionCreate: questionData;
let validQuestion: validInput;
let sessionDATA: sessionData;
let playerDATA: playerData;

beforeEach(() => {
  // clear the data
  const clearRes = request(
    'DELETE',
        `${url}:${port}/v1/clear`,
        { qs: {} }
  );
  expect(clearRes.statusCode).toBe(OK);
  const data1 = JSON.parse(clearRes.body.toString());
  expect(data1).toEqual({});

  // make a new user
  const USER = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        {
          json: {
            email: 'name@name.com',
            password: 'testpassword123',
            nameFirst: 'Hayden',
            nameLast: 'Smith'
          }
        }
  );
  expect(USER.statusCode).toBe(OK);
  USERDATA = JSON.parse(USER.body.toString());
  expect(USERDATA).toStrictEqual({ token: expect.any(String) });

  // make a new quiz
  const quizRequest = request(
    'POST',
                `${url}:${port}/v2/admin/quiz`,
                {
                  headers: { token: USERDATA.token },
                  json: {
                    name: 'What is one plus one',
                    description: 'the answer is obviously 3'
                  },
                }
  );
  QUIZDATA = JSON.parse(quizRequest.body.toString());
  expect(quizRequest.statusCode).toBe(OK);
  expect(QUIZDATA).toStrictEqual({
    quizId: expect.any(Number),
  });

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

  // make a new question in that quiz
  const quizIdString: string = QUIZDATA.quizId.toString();
  const questionRequest = request(
    'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: USERDATA.token },
        json: validQuestion,
      }
  );
  expect(questionRequest.statusCode).toBe(OK);
  questionCreate = JSON.parse(questionRequest.body.toString());
  expect(questionCreate).toStrictEqual({ questionId: expect.any(Number) });

  // start a new session
  const sessionStart = request(
    'POST',
        `${url}:${port}/v1/admin/quiz/${quizIdString}/session/start`,
        {
          headers: { token: USERDATA.token },
          json: { autoStartNum: 3 },
        }
  );
  expect(sessionStart.statusCode).toBe(OK);
  sessionDATA = JSON.parse(sessionStart.body.toString());
  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });
});

describe('successful case', () => {
  test('successful CSV', async () => {
    // guest player joining
    const guestPlayerJoin = request(
      'POST',
              `${url}:${port}/v1/player/join`,
              {
                json: {
                  sessionId: sessionDATA.sessionId,
                  name: 'test name',
                }
              }
    );
    expect(guestPlayerJoin.statusCode).toBe(OK);
    playerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(playerDATA).toStrictEqual({
      playerId: expect.any(Number),
    });

    // changing state to question open
    const questionOpen = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'NEXT_QUESTION' }
        }
    );
    expect(questionOpen.statusCode).toBe(OK);

    await delay(200); // Wait for 200ms (0.2s) for state change to QUESTION_OPEN

    // answering the first question
    const answerRequest = request(
      'PUT',
        `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'1'}/answer`,
        {
          json: { answerIds: [2] }
        }
    );
    expect(answerRequest.statusCode).toBe(200);
    const data = JSON.parse(answerRequest.body.toString());
    expect(data).toEqual({});

    const gotoAnswer = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'GO_TO_ANSWER' }
        }
    );
    expect(gotoAnswer.statusCode).toBe(OK);

    // going to answer
    const next = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'GO_TO_FINAL_RESULTS' }
        }
    );
    expect(next.statusCode).toBe(OK);

    const sessionResultsCSV = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results/csv`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(sessionResultsCSV.statusCode).toBe(OK);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      url: expect.any(String),
    });

    // move session to end
    const end = request(
      'PUT',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
            {
              headers: { token: USERDATA.token },
              json: { action: 'END' }
            }
    );
    expect(end.statusCode).toBe(OK);
  });
});

describe('error 400', () => {
  test('quizid doesnt refer to valid quiz', () => {
    const tempQuizId = QUIZDATA.quizId + 1;
    const sessionResultsCSV = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${tempQuizId}/session/${sessionDATA.sessionId}/results/csv`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(sessionResultsCSV.statusCode).toBe(INPUT_ERROR);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
    // move session to end
    const end = request(
      'PUT',
              `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
              {
                headers: { token: USERDATA.token },
                json: { action: 'END' }
              }
    );
    expect(end.statusCode).toBe(OK);
  });
  test('quizid does not refer to a quiz this user owns', () => {
    // make a second user
    const USER = request(
      'POST',
                `${url}:${port}/v1/admin/auth/register`,
                {
                  json: {
                    email: 'name@pame.com',
                    password: 'testASDssword123',
                    nameFirst: 'HayWn',
                    nameLast: 'SmAh'
                  }
                }
    );
    expect(USER.statusCode).toBe(OK);
    const USERDATA2 = JSON.parse(USER.body.toString());
    expect(USERDATA2).toStrictEqual({ token: expect.any(String) });

    // create a second quiz with that new user
    const quizRequest = request(
      'POST',
                    `${url}:${port}/v2/admin/quiz`,
                    {
                      headers: {
                        token: USERDATA2.token
                      },
                      json: {
                        name: 'What is one pldsadne',
                        description: 'the ansaSD obviously 3'
                      },
                    }
    );
    const QUIZDATA2 = JSON.parse(quizRequest.body.toString());
    expect(quizRequest.statusCode).toBe(OK);
    expect(QUIZDATA2).toStrictEqual({
      quizId: expect.any(Number),
    });

    // try to call with wrong user
    const sessionResultsCSV = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA2.quizId}/session/${sessionDATA.sessionId}/results/csv`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    expect(sessionResultsCSV.statusCode).toBe(INPUT_ERROR);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
    // move session to end
    const end = request(
      'PUT',
              `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
              {
                headers: { token: USERDATA.token },
                json: { action: 'END' }
              }
    );
    expect(end.statusCode).toBe(OK);
  });
  test('sessionid does not refer to a valid quiz', () => {
    const sessionResultsCSV = request(
      'GET',
                `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results/csv`,
                {
                  headers: {
                    token: USERDATA.token,
                  }
                }
    );
    expect(sessionResultsCSV.statusCode).toBe(INPUT_ERROR);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
    // move session to end
    const end = request(
      'PUT',
              `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
              {
                headers: { token: USERDATA.token },
                json: { action: 'END' }
              }
    );
    expect(end.statusCode).toBe(OK);
  });
  test('session is not in final state', () => {
    const sessionResultsCSV = request(
      'GET',
                `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results/csv`,
                {
                  headers: {
                    token: USERDATA.token,
                  }
                }
    );
    expect(sessionResultsCSV.statusCode).toBe(INPUT_ERROR);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
    // move session to end
    const end = request(
      'PUT',
              `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
              {
                headers: { token: USERDATA.token },
                json: { action: 'END' }
              }
    );
    expect(end.statusCode).toBe(OK);
  });
});

describe('error 401', () => {
  test('token is invalid structure', () => {
    const sessionResultsCSV = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results/csv`,
            {
              headers: {
                token: '@!()#*!',
              }
            }
    );
    expect(sessionResultsCSV.statusCode).toBe(INVALID_TOKEN);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
  });
});

describe('error 403', () => {
  test('token is valid structure but not for a logged in session', () => {
    const sessionResultsCSV = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results/csv`,
            {
              headers: {
                token: USERDATA.token + 1,
              }
            }
    );
    expect(sessionResultsCSV.statusCode).toBe(LOGGED_IN_SESSION);
    const sessionResultsCSVurl = JSON.parse(sessionResultsCSV.body.toString());
    expect(sessionResultsCSVurl).toStrictEqual({
      error: expect.any(String),
    });
  });
});
