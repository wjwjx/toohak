import request from 'sync-request-curl';
import config from '../config.json';

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

export interface quizId {
    quizId: number,
}

export interface sessionData {
  sessionId: number,
}

let USERDATA: userToken;
let QUIZDATA: quizId;
let sessionDATA: sessionData;

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
});

describe('status 200', () => {
  test('success', async () => {
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
    const guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
    expect(guestPlayerDATA).toStrictEqual({
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
        `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/question/${'1'}/answer`,
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

    // going to final results
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
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: USERDATA.token,
              },
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
        },
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
  test('more than 1 user and more than 1 question', async () => {
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

    const validQuestion2 = {
      questionBody: {
        question: 'Who is the MonWarch of EnLASDgland?',
        duration: 6,
        points: 7,
        thumbnailUrl: 'https://static.wikia.nocookie.net/youtube/images/3/35/Pusheenthecat.jpeg',
        answers: [
          {
            answer: 'PrinceASJDHharles',
            correct: true
          },
          {
            answer: 'Prince DWKQHarry',
            correct: false
          }
        ]
      }
    };

    // making a second question
    const resQuizQuestionCreate2 = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${QUIZDATA.quizId}/question`,
    {
      headers: { token: USERDATA.token },
      json: validQuestion2
    }
    );
    expect(resQuizQuestionCreate2.statusCode).toBe(200);
    const dataQuestionCreate2 = JSON.parse(resQuizQuestionCreate2.body.toString());
    expect(dataQuestionCreate2).toStrictEqual({ questionId: expect.any(Number) });

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

    // guest 1
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

    // guest palyer 2
    const guestPlayerJoin2 = request(
      'POST',
              `${url}:${port}/v1/player/join`,
              {
                json: {
                  sessionId: sessionDATA.sessionId,
                  name: 'tesKAJSDANKame',
                }
              }
    );
    expect(guestPlayerJoin2.statusCode).toBe(OK);
    const guestPlayerDATA2 = JSON.parse(guestPlayerJoin2.body.toString());
    expect(guestPlayerDATA2).toStrictEqual({
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

    await delay(200);

    // both players answering first question
    const answerRequest = request(
      'PUT',
        `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/question/${'1'}/answer`,
        {
          json: { answerIds: [1] }
        }
    );
    expect(answerRequest.statusCode).toBe(200);
    const data = JSON.parse(answerRequest.body.toString());
    expect(data).toEqual({});

    const answerRequest2 = request(
      'PUT',
        `${url}:${port}/v1/player/${guestPlayerDATA2.playerId}/question/${'1'}/answer`,
        {
          json: { answerIds: [2] }
        }
    );
    expect(answerRequest2.statusCode).toBe(200);
    const data2 = JSON.parse(answerRequest2.body.toString());
    expect(data2).toEqual({});

    // going to answer
    const gotoAnswer = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'GO_TO_ANSWER' }
        }
    );
    expect(gotoAnswer.statusCode).toBe(OK);

    // go to next question
    const nextQuestion = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'NEXT_QUESTION' }
        }
    );
    expect(nextQuestion.statusCode).toBe(OK);

    await delay(200);

    // now question is open
    // both players answer second question
    const answerRequest3 = request(
      'PUT',
        `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/question/${'2'}/answer`,
        {
          json: { answerIds: [1] }
        }
    );
    expect(answerRequest3.statusCode).toBe(200);
    const data3 = JSON.parse(answerRequest3.body.toString());
    expect(data3).toEqual({});

    const answerRequest4 = request(
      'PUT',
        `${url}:${port}/v1/player/${guestPlayerDATA2.playerId}/question/${'2'}/answer`,
        {
          json: { answerIds: [1] }
        }
    );
    expect(answerRequest4.statusCode).toBe(200);
    const data4 = JSON.parse(answerRequest4.body.toString());
    expect(data4).toEqual({});

    // going to answer
    const gotoAnswer2 = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'GO_TO_ANSWER' }
        }
    );
    expect(gotoAnswer2.statusCode).toBe(OK);

    // going to final results
    const gotoFINAL = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
        {
          headers: { token: USERDATA.token },
          json: { action: 'GO_TO_FINAL_RESULTS' }
        }
    );
    expect(gotoFINAL.statusCode).toBe(OK);

    // getting the results of the session
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: USERDATA.token,
              },
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
        },
        {
          questionId: expect.any(Number),
          questionCorrectBreakdown: [
            {
              answerId: expect.any(Number),
              playersCorrect: [
                expect.any(String),
                expect.any(String),
              ]
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: expect.any(Number),
        },
      ]
    });
    // putting session to end state
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
  test('quizId does not refer to valid quiz', () => {
    let tempQUIZDATA = QUIZDATA.quizId;
    tempQUIZDATA += 1;
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${tempQUIZDATA}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: USERDATA.token,
              },
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(INPUT_ERROR);
    expect(results).toStrictEqual({ error: expect.any(String) });
  });
  test('quizId does not refer to a quiz this user owns', () => {
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

    // make a new user
    const userRequest = request(
      'POST',
            `${url}:${port}/v1/admin/auth/register`,
            { json: { email: 'name.nadsa@test.com', password: 'Passtestasd3', nameFirst: 'CoEWrect', nameLast: 'CorQWct' } }
    );
    const USERDATA2 = JSON.parse(userRequest.body.toString());
    expect(userRequest.statusCode).toBe(OK);
    expect(USERDATA2).toStrictEqual({ token: expect.any(String) });

    // check for results using the second user
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: USERDATA2.token,
              },
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
  test('Session Id does not refer to a valid session within this quiz', () => {
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId + 5}/results`,
            {
              headers: {
                token: USERDATA.token,
              },
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(INPUT_ERROR);
    expect(results).toStrictEqual({ error: expect.any(String) });
  });
  test('Session is not in FINAL_RESULTS state', () => {
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

    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: USERDATA.token,
              },
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
});

describe('error 401', () => {
  test('Token is not a valid structure', () => {
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

    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: '!(#!@#^&!@',
              },
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(INVALID_TOKEN);
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
});

describe('error 403', () => {
  test('Provided token is valid structure, but is not for a currently logged in session', () => {
    let tempUSERDATA = parseInt(USERDATA.token);
    tempUSERDATA += 1;
    const tempUSERDATAstring = tempUSERDATA.toString();
    const resultsRequest = request(
      'GET',
            `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}/results`,
            {
              headers: {
                token: tempUSERDATAstring,
              },
            }
    );
    const results = JSON.parse(resultsRequest.body.toString());
    expect(resultsRequest.statusCode).toBe(LOGGED_IN_SESSION);
    expect(results).toStrictEqual({ error: expect.any(String) });
  });
});
