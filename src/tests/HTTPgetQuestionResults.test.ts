import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionBody } from '../dataStore';

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

export interface SessionData {
  sessionId: number;
}

export interface PlayerData {
  playerId: number;
}

export interface ValidQuestions {
  questionBody: QuestionBody;
}

let USERDATA: userToken;
let QUIZDATA: quizId;
let sessionDATA: SessionData;
let playerDATA: PlayerData;
let validQuestion: ValidQuestions;

beforeEach(async () => {
  // clearing the data
  const clearRes = request('DELETE', `${url}:${port}/v1/clear`, { qs: {} });

  expect(clearRes.statusCode).toBe(200);

  const dataClear = JSON.parse(clearRes.body.toString());

  expect(dataClear).toEqual({});

  // register a new user
  const userRequest = request('POST', `${url}:${port}/v1/admin/auth/register`, {
    json: { email: 'name.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' },
  });

  USERDATA = JSON.parse(userRequest.body.toString());

  expect(userRequest.statusCode).toBe(OK);
  expect(USERDATA).toStrictEqual({ token: expect.any(String) });

  // make a new quiz
  const quizRequest = request('POST', `${url}:${port}/v2/admin/quiz`, {
    headers: {
      token: USERDATA.token,
    },
    json: {
      name: 'What is one plus one',
      description: 'the answer is obviously 3',
    },
  });

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
          correct: true,
        },
        {
          answer: 'Prince Harry',
          correct: false,
        },
      ],
    },
  };

  // making a new question
  const resQuizQuestionCreate = request('POST', `${url}:${port}/v2/admin/quiz/${QUIZDATA.quizId}/question`, {
    headers: { token: USERDATA.token },
    json: validQuestion,
  });

  expect(resQuizQuestionCreate.statusCode).toBe(200);

  const dataQuestionCreate = JSON.parse(resQuizQuestionCreate.body.toString());

  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  // start new session
  const startSession = request('POST', `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/start`, {
    headers: { token: USERDATA.token },
    json: { autoStartNum: 3 },
  });

  expect(startSession.statusCode).toBe(200);

  sessionDATA = JSON.parse(startSession.body.toString());

  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });

  // guest player joins
  const guestPlayerJoin = request('POST', `${url}:${port}/v1/player/join`, {
    json: {
      sessionId: sessionDATA.sessionId,
      name: 'test name',
    },
  });

  expect(guestPlayerJoin.statusCode).toBe(OK);

  playerDATA = JSON.parse(guestPlayerJoin.body.toString());

  expect(playerDATA).toStrictEqual({
    playerId: expect.any(Number),
  });

  // changing state to question open
  const questionOpen = request('PUT', `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`, {
    headers: { token: USERDATA.token },
    json: { action: 'NEXT_QUESTION' },
  });

  expect(questionOpen.statusCode).toBe(OK);

  await delay(200); // Wait for 200ms (0.2s) for state change to QUESTION_OPEN

  // answering the first question
  const answerRequest = request('PUT', `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'1'}/answer`, {
    json: { answerIds: [1] },
  });

  expect(answerRequest.statusCode).toBe(200);

  const data = JSON.parse(answerRequest.body.toString());

  expect(data).toEqual({});

  const gotoAnswer = request('PUT', `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`, {
    headers: { token: USERDATA.token },
    json: { action: 'GO_TO_ANSWER' },
  });

  expect(gotoAnswer.statusCode).toBe(OK);
});

describe('error 400s & 200', () => {
  test('All test cases', () => {
    // playerid does not exist - ERROR 400
    const resQuestionResult1 = request(
      'GET',
      `${url}:${port}/v1/player/${playerDATA.playerId + 1}/question/${'1'}/results`
    );
    expect(resQuestionResult1.statusCode).toBe(INPUT_ERROR);
    const results1 = JSON.parse(resQuestionResult1.body.toString());
    expect(results1).toStrictEqual({ error: expect.any(String) });

    // question position is not valid for the session - ERROR 400
    const resQuestionResult2 = request(
      'GET',
      `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'10'}/results`
    );
    expect(resQuestionResult2.statusCode).toBe(INPUT_ERROR);
    const results2 = JSON.parse(resQuestionResult2.body.toString());
    expect(results2).toStrictEqual({ error: expect.any(String) });

    // Session is not yet up to this question - ERROR 400
    const resQuizQuestionCreate2 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${QUIZDATA.quizId}/question`,
      {
        headers: { token: USERDATA.token },
        json: validQuestion
      }
    );
    expect(resQuizQuestionCreate2.statusCode).toBe(200);
    const dataQuestionCreate2 = JSON.parse(resQuizQuestionCreate2.body.toString());
    expect(dataQuestionCreate2).toStrictEqual({ questionId: expect.any(Number) });

    const resQuestionResult3 = request(
      'GET',
      `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'2'}/results`
    );
    expect(resQuestionResult3.statusCode).toBe(INPUT_ERROR);
    const results3 = JSON.parse(resQuestionResult3.body.toString());
    expect(results3).toStrictEqual({ error: expect.any(String) });

    // SUCCESS CASE
    const resQuestionResult4 = request(
      'GET',
      `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'1'}/results`
    );
    expect(resQuestionResult4.statusCode).toBe(OK);
    const results4 = JSON.parse(resQuestionResult4.body.toString());
    expect(results4).toStrictEqual({
      questionId: expect.any(Number),
      questionCorrectBreakdown: expect.arrayContaining([
        {
          answerId: expect.any(Number),
          playersCorrect: expect.arrayContaining([expect.any(String)])
        }
      ]),
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number)
    });

    // session is not in ANSWER_SHOW state - ERROR 400
    const end = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId}/session/${sessionDATA.sessionId}`,
      {
        headers: { token: USERDATA.token },
        json: { action: 'END' }
      }
    );
    expect(end.statusCode).toBe(OK);
    const resQuestionResult5 = request(
      'GET',
      `${url}:${port}/v1/player/${playerDATA.playerId}/question/${'1'}/results`
    );
    expect(resQuestionResult5.statusCode).toBe(INPUT_ERROR);
    const results5 = JSON.parse(resQuestionResult5.body.toString());
    expect(results5).toStrictEqual({ error: expect.any(String) });
  });
});
