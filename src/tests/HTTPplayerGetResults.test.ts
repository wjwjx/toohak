import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface userToken {
    token: string,
}

export interface quizId {
    quizId: number,
}

export interface sessionData {
  sessionId: number,
}

export interface playerData {
    playerId: number,
}

let USERDATA: userToken;
let QUIZDATA: quizId;
let sessionDATA: sessionData;
let playerDATA: playerData;

beforeEach(() => {
  // clearing the data
  const clearRes = request(
    'DELETE',
        `${url}:${port}/v1/clear`,
        { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
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
  expect(resQuizQuestionCreate.statusCode).toBe(200);
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
  expect(startSession.statusCode).toBe(200);
  sessionDATA = JSON.parse(startSession.body.toString());
  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });
});

describe('status 200', () => {
  test('success', async () => {
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
          json: { answerIds: [1] }
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

    // getting the results of the session
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/player/${playerDATA.playerId}/results`,
            {
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(OK);
    expect(results).toStrictEqual({
      usersRankedByScore: [
        {
          name: expect.any(String),
          score: expect.any(Number),
        },
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: expect.any(Number),
              playersCorrect: [
                expect.any(String),
              ]
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: expect.any(Number),
        }
      ]
    });
    // setting quiz to end state
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
  test('playerid does not exist', () => {
    // guest player joins
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

    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/player/${playerDATA.playerId + 1}/results`,
            {
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(INPUT_ERROR);
    expect(results).toStrictEqual({ error: expect.any(String) });

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
  test('session is not in final results', () => {
    // check results when lobby state
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

    const resultsRequest = request(
      'GET',
              `${url}:${port}/v1/player/${playerDATA.playerId}/results`,
              {
              }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(INPUT_ERROR);
    expect(results).toStrictEqual({ error: expect.any(String) });

    // end session
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
