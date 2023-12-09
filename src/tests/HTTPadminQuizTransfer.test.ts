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

let bodyObj: DataQuizCreate;
let data1: DataRegister; // data1.token for token of 1st user
let data99: DataRegister; // data99.token for token of 2nd user

// beforeEach, clear, register a user and create a valid quiz
// bodyObj.quizId should give the quizId of the created quiz
// data1.token should give the token of the registered user
beforeEach(() => {
  const clearRes = request(
    'DELETE',
    `${url}:${port}/v1/clear`,
    { qs: {} }
  );
  expect(clearRes.statusCode).toBe(200);
  const data = JSON.parse(clearRes.body.toString());
  expect(data).toEqual({});

  const res1 = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res1.statusCode).toBe(200);
  data1 = JSON.parse(res1.body.toString());
  expect(data1).toStrictEqual({ token: expect.any(String) });

  const res3 = request(
    'POST',
      `${url}:${port}/v1/admin/auth/register`,
      { json: { email: 'name.name2@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res3.statusCode).toBe(200);
  data99 = JSON.parse(res3.body.toString());
  expect(data99).toStrictEqual({ token: expect.any(String) });

  const res2 = request(
    'POST',
          `${url}:${port}/v2/admin/quiz`,
          {
            headers: { token: data1.token },
            json: {
              name: 'What is one plus one',
              description: 'the answer is obviously 3'
            },
          }
  );
  bodyObj = JSON.parse(res2.body.toString());
  expect(res2.statusCode).toBe(200);
  expect(bodyObj).toStrictEqual({
    quizId: expect.any(Number),
  });
});

describe('Errors V2 and V1 Tests', () => {
  test('Errors V2 and V1 (at end)', () => {
    // TokenID invalid structure
    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: 'dsa*@' }, json: { userEmail: 'name.name2@test.com' } }
    );
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual(ERROR);
    // TokenID not correct for the user
    const res2 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: data1.token + 1 }, json: { userEmail: 'name.name2@test.com' } }
    );
    expect(res2.statusCode).toBe(403);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual(ERROR);
    // QuizID does not refer to a valid quiz
    const res3 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${(bodyObj.quizId + 1).toString()}/transfer`,
      { headers: { token: data1.token }, json: { userEmail: 'name.name2@test.com' } }
    );
    expect(res3.statusCode).toBe(400);
    const data3 = JSON.parse(res3.body.toString());
    expect(data3).toStrictEqual(ERROR);
    // userEmail is not a real email
    const res4 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: data1.token }, json: { userEmail: 'name.name3@test.com' } }
    );
    expect(res4.statusCode).toBe(400);
    const data4 = JSON.parse(res4.body.toString());
    expect(data4).toStrictEqual(ERROR);
    // userEmail is the currently logged in user
    const res5 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: data1.token }, json: { userEmail: 'name.name1@test.com' } }
    );
    expect(res5.statusCode).toBe(400);
    const data5 = JSON.parse(res5.body.toString());
    expect(data5).toStrictEqual(ERROR);
    // Quiz ID refers to a quiz that has a name that is already used by the target user
    // Basically, the second guy has a quiz that is the same name
    // Create the same quiz, using the second guy
    // Transfer the quiz to the second guy
    const res6 = request(
      'POST',
            `${url}:${port}/v2/admin/quiz`,
            {
              headers: { token: data99.token },
              json: {
                name: 'What is one plus one',
                description: 'the answer is obviously 3'
              },
            }
    );
    expect(res6.statusCode).toBe(200);
    const data6 = JSON.parse(res6.body.toString()); // data6.quizId
    expect(data6).toStrictEqual({ quizId: expect.any(Number) });
    const res7 = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: data1.token }, json: { userEmail: 'name.name2@test.com' } }
    );
    expect(res7.statusCode).toBe(400);
    const data7 = JSON.parse(res7.body.toString());
    expect(data7).toStrictEqual(ERROR);

    // Quiz ID does not refer to a quiz that this user owns

    //
    //
    // V1 Tests
    // 400, 401, 403
    //
    //
    // 401 TokenID invalid structure
    const res10 = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { json: { token: 'dsa*@', userEmail: 'name.name2@test.com' } }
    );
    expect(res10.statusCode).toBe(401);
    const data10 = JSON.parse(res10.body.toString());
    expect(data10).toStrictEqual(ERROR);
    // 403 TokenID not correct for the user
    const res11 = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { json: { token: data1.token + 1, userEmail: 'name.name2@test.com' } }
    );
    expect(res11.statusCode).toBe(403);
    const data11 = JSON.parse(res11.body.toString());
    expect(data11).toStrictEqual(ERROR);
    // 400 User email aint a real email
    const res12 = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { json: { token: data1.token, userEmail: 'name.name5@test.com' } }
    );
    expect(res12.statusCode).toBe(400);
    const data12 = JSON.parse(res12.body.toString());
    expect(data12).toStrictEqual(ERROR);
  });
});

describe('Success V2 and V1 Tests', () => {
  test('Sucess V2 and V1', () => {
    // Transfer the owner of the 1 Quiz to the other person
    // Success V2
    const res = request(
      'POST',
      `${url}:${port}/v2/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { headers: { token: data1.token }, json: { userEmail: 'name.name2@test.com' } }
    );
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body.toString());
    expect(data).toStrictEqual({});
    // Transfer it back, using V1 route
    // Success V1
    const res2 = request(
      'POST',
      `${url}:${port}/v1/admin/quiz/${bodyObj.quizId.toString()}/transfer`,
      { json: { token: data99.token, userEmail: 'name.name1@test.com' } }
    );
    expect(res2.statusCode).toBe(200);
    const data2 = JSON.parse(res2.body.toString());
    expect(data2).toStrictEqual({});
  });
});
