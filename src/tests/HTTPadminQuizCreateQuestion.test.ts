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
interface validInputOld {
  token: string,
  questionBody: QuestionBody,
}

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let dataQuizCreate: DataQuizCreate;
let validQuestion: validInput;
let validQuestionOld: validInputOld;

// beforeEach test, clear data, register a user, create a quiz
// The quizId should be saved in quizIdString
// The token should be in dataRegister.token
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
});

describe('POST /v1/admin/quiz/{quizid}/question - Valid Question, Incorrect/Correct quizId', () => {
  test('Success JPG: Valid quizId and question created successfully', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion
      }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ questionId: expect.any(Number) });
  });
});

describe('POST /v1/admin/quiz/{quizid}/question - Incorrectly passed in question information', () => {
  test('Input Errors Simple', () => {
    const quizIdString: string = dataQuizCreate.quizId.toString();
    // Error: Question string is less than 5 characters in length
    const invalidQuestionShort = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, question: 'Hi' }
    };
    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionShort
      }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
    // Error: Question string is greater than 50 characters in length
    const invalidQuestionLong = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, question: 'A'.repeat(51) }
    };
    const res2 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionLong
      }
    );
    expect(res2.statusCode).toBe(400);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual(ERROR);
    // Error: The question has more than 6 answers
    const invalidQuestionTooManyAnswers = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        answers: new Array(7).fill({ answer: 'A', correct: true }),
      },
    };
    const res3 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionTooManyAnswers
      }
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual(ERROR);
    // Error: The question has less than 2 answers
    const invalidQuestionTooFewAnswers = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, answers: [{ answer: 'A', correct: true }] },
    };
    const res4 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionTooFewAnswers
      }
    );
    expect(res4.statusCode).toBe(400);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toStrictEqual(ERROR);
    // Error: The question duration is not a positive number
    const invalidQuestionNonPositiveDuration = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, duration: -1 },
    };
    const res5 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionNonPositiveDuration
      }
    );
    expect(res5.statusCode).toBe(400);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toStrictEqual(ERROR);
    // Error: The points awarded for the question are less than 1
    const invalidQuestionTooFewPoints = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, points: 0 },
    };
    const res6 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionTooFewPoints
      }
    );
    expect(res6.statusCode).toBe(400);
    const data6 = JSON.parse(res6.body.toString());
    expect(data6).toStrictEqual(ERROR);
    // Error: The points awarded for the question are greater than 10
    const invalidQuestionTooManyPoints = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, points: 11 },
    };
    const res7 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionTooManyPoints
      }
    );
    expect(res7.statusCode).toBe(400);
    const data7 = JSON.parse(res7.body.toString());
    expect(data7).toStrictEqual(ERROR);
    // Error: The length of any answer is shorter than 1 character long
    const invalidQuestionShortAnswer = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, answers: [{ answer: '', correct: true }] },
    };
    const res8 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionShortAnswer
      }
    );
    expect(res8.statusCode).toBe(400);
    const data8 = JSON.parse(res8.body.toString());
    expect(data8).toStrictEqual(ERROR);
    // Error: The length of any answer is longer than 30 characters long
    const invalidQuestionLongAnswer = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, answers: [{ answer: 'A'.repeat(31), correct: true }] },
    };
    const res9 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionLongAnswer
      }
    );
    expect(res9.statusCode).toBe(400);
    const data9 = JSON.parse(res9.body.toString());
    expect(data9).toStrictEqual(ERROR);
    // Error: There are no correct answers
    const invalidQuestionNoCorrectAnswer = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        answers: [
          { answer: 'A', correct: false },
          { answer: 'B', correct: false },
        ],
      },
    };
    const res10 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionNoCorrectAnswer
      }
    );
    expect(res10.statusCode).toBe(400);
    const data10 = JSON.parse(res10.body.toString());
    expect(data10).toStrictEqual(ERROR);
    // Error: Any answer strings are duplicates of one another (within the same question)
    const invalidQuestionDuplicateAnswers = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        answers: [
          { answer: 'A', correct: true },
          { answer: 'A', correct: false },
        ],
      },
    };
    const res11 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionDuplicateAnswers
      }
    );
    expect(res11.statusCode).toBe(400);
    const data11 = JSON.parse(res11.body.toString());
    expect(data11).toStrictEqual(ERROR);

    // Error: Token Issues
    // Token correct format but not for current user
    const res12 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token + '1' },
        json: validQuestion
      }
    );
    expect(res12.statusCode).toBe(403);
    const data12 = JSON.parse(res12.body.toString());
    expect(data12).toStrictEqual(ERROR);
    // Token incorrect format
    const res13 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: 'AD&84' },
        json: validQuestion
      }
    );
    expect(res13.statusCode).toBe(401);
    const data13 = JSON.parse(res13.body.toString());
    expect(data13).toStrictEqual(ERROR);
    // Thumbnail empty string
    const thumbnailEmptyString = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, thumbnailUrl: '' },
    };
    const res20 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: thumbnailEmptyString
      }
    );
    expect(res20.statusCode).toBe(400);
    const data20 = JSON.parse(res20.body.toString());
    expect(data20).toStrictEqual(ERROR);
    // Thumbnail does not return to a valid file
    const thumbnailInvalidFile = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, thumbnailUrl: 'http://djd' },
    };
    const res21 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: thumbnailInvalidFile
      }
    );
    expect(res21.statusCode).toBe(400);
    const data21 = JSON.parse(res21.body.toString());
    expect(data21).toStrictEqual(ERROR);
    // ThumbnailUrl not JPG or PNG
    const thumbnailInvalidFile2 = {
      ...validQuestion,
      questionBody: { ...validQuestion.questionBody, thumbnailUrl: 'https://cgi.cse.unsw.edu.au/~cs2521/23T2/assignments/ass2' },
    };
    const res22 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: thumbnailInvalidFile2
      }
    );
    expect(res22.statusCode).toBe(400);
    const data22 = JSON.parse(res22.body.toString());
    expect(data22).toStrictEqual(ERROR);
    // Invalid QuizID
    const quizIdStringBroken1: string = (dataQuizCreate.quizId + 1).toString();
    const res23 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdStringBroken1}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion
      }
    );
    expect(res23.statusCode).toBe(400);
    const data23 = JSON.parse(res23.body.toString());
    expect(data23).toStrictEqual(ERROR);
  });
  test('Errors Complex: The sum of the question durations in the quiz exceeds 3 minutes', () => {
    const validQuestion1 = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        question: 'Question 1',
        duration: 100,
      },
    };
    const validQuestion2 = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        question: 'Question 2',
        duration: 79,
      },
    };
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion1
      }
    );
    expect(res.statusCode).toBe(200);
    const res2 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion2
      }
    );
    expect(res2.statusCode).toBe(200);

    const validQuestionBreaking = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        question: 'Question 3',
        duration: 70,
      },
    };
    const res3 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestionBreaking
      }
    );
    expect(res3.statusCode).toBe(400);
    const data = JSON.parse(res3.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
});

// Register user and quiz created before this point. Now we register a second user, and a quiz with the second user
// We will try to add a question using the second user, to the first users quiz. It should not work
describe('POST /v1/admin/quiz/{quizid}/question - Quiz Id does not refer to a quiz that this user owns', () => {
  test('Quiz Id does not refer to a quiz that this user owns', () => {
    const resRegister2 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
    );
    expect(resRegister2.statusCode).toBe(200);
    const dataRegister2 = JSON.parse(resRegister2.body.toString());
    expect(dataRegister2).toStrictEqual({ token: expect.any(String) });

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
    // Setting the quizId to the 1st user
    const quizIdString: string = dataQuizCreate.quizId.toString();

    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister2.token },
        json: validQuestion
      }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
});

describe('V1 Routes', () => {
  test('200 Success: Valid quizId and question created successfully', () => {
    validQuestionOld = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
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
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
      { json: validQuestionOld }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({ questionId: expect.any(Number) });
  });
  test('403 Error: token is not correct for currently logged in user', () => {
    validQuestionOld = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
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
    const validQuestionTokenInvalid = {
      ...validQuestionOld,
      token: validQuestionOld.token + '1',
    };
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
      { json: validQuestionTokenInvalid }
    );
    expect(res.statusCode).toBe(403);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
  test('401 Error: Token is not a valid structure', () => {
    validQuestionOld = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
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
    const validQuestionTokenInvalid = {
      ...validQuestionOld,
      token: 'DS89$',
    };
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
      { json: validQuestionTokenInvalid }
    );
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
  test('400 Error: Question string is less than 5 characters in length', () => {
    validQuestionOld = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
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

    const invalidQuestionShort = {
      ...validQuestionOld,
      questionBody: { ...validQuestion.questionBody, question: 'Hi' }
    };
    const quizIdString: string = dataQuizCreate.quizId.toString();
    const res = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question`,
      { json: invalidQuestionShort }
    );
    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
  });
});
