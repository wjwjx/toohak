import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;
const ERROR = { error: expect.any(String) };

interface DataQuizCreate {
  quizId: number,
}
interface DataRegister {
  token: string,
}

let clearRes;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let dataQuizCreate: DataQuizCreate;
let dataClear: Record<string, never>;

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
  expect(resQuizCreate.statusCode).toBe(200);
  dataQuizCreate = JSON.parse(resQuizCreate.body.toString());
  expect(dataQuizCreate).toStrictEqual({ quizId: expect.any(Number) });
});

// V2 Routes
describe('V2 Routes', () => {
  test('V1 Routes Testing:', () => {
    // token is valid but not for logged in session
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const resRemove1 = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizIdString}`,
            { headers: { token: dataRegister.token + 1 } }
    );
    expect(resRemove1.statusCode).toBe(403);
    const dataRemove1 = JSON.parse(resRemove1.body.toString());
    expect(dataRemove1).toStrictEqual({ error: expect.any(String) });

    // Error: Invalid token value
    const resRemove2 = request(
      'DELETE',
          `${url}:${port}/v2/admin/quiz/${quizIdString}`,
          { headers: { token: ')*(@!#92' } }
    );
    expect(resRemove2.statusCode).toBe(401);
    const dataRemove2 = JSON.parse(resRemove2.body.toString());
    expect(dataRemove2).toStrictEqual(ERROR);

    // Error: QuizId not valid
    const resRemove3 = request(
      'DELETE',
          `${url}:${port}/v2/admin/quiz/${(dataQuizCreate.quizId + 1).toString()}`,
          { headers: { token: dataRegister.token } }
    );
    expect(resRemove3.statusCode).toBe(400);
    const dataRemove3 = JSON.parse(resRemove3.body.toString());
    expect(dataRemove3).toStrictEqual(ERROR);

    // Error: This user does not own this quiz
    const res2 = request(
      'POST',
          `${url}:${port}/v1/admin/auth/register`,
          { json: { email: 'name1.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({ token: expect.any(String) });

    const resRemove4 = request(
      'DELETE',
          `${url}:${port}/v2/admin/quiz/${quizIdString}`,
          { headers: { token: data2.token } }
    );
    expect(resRemove4.statusCode).toBe(400);
    const dataRemove4 = JSON.parse(resRemove4.body.toString());
    expect(dataRemove4).toStrictEqual(ERROR);

    // Success: Removal of a particular quiz
    const resRemove5 = request(
      'DELETE',
          `${url}:${port}/v2/admin/quiz/${quizIdString}`,
          { headers: { token: dataRegister.token } }
    );
    expect(resRemove5.statusCode).toBe(200);
    const dataRemove5 = JSON.parse(resRemove5.body.toString());
    expect(dataRemove5).toStrictEqual({});
  });
});

test('Error: All sessions for this quiz must be in END state', () => {
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

  const quizIdString = dataQuizCreate.quizId.toString();
  const resQuizQuestionCreate = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion
    }
  );
  expect(resQuizQuestionCreate.statusCode).toBe(200);
  const dataQuestionCreate = JSON.parse(resQuizQuestionCreate.body.toString());
  expect(dataQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  const resStartSession = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/session/start`,
    {
      headers: { token: dataRegister.token },
      json: { autoStartNum: 3 },
    }
  );
  expect(resStartSession.statusCode).toBe(200);
  const dataStartSession = JSON.parse(resStartSession.body.toString());
  expect(dataStartSession).toStrictEqual({ sessionId: expect.any(Number) });

  const resRemove = request(
    'DELETE',
        `${url}:${port}/v2/admin/quiz/${quizIdString}`,
        { headers: { token: dataRegister.token } }
  );
  expect(resRemove.statusCode).toBe(400);
  const dataRemove = JSON.parse(resRemove.body.toString());
  expect(dataRemove).toStrictEqual(ERROR);
});

// V1 Routes
describe('V1 Routes', () => {
  test('V1 Routes Testing:', () => {
    // V1 Error: Invalid token value
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const resRemove1 = request(
      'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizIdString}`,
        { qs: { token: ')*(@!#92' } }
    );
    expect(resRemove1.statusCode).toBe(401);
    const dataRemove1 = JSON.parse(resRemove1.body.toString());
    expect(dataRemove1).toStrictEqual(ERROR);

    // V1 Error: This user does not own this quiz
    const res2 = request(
      'POST',
        `${url}:${port}/v1/admin/auth/register`,
        { json: { email: 'name1.name@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({ token: expect.any(String) });

    const resRemove2 = request(
      'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizIdString}`,
        { qs: { token: data2.token } }
    );
    expect(resRemove2.statusCode).toBe(400);
    const dataRemove2 = JSON.parse(resRemove2.body.toString());
    expect(dataRemove2).toStrictEqual(ERROR);

    // Success: Removal of a particular quiz
    const resRemove3 = request(
      'DELETE',
        `${url}:${port}/v1/admin/quiz/${quizIdString}`,
        { qs: { token: dataRegister.token } }
    );
    expect(resRemove3.statusCode).toBe(200);
    const dataRemove3 = JSON.parse(resRemove3.body.toString());
    expect(dataRemove3).toStrictEqual({});

    // token is valid but not for logged in session
    const resRemove4 = request(
      'DELETE',
      `${url}:${port}/v1/admin/quiz/${quizIdString}`,
      { qs: { token: dataRegister.token + 1 } }
    );
    expect(resRemove4.statusCode).toBe(403);
    const dataRemove4 = JSON.parse(resRemove4.body.toString());
    expect(dataRemove4).toStrictEqual({ error: expect.any(String) });
  });
});
