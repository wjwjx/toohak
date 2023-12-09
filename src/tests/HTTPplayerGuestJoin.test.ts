import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;

export interface userToken {
    token: string,
}

export interface quizData {
    quizId: number,
}

export interface sessionData {
    sessionId: number,
}

let USERDATA: userToken;
let QUIZDATA: quizData;
let sessionDATA: sessionData;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(() => {
  // clearing the data
  const clearRes = request(
    'DELETE',
        `${url}:${port}/v1/clear`,
        { qs: {} }
  );
  expect(clearRes.statusCode).toBe(OK);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  // register a new user
  const userRequest = request(
    'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  USERDATA = JSON.parse(userRequest.body.toString());
  expect(userRequest.statusCode).toBe(OK);
  expect(USERDATA).toStrictEqual({ token: expect.any(String) });

  // make a new quiz
  const quizRequest = request(
    'POST',
        `${url}:${port}/v2/admin/quiz`,
        {
          headers: {
            token: USERDATA.token,
          },
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

  const validQuestion = {
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

  // making a new question
  const resQuizQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${QUIZDATA.quizId}/question`,
    {
      headers: { token: USERDATA.token },
      json: validQuestion
    }
  );
  expect(resQuizQuestionCreate.statusCode).toBe(OK);
  const dataQuestionCreate = JSON.parse(resQuizQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  // start new session
  const startSession = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/start`,
    {
      headers: { token: USERDATA.token },
      json: { autoStartNum: 3 },
    }
  );
  expect(startSession.statusCode).toBe(OK);
  sessionDATA = JSON.parse(startSession.body.toString());
  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });
});

describe('guest player successfully joined', () => {
  test('3 players join, autostart', async () => {
    // player 1 join
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
    const guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(guestPlayerDATA).toStrictEqual({
      playerId: expect.any(Number),
    });

    // player 2 name is empty, string, should random generate
    const guestPlayerJoin2 = request(
      'POST',
              `${url}:${port}/v1/player/join`,
              {
                json: {
                  sessionId: sessionDATA.sessionId,
                  name: '',
                }
              }
    );
    expect(guestPlayerJoin2.statusCode).toBe(OK);
    const guestPlayerDATA2 = JSON.parse(guestPlayerJoin2.body.toString());
    expect(guestPlayerDATA2).toStrictEqual({
      playerId: expect.any(Number),
    });

    // add a player 3
    const guestPlayerJoin3 = request(
      'POST',
              `${url}:${port}/v1/player/join`,
              {
                json: {
                  sessionId: sessionDATA.sessionId,
                  name: 'testadasASDndsad23a2',
                }
              }
    );
    expect(guestPlayerJoin3.statusCode).toBe(OK);
    const guestPlayerDATA3 = JSON.parse(guestPlayerJoin3.body.toString());
    expect(guestPlayerDATA3).toStrictEqual({
      playerId: expect.any(Number),
    });

    // should now autostart
    await delay(1000); // Wait for 1 second (1s) for the logistics to run in the background

    // ending the session
    const endSession = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'END' }
        });
    expect(endSession.statusCode).toBe(200);
    const data = JSON.parse(endSession.body.toString());
    expect(data).toEqual({});
  });
});

describe('error 400', () => {
  test('name is not unique + session id invalid', () => {
    const guestPlayerJoin5 = request(
      'POST',
            `${url}:${port}/v1/player/join`,
            {
              json: {
                sessionId: 32343925,
                name: 'test name',
              }
            }
    );
    expect(guestPlayerJoin5.statusCode).toBe(400);
    const guestPlayerDATA5 = JSON.parse(guestPlayerJoin5.body.toString());
    expect(guestPlayerDATA5).toStrictEqual({ error: expect.any(String) });

    // guest player 1
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
    const guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(guestPlayerDATA).toStrictEqual({
      playerId: expect.any(Number),
    });

    // guest player 2
    const guestPlayerJoin2 = request(
      'POST',
            `${url}:${port}/v1/player/join`,
            {
              json: {
                sessionId: sessionDATA.sessionId,
                name: 'test name',
              }
            }
    );
    expect(guestPlayerJoin2.statusCode).toBe(INPUT_ERROR);
    const guestPlayerDATA2 = JSON.parse(guestPlayerJoin2.body.toString());
    expect(guestPlayerDATA2).toStrictEqual({
      error: expect.any(String),
    });
    // ending the session
    const endSession = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'END' }
        });
    expect(endSession.statusCode).toBe(200);
    const data = JSON.parse(endSession.body.toString());
    expect(data).toEqual({});
  });
  test('session is not in LOBBY state', () => {
    // update make the session end using update action
    const updateState = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/session/${sessionDATA.sessionId.toString()}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'END' }
        }
    );
    expect(updateState.statusCode).toBe(200);
    const stateDATA = JSON.parse(updateState.body.toString());
    expect(stateDATA).toEqual({});

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
    expect(guestPlayerJoin.statusCode).toBe(INPUT_ERROR);
    const guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(guestPlayerDATA).toStrictEqual({
      error: expect.any(String),
    });
  });
  test('session is not in LOBBY state 2', () => {
    // update make the session end using update action
    const updateState = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/session/${sessionDATA.sessionId.toString()}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'NEXT_QUESTION' }
        }
    );
    expect(updateState.statusCode).toBe(200);
    const stateDATA = JSON.parse(updateState.body.toString());
    expect(stateDATA).toEqual({});

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
    expect(guestPlayerJoin.statusCode).toBe(INPUT_ERROR);
    const guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(guestPlayerDATA).toStrictEqual({
      error: expect.any(String),
    });
    // ending the session
    const endSession = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'END' }
        });
    expect(endSession.statusCode).toBe(200);
    const data = JSON.parse(endSession.body.toString());
    expect(data).toEqual({});
  });
});
