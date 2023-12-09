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

let clearRes;
let dataClear: Record<string, never>;
let resRegister;
let dataRegister: DataRegister;
let resQuizCreate;
let dataQuizCreate: DataQuizCreate;
let validQuestion: validInput;
let quizIdString: string; // quizIdString: string = dataQuizCreate.quizId.toString();
let resQuizQuestionCreate;
let resQuizQuestionCreate2;
let resQuizQuestionCreate3;
let resQuizQuestionCreate4;
let dataQuizQuestionCreate: DataQuizQuestionCreate;
let questionIdString: string; // questionIdString: string = dataQuizQuestionCreate.questionId.toString();
let questionIdString2: string;
let validQuestion2: validInput;
let validQuestion3: validInput;
let validQuestion4: validInput;
let dataQuizQuestionCreate2: DataQuizQuestionCreate;

// beforeEach test, clear data, register a user, create a quiz and create 4 valid quiz questions
// quizId -> dataQuizCreate.quizId
// quizIdString
// token -> dataRegister.token
// questionId -> dataQuizQuestionCreate.questionId
// questionIdString                                // 1
// questionIdString2                               // 2
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

  quizIdString = dataQuizCreate.quizId.toString();

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

  validQuestion2 = {
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
  resQuizQuestionCreate2 = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion2
    }
  );
  expect(resQuizQuestionCreate2.statusCode).toBe(200);
  dataQuizQuestionCreate2 = JSON.parse(resQuizQuestionCreate2.body.toString());
  questionIdString2 = dataQuizQuestionCreate2.questionId.toString();
  validQuestion3 = {
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
  resQuizQuestionCreate3 = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion3
    }
  );
  expect(resQuizQuestionCreate3.statusCode).toBe(200);
  validQuestion4 = {
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
  resQuizQuestionCreate4 = request(
    'POST',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question`,
    {
      headers: { token: dataRegister.token },
      json: validQuestion4
    }
  );
  expect(resQuizQuestionCreate4.statusCode).toBe(200);
});

describe('V2 and V1 PUT /vX/admin/quiz/{quizid}/question/{questionid}/move - Error Cases with Input', () => {
  test('Error Cases with Input', () => {
    // Token Issues
    // Not correct for currently logged in user
    const res = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`,
      {
        headers: { token: dataRegister.token + 1 },
        json: { newPosition: 2 }
      }
    );
    expect(res.statusCode).toBe(403);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
    // Incorrect structure
    const res2 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`,
      {
        headers: { token: 'sa34A#' },
        json: { newPosition: 2 }
      }
    );
    expect(res2.statusCode).toBe(401);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual(ERROR);
    // Error: New position is the position of the current position
    const res3 = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting with question 1
    { headers: { token: dataRegister.token }, json: { newPosition: 0 } } // newPosition is 0, which is where question 1 is
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual(ERROR);
    // Error: New position is less than 0
    const res4 = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
    { headers: { token: dataRegister.token }, json: { newPosition: -1 } } // Input with newPosition -1
    );
    expect(res4.statusCode).toBe(400);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toStrictEqual(ERROR);
    // Error: New Position is greater than n-1 where n is the number of questions
    const res5 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
      { headers: { token: dataRegister.token }, json: { newPosition: 4 } } // Input with newPosition 4, which is greater than 3 (n-1)
    );
    expect(res5.statusCode).toBe(400);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toStrictEqual(ERROR);

    // Error: Valid questionId but invalid quizId
    const quizIdStringInvalid: string = quizIdString + 1;
    const res6 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdStringInvalid}/question/${questionIdString}/move`, // Inputting question position 1
      {
        headers: { token: dataRegister.token },
        json: { newPosition: 2 }
      } // Input with newPosition 2. Switching the first with the second
    );
    expect(res6.statusCode).toBe(400);
    const data6 = JSON.parse(res6.body.toString());
    expect(data6).toStrictEqual(ERROR);

    // Error: Valid quizId but invalid questionId
    const questionIdStringInvalid: string = questionIdString + 1;
    const res7 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdStringInvalid}/move`, // Inputting question position 11
      {
        headers: { token: dataRegister.token },
        json: { newPosition: 2 }
      } // Input with newPosition 2
    );
    expect(res7.statusCode).toBe(400);
    const data7 = JSON.parse(res7.body.toString());
    expect(data7).toStrictEqual(ERROR);

    // V1 CASES
    //
    //
    //
    //
    //
    // Token Issues
    // 403 Not correct for currently logged in user
    const res8 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}/move`,
      { json: { token: dataRegister.token + 1, newPosition: 2 } }
    );
    expect(res8.statusCode).toBe(403);
    const data8 = JSON.parse(res8.body.toString());
    expect(data8).toStrictEqual(ERROR);
    // 401 Incorrect structure
    const res9 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}/move`,
      { json: { token: 'sa34A#', newPosition: 2 } }
    );
    expect(res9.statusCode).toBe(401);
    const data9 = JSON.parse(res9.body.toString());
    expect(data9).toStrictEqual(ERROR);
    // Error: New position is less than 0
    const res10 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
      { json: { token: dataRegister.token, newPosition: -1 } } // Input with newPosition -1
    );
    expect(res10.statusCode).toBe(400);
    const data10 = JSON.parse(res10.body.toString());
    expect(data10).toStrictEqual(ERROR);
    // Error: New position is position of the current question
    const res11 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
      { json: { token: dataRegister.token, newPosition: 0 } } // Input with newposition 0, which is where 1 is
    );
    expect(res11.statusCode).toBe(400);
    const data11 = JSON.parse(res11.body.toString());
    expect(data11).toStrictEqual(ERROR);
  });
});

describe('V2 and V1 PUT /vX/admin/quiz/{quizid}/question/{questionid}/move Success', () => {
  test('Success: Switching questions', () => {
    // 4 Questions. Switching first with second
    const res3 = request(
      'PUT',
      `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
      {
        headers: { token: dataRegister.token },
        json: { newPosition: 2 }
      } // Input with newPosition 2. Switching the first with the second
    );
    expect(res3.statusCode).toBe(200);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual({});

    // 4 Questions. Switch Question 2 with Question 3
    const res = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString2}/move`, // Inputting question position 2
    { headers: { token: dataRegister.token }, json: { newPosition: 3 } } // Input with newPosition 3. Switching the second question with the 3rd
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({});

    // 4 Questions. Switch Question 1 with Question 3
    const res2 = request(
      'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
    { headers: { token: dataRegister.token }, json: { newPosition: 3 } } // Input with newPosition 3. Switching the first and third
    );
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({});

    // V1 CASE
    const res5 = request(
      'PUT',
      `${url}:${port}/v1/admin/quiz/${quizIdString}/question/${questionIdString}/move`, // Inputting question position 1
      { json: { token: dataRegister.token, newPosition: 2 } } // Input with newPosition 2. Switching the first with the second
    );
    expect(res5.statusCode).toBe(200);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toStrictEqual({});
  });
});
