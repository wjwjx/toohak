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
interface sessionData {
  sessionId: number,
}
interface PlayerData {
  playerId: number,
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
let resStartSession;
let sessionDATA: sessionData;
let guestPlayerDATA: PlayerData;

// beforeEach test, clear data, register a user, create a quiz and creates a question
// starts a session, adds a guest player

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
  dataQuizCreate = JSON.parse(resQuizCreate.body.toString());
  expect(resQuizCreate.statusCode).toBe(200);
  expect(dataQuizCreate).toStrictEqual({ quizId: expect.any(Number) });

  validQuestion = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      duration: 5,
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

  resStartSession = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizIdString}/session/start`,
    {
      headers: { token: dataRegister.token },
      json: { autoStartNum: 3 },
    }
  );
  expect(resStartSession.statusCode).toBe(200);
  sessionDATA = JSON.parse(resStartSession.body.toString());
  expect(sessionDATA).toStrictEqual({ sessionId: expect.any(Number) });

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
  expect(guestPlayerJoin.statusCode).toBe(200);
  guestPlayerDATA = JSON.parse(guestPlayerJoin.body.toString());
  expect(guestPlayerDATA).toStrictEqual({
    playerId: expect.any(Number),
  });
});

describe('successfully sends all messages', () => {
  test('Success: Sends two messages', () => {
    const sendMessage1 = request(
      'POST',
    `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/chat`,
    {
      json: { message: { messageBody: 'Hello everyone! Nice to chat.' } },
    }
    );
    expect(sendMessage1.statusCode).toBe(200);
    let data = JSON.parse(sendMessage1.body.toString());
    expect(data).toStrictEqual({});

    const sendMessage2 = request(
      'POST',
    `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/chat`,
    {
      json: { message: { messageBody: 'Hi im Tony' } },
    }
    );

    expect(sendMessage2.statusCode).toBe(200);
    data = JSON.parse(sendMessage2.body.toString());
    expect(data).toStrictEqual({});
  });
  test('Error: player ID does not exist', () => {
    const res = request(
      'POST',
      `${url}:${port}/v1/player/${(guestPlayerDATA.playerId + 1)}/chat`,
      {
        json: { message: { messageBody: 'Hi im Tony' } },
      }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
  test('Error: message body is less than 1 character or 100 characters', () => {
    const res = request(
      'POST',
      `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/chat`,
      {
        json: { message: { messageBody: '' } },
      }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);

    const res1 = request(
      'POST',
      `${url}:${port}/v1/player/${guestPlayerDATA.playerId}/chat`,
      {
        json: { message: { messageBody: '123dsnfjdfnsjdknfjskdnfjksdnfjksnfjksnfjksdnfjksdnfjksdnfsdjkfnsdjkfnsdjkfnsjkfnsjkfnsdjknfjskdnfjksdnfsjkfnsjdkfnjksdnfjks' } },
      }
    );
    expect(res1.statusCode).toBe(400);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual(ERROR);
  });
});
