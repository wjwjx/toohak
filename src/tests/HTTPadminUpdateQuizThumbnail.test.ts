import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const ERROR = { error: expect.any(String) };

interface tokenId {
  error?: string,
  token?: string,
}
interface DataQuizCreate {
  quizId: number,
}

let USERDATA: tokenId;
let QUIZDATA: DataQuizCreate;
const OK = 200;

// beforeEach test, clear data, register a user, create a quiz and creates a question, and starts a session

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
  const sessionDATA = JSON.parse(startSession.body.toString());
  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });
});

describe('Success: thumbnail updated', () => {
  test('Success: Returns an empty object {}', () => {
    const res = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/thumbnail`,
        {
          headers: { token: USERDATA.token },
          json: { imgUrl: 'https://static.wikia.nocookie.net/youtube/images/3/35/Pusheenthecat.jpeg' }
        }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toEqual({});
  });
});

describe('Errors', () => {
  test('Token issues', () => {
    const res = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/thumbnail`,
        {
          headers: { token: 'i$8972&g' },
          json: { imgUrl: 'https://picsum.photos/200/300' }
        }
    );
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);

    const res1 = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/thumbnail`,
        {
          headers: { token: USERDATA.token + '1' },
          json: { imgUrl: 'https://picsum.photos/200/300' }
        }
    );
    expect(res1.statusCode).toBe(403);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual(ERROR);
  });
  test('Quiz ID does not refer to a valid quiz', () => {
    const res = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${(QUIZDATA.quizId + 1).toString()}/thumbnail`,
        {
          headers: { token: USERDATA.token },
          json: { imgUrl: 'https://picsum.photos/200/300' }
        }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
  test('Quiz ID does not refer to quiz that this user owns', () => {
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
    const resQuizCreate2 = request(
      'POST',
        `${url}:${port}/v2/admin/quiz`,
        {
          headers: { token: dataRegister2.token },
          json: { name: 'What is one plus ones', description: 'the answer is obviously 3s' }
        }
    );
    const dataQuizCreate2 = JSON.parse(resQuizCreate2.body.toString());
    expect(resQuizCreate2.statusCode).toBe(200);
    expect(dataQuizCreate2).toStrictEqual({ quizId: expect.any(Number) });
    // Use the quizId of the second user, as input for the quiz created and started by the first
    const res = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${dataQuizCreate2.quizId.toString()}/thumbnail`,
        {
          headers: { token: USERDATA.token },
          json: { imgUrl: 'https://commons.wikimedia.org/wiki/File:Winding_path_%2814354572446%29.jpg' }
        }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
  test('imgURL issues', () => {
    // imgURL does not refer to a valid file
    const res = request(
      'PUT',
        `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/thumbnail`,
        {
          headers: { token: USERDATA.token },
          json: { imgUrl: 'http://djd' }
        }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);

    // imgURL is not a JPG or PNG image
    const res1 = request(
      'PUT',
          `${url}:${port}/v1/admin/quiz/${QUIZDATA.quizId.toString()}/thumbnail`,
          {
            headers: { token: USERDATA.token },
            json: { imgUrl: 'https://cgi.cse.unsw.edu.au/~cs2521/23T2/assignments/ass2' }
          }
    );
    expect(res1.statusCode).toBe(400);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual(ERROR);
  });
});
