import request from 'sync-request-curl';
import config from '../config.json';

const port: string = config.port;
const url: string = config.url;

const OK = 200;
const INPUT_ERROR = 400;
const INVALID_TOKEN = 401;
const LOGGED_IN_SESSION = 403;

export interface userToken {
    token: string,
}

export interface quizReturn {
    quizId: number,
}

export interface questionCreateReturn {
    questionId: number,
}

let USERDATA: userToken;
let QUIZDATA: quizReturn;
let quizid: string;
let QUESTIONCREATERETURN: questionCreateReturn;
let clearRes;
let USER;
let QUIZREQUEST;
let QUESTIONREQUEST;
let questionid: string;

beforeEach(() => {
  // clear everything
  clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const dataClear = JSON.parse(clearRes.body.toString());
  expect(dataClear).toEqual({});

  // make a new user
  USER = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    {
      json: {
        email: 'name@name.com',
        password: 'testpassword123',
        nameFirst: 'Hayden',
        nameLast: 'Smith'
      }
    }
  );

  USERDATA = JSON.parse(USER.body.toString());
});

describe('successful quiz deletion v1', () => {
  test('successful quiz deletion', () => {
  // make a new quiz
    QUIZREQUEST = request(
      'POST',
    `${url}:${port}/v1/admin/quiz`,
    {
      json: {
        token: USERDATA.token,
        name: 'What is one plus one',
        description: 'the answer is obviously 3'
      },
    }
    );
    expect(QUIZREQUEST.statusCode).toBe(OK);
    QUIZDATA = JSON.parse(QUIZREQUEST.body.toString());
    quizid = QUIZDATA.quizId.toString();

    // make a new question
    QUESTIONREQUEST = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${quizid}/question`,
    {
      headers: { token: USERDATA.token },
      json: {
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
              answer: 'dummy answer',
              correct: false
            }
          ]
        }
      }
    }
    );
    expect(QUESTIONREQUEST.statusCode).toBe(OK);
    const bodyObj1 = JSON.parse(QUESTIONREQUEST.body.toString());
    expect(bodyObj1).toStrictEqual({ questionId: expect.any(Number) });

    QUESTIONCREATERETURN = bodyObj1;

    questionid = QUESTIONCREATERETURN.questionId.toString();

    const res = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid}/question/${questionid}`,
            {
              qs: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v1', () => {
  test('quizId does not refer to valid quiz', () => {
    QUIZREQUEST = request(
      'POST',
    `${url}:${port}/v1/admin/quiz`,
    {
      json: {
        token: USERDATA.token,
        name: 'What is one plus one',
        description: 'the answer is obviously 3'
      },
    }
    );
    expect(QUIZREQUEST.statusCode).toBe(OK);
    QUIZDATA = JSON.parse(QUIZREQUEST.body.toString());
    quizid = QUIZDATA.quizId.toString();

    // make a new question
    QUESTIONREQUEST = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${quizid}/question`,
    {
      headers: { token: USERDATA.token },
      json: {
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
              answer: 'dummy answer',
              correct: false
            }
          ]
        }
      }
    }
    );
    expect(QUESTIONREQUEST.statusCode).toBe(OK);
    const bodyObj1 = JSON.parse(QUESTIONREQUEST.body.toString());
    expect(bodyObj1).toStrictEqual({ questionId: expect.any(Number) });

    QUESTIONCREATERETURN = bodyObj1;

    questionid = QUESTIONCREATERETURN.questionId.toString();

    let questionIdNumber = parseInt(questionid);
    questionIdNumber += 1;
    const questionid2 = questionIdNumber.toString();
    const res = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid + 2}/question/${questionid}`,
            {
              qs: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });

    // make a new user
    const USER2 = request(
      'POST',
        `${url}:${port}/v1/admin/auth/register`,
        {
          json: {
            email: 'name@nsaame.com',
            password: 'testpasdasdssword123',
            nameFirst: 'Hadsayden',
            nameLast: 'Smdsaith'
          }
        }
    );

    const USERDATA2 = JSON.parse(USER2.body.toString());

    const res2 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid}/question/${questionid}`,
            {
              qs: {
                token: USERDATA2.token,
              }
            }
    );
    const bodyObj2 = JSON.parse(res2.body.toString());
    expect(res2.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj2).toStrictEqual({ error: expect.any(String) });

    const res3 = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid}/question/${questionid2 + 5}`,
            {
              qs: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj3 = JSON.parse(res3.body.toString());
    expect(res3.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj3).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v1', () => {
  test('token is not a valid structure', () => {
    const res = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid}/question/${questionid}`,
            {
              qs: {
                token: 'a!)@#(*',
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v1', () => {
  test('provided token is valid structure but not for currently logged in user', () => {
    const res = request(
      'DELETE',
            `${url}:${port}/v1/admin/quiz/${quizid}/question/${questionid}`,
            {
              qs: {
                token: USERDATA.token + 1,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(LOGGED_IN_SESSION);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

// V2 Routes
describe('successful quiz deletion v2', () => {
  test('successful quiz deletion', () => {
  // make a new quiz
    QUIZREQUEST = request(
      'POST',
    `${url}:${port}/v1/admin/quiz`,
    {
      json: {
        token: USERDATA.token,
        name: 'What is one plus one',
        description: 'the answer is obviously 3'
      },
    }
    );
    expect(QUIZREQUEST.statusCode).toBe(OK);
    QUIZDATA = JSON.parse(QUIZREQUEST.body.toString());
    quizid = QUIZDATA.quizId.toString();

    // make a new question
    QUESTIONREQUEST = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${quizid}/question`,
    {
      headers: { token: USERDATA.token },
      json: {
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
              answer: 'dummy answer',
              correct: false
            }
          ]
        }
      }
    }
    );
    expect(QUESTIONREQUEST.statusCode).toBe(OK);
    const bodyObj1 = JSON.parse(QUESTIONREQUEST.body.toString());
    expect(bodyObj1).toStrictEqual({ questionId: expect.any(Number) });

    QUESTIONCREATERETURN = bodyObj1;

    questionid = QUESTIONCREATERETURN.questionId.toString();

    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid}/question/${questionid}`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toStrictEqual({});
  });
});

describe('error 400 v2', () => {
  test('quizId does not refer to valid quiz', () => {
    let questionIdNumber = parseInt(questionid);
    questionIdNumber += 1;
    const questionid2 = questionIdNumber.toString();
    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid + 5}/question/${questionid2}`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('quizId doesnt refer to a quiz this user owns', () => {
    // make a new quiz
    QUIZREQUEST = request(
      'POST',
    `${url}:${port}/v1/admin/quiz`,
    {
      json: {
        token: USERDATA.token,
        name: 'What is one plus one',
        description: 'the answer is obviously 3'
      },
    }
    );
    expect(QUIZREQUEST.statusCode).toBe(OK);
    QUIZDATA = JSON.parse(QUIZREQUEST.body.toString());
    quizid = QUIZDATA.quizId.toString();

    // make a new user
    const USER2 = request(
      'POST',
      `${url}:${port}/v1/admin/auth/register`,
      {
        json: {
          email: 'nadsadme@name.com',
          password: 'tesdsatpassword123',
          nameFirst: 'Hadsayden',
          nameLast: 'Smdsaith'
        }
      }
    );

    const USERDATA2 = JSON.parse(USER2.body.toString());
    // make a new question
    QUESTIONREQUEST = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${quizid}/question`,
    {
      headers: { token: USERDATA.token },
      json: {
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
              answer: 'dummy answer',
              correct: false
            }
          ]
        }
      }
    }
    );
    expect(QUESTIONREQUEST.statusCode).toBe(OK);
    const bodyObj1 = JSON.parse(QUESTIONREQUEST.body.toString());
    expect(bodyObj1).toStrictEqual({ questionId: expect.any(Number) });

    QUESTIONCREATERETURN = bodyObj1;

    questionid = QUESTIONCREATERETURN.questionId.toString();

    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid}/question/${questionid}`,
            {
              headers: {
                token: USERDATA2.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
  test('questionId does not refer to a valid question within this quiz', () => {
    // make a new quiz
    QUIZREQUEST = request(
      'POST',
    `${url}:${port}/v1/admin/quiz`,
    {
      json: {
        token: USERDATA.token,
        name: 'What is one plus one',
        description: 'the answer is obviously 3'
      },
    }
    );
    expect(QUIZREQUEST.statusCode).toBe(OK);
    QUIZDATA = JSON.parse(QUIZREQUEST.body.toString());
    quizid = QUIZDATA.quizId.toString();

    // make a new question
    QUESTIONREQUEST = request(
      'POST',
    `${url}:${port}/v2/admin/quiz/${quizid}/question`,
    {
      headers: { token: USERDATA.token },
      json: {
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
              answer: 'dummy answer',
              correct: false
            }
          ]
        }
      }
    }
    );
    expect(QUESTIONREQUEST.statusCode).toBe(OK);
    const bodyObj1 = JSON.parse(QUESTIONREQUEST.body.toString());
    expect(bodyObj1).toStrictEqual({ questionId: expect.any(Number) });

    QUESTIONCREATERETURN = bodyObj1;

    questionid = QUESTIONCREATERETURN.questionId.toString();

    let questionIdNumber = parseInt(questionid);
    questionIdNumber += 1;
    const questionid2 = questionIdNumber.toString();
    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid}/question/${questionid2}`,
            {
              headers: {
                token: USERDATA.token,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 401 v2', () => {
  test('token is not a valid structure', () => {
    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid}/question/${questionid}`,
            {
              headers: {
                token: 'a!)@#(*',
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(INVALID_TOKEN);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});

describe('error 403 v2', () => {
  test('provided token is valid structure but not for currently logged in user', () => {
    const res = request(
      'DELETE',
            `${url}:${port}/v2/admin/quiz/${quizid}/question/${questionid}`,
            {
              headers: {
                token: USERDATA.token + 1,
              }
            }
    );
    const bodyObj = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(LOGGED_IN_SESSION);
    expect(bodyObj).toStrictEqual({ error: expect.any(String) });
  });
});
