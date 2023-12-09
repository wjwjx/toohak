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
interface DataQuizQuestionCreate {
  questionId: number,
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
let quizIdString: string; // quizIdString: string = dataQuizCreate.quizId.toString();
let resQuizQuestionCreate;
let dataQuizQuestionCreate: DataQuizQuestionCreate;
let questionIdString: string; // questionIdString: string = dataQuizQuestionCreate.questionId.toString();
let updateQuestionValid: validInput;
let updateQuestionValidOld: validInputOld;
let updateQuestionValidOld2: validInputOld;
let updateQuestionValidOld3: validInputOld;
let updateQuestionValidOld5: validInputOld;

// beforeEach test, clear data, register a user, create a quiz and creates a valid quiz question
// quizId is in dataQuizCreate.quizId
// The string version is quizIdString
// The token should be in dataRegister.token
// questionId should be in dataQuizQuestionCreate.questionId
// The string version is questionIdString
// The updated input is called updateQuestionValid
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
  dataQuizQuestionCreate = JSON.parse(resQuizQuestionCreate.body.toString());
  expect(dataQuizQuestionCreate).toStrictEqual({ questionId: expect.any(Number) });

  questionIdString = dataQuizQuestionCreate.questionId.toString();

  updateQuestionValid = {
    questionBody: {
      question: 'Who is the funny of England?',
      duration: 5,
      points: 5,
      thumbnailUrl: 'https://static.wikia.nocookie.net/youtube/images/3/35/Pusheenthecat.jpeg',
      answers: [
        {
          answer: 'Mr Bean',
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

describe('V2 PUT /v1/admin/quiz/{quizid}/question/{questionid} - Success', () => {
  test('Success: Valid quizId and questionId. Quiz information updated successfully', () => {
    const res = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
    {
      headers: { token: dataRegister.token },
      json: updateQuestionValid
    }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({});
  });
});

describe('V2 PUT /v1/admin/quiz/{quizid}/question/{questionid} - Incorrectly passed in question information', () => {
  test('Errors: Incorrectly passed in information', () => {
    // // QuizId does not refer to a valid quiz
    const quizIdStringInvalid2: string = quizIdString + 1;
    const res98 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdStringInvalid2}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: updateQuestionValid
      }
    );
    expect(res98.statusCode).toBe(400);
    const data98 = JSON.parse(res98.body.toString());
    expect(data98).toStrictEqual(ERROR);

    // QuestionId does not refer to a valid question within this quiz
    const questionIdStringInvalid2: string = questionIdString + 1;
    const res99 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdStringInvalid2}`,
      {
        headers: { token: dataRegister.token },
        json: updateQuestionValid
      }
    );
    expect(res99.statusCode).toBe(400);
    const data99 = JSON.parse(res99.body.toString());
    expect(data99).toStrictEqual(ERROR);

    // Question is too short
    const invalidQuestionShort = {
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, question: 'Hi' }
    };
    const res = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, question: 'A'.repeat(51) }
    };
    const res1 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionLong
      }
    );
    expect(res1.statusCode).toBe(400);
    const data1 = JSON.parse(res1.body.toString());
    expect(data1).toStrictEqual(ERROR);
    // Error: The question has more than 6 answers
    const invalidQuestionTooManyAnswers = {
      ...updateQuestionValid,
      questionBody: {
        ...updateQuestionValid.questionBody,
        answers: new Array(7).fill({ answer: 'A', correct: true }),
      },
    };
    const res3 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, answers: [{ answer: 'A', correct: true }] },
    };
    const res4 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, duration: -1 },
    };
    const res5 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, points: 0 },
    };
    const res6 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, points: 11 },
    };
    const res7 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
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
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, answers: [{ answer: '', correct: true }] },
    };
    const res8 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionShortAnswer
      }
    );
    expect(res8.statusCode).toBe(400);
    const data8 = JSON.parse(res8.body.toString());
    expect(data8).toStrictEqual(ERROR);
    // The length of any answer is longer than 30 characters long
    const invalidQuestionLongAnswer = {
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, answers: [{ answer: 'A'.repeat(31), correct: true }] },
    };
    const res9 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionLongAnswer
      }
    );
    expect(res9.statusCode).toBe(400);
    const data9 = JSON.parse(res9.body.toString());
    expect(data9).toStrictEqual(ERROR);
    // Error: Any answer strings are duplicates of one another (within the same question)
    const invalidQuestionDuplicateAnswers = {
      ...updateQuestionValid,
      questionBody: {
        ...updateQuestionValid.questionBody,
        answers: [
          { answer: 'A', correct: true },
          { answer: 'A', correct: false },
        ],
      },
    };
    const res10 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionDuplicateAnswers
      }
    );
    expect(res10.statusCode).toBe(400);
    const data10 = JSON.parse(res10.body.toString());
    expect(data10).toStrictEqual(ERROR);
    // Error: There are no correct answers
    const invalidQuestionNoCorrectAnswer = {
      ...updateQuestionValid,
      questionBody: {
        ...updateQuestionValid.questionBody,
        answers: [
          { answer: 'A', correct: false },
          { answer: 'B', correct: false },
        ],
      },
    };
    const res11 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: invalidQuestionNoCorrectAnswer
      }
    );
    expect(res11.statusCode).toBe(400);
    const data11 = JSON.parse(res11.body.toString());
    expect(data11).toStrictEqual(ERROR);

    // Error: If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes
    // Before this code, we have a duration of 4 seconds long
    // Create another valid question, this time being 175 seconds long
    const validQuestion1 = {
      ...validQuestion,
      questionBody: {
        ...validQuestion.questionBody,
        question: 'Question 1',
        duration: 175,
      },
    };
    const res12 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
      {
        headers: { token: dataRegister.token },
        json: validQuestion1
      }
    );
    expect(res12.statusCode).toBe(200);
    // The total now should be 179 seconds long
    // If the total exceeds 180, it should throw an error
    // Therefore, we should update the quiz so that is increases duration by 2 seconds
    // From 4 to 6 seconds, causing the overall quiz to have now 181 seconds, should return an error
    const updateValidQuestionBreaking = {
      ...updateQuestionValid,
      questionBody: {
        ...validQuestion.questionBody,
        duration: 6,
      },
    };
    const res13 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: updateValidQuestionBreaking
      }
    );
    expect(res13.statusCode).toBe(400);
    const data13 = JSON.parse(res13.body.toString());
    expect(data13).toStrictEqual(ERROR);

    // Token Issues
    // Not valid for currently loged in user
    const validQuestionTokenInvalid = {
      ...updateQuestionValid,
    };
    const res14 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token + '1' },
        json: validQuestionTokenInvalid
      }
    );
    expect(res14.statusCode).toBe(403);
    const data14 = JSON.parse(res14.body.toString());
    expect(data14).toStrictEqual(ERROR);
    // Invalid format
    const res15 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: '14Q$L' },
        json: validQuestionTokenInvalid
      }
    );
    expect(res15.statusCode).toBe(401);
    const data15 = JSON.parse(res15.body.toString());
    expect(data15).toStrictEqual(ERROR);

    // Thumbnail empty string
    const thumbnailEmptyString1 = {
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, thumbnailUrl: '' }
    };
    const res30 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
      {
        headers: { token: dataRegister.token },
        json: thumbnailEmptyString1
      }
    );
    expect(res30.statusCode).toBe(400);
    const data30 = JSON.parse(res30.body.toString());
    expect(data30).toStrictEqual(ERROR);

    // Thumbnail not jpg or png
    const thumbnailEmptyString2 = {
      ...updateQuestionValid,
      questionBody: { ...updateQuestionValid.questionBody, thumbnailUrl: 'https://cgi.cse.unsw.edu.au/~cs2521/23T2/assignments/ass2' }
    };
    const res31 = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}`,
    {
      headers: { token: dataRegister.token },
      json: thumbnailEmptyString2
    }
    );
    expect(res31.statusCode).toBe(400);
    const data31 = JSON.parse(res31.body.toString());
    expect(data31).toStrictEqual(ERROR);
  });
});

describe('V1 tests', () => {
  test('400, 401 and 403 Token Issues. Followed by 200 success', () => {
    // QuizId does not refer to a valid quiz
    updateQuestionValidOld = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the funny of England?',
        duration: 5,
        points: 5,
        answers: [
          {
            answer: 'Mr Bean',
            correct: true
          },
          {
            answer: 'Prince Harry',
            correct: false
          }
        ]
      }
    };
    const quizIdStringInvalid: string = quizIdString + 1;
    const res3 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdStringInvalid}/question/${questionIdString}`,
      { json: updateQuestionValidOld }
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual(ERROR);

    // Invalid structure
    updateQuestionValidOld2 = {
      token: '&*gdas2',
      questionBody: {
        question: 'Who is the funny of England?',
        duration: 5,
        points: 5,
        answers: [
          {
            answer: 'Mr Bean',
            correct: true
          },
          {
            answer: 'Prince Harry',
            correct: false
          }
        ]
      }
    };
    const res = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}`,
      { json: updateQuestionValidOld2 }
    );
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);

    // Not valid for current user
    updateQuestionValidOld3 = {
      token: dataRegister.token + '1',
      questionBody: {
        question: 'Who is the funny of England?',
        duration: 5,
        points: 5,
        answers: [
          {
            answer: 'Mr Bean',
            correct: true
          },
          {
            answer: 'Prince Harry',
            correct: false
          }
        ]
      }
    };
    const res2 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}`,
      { json: updateQuestionValidOld3 }
    );
    expect(res2.statusCode).toBe(403);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual(ERROR);

    // 200 success case
    updateQuestionValidOld5 = {
      token: dataRegister.token,
      questionBody: {
        question: 'Who is the funny of England?',
        duration: 5,
        points: 5,
        answers: [
          {
            answer: 'Mr Bean',
            correct: true
          },
          {
            answer: 'Prince Harry',
            correct: false
          }
        ]
      }
    };
    const res4 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}`,
      { json: updateQuestionValidOld5 }
    );
    expect(res4.statusCode).toBe(200);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toStrictEqual({});
  });
});
