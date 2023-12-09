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
  dataQuizCreate = JSON.parse(resQuizCreate.body.toString());
  expect(resQuizCreate.statusCode).toBe(200);
  expect(dataQuizCreate).toStrictEqual({ quizId: expect.any(Number) });
});

// V2 Routes
test('Error: Token is not a valid structure', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: ')*(@!#92' },
      json: { description: 'validDescriptionUpdated' }
    }
  );
  expect(resDesUpdate.statusCode).toBe(401);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('Error: Provided token is valid structure, but is not for a currently logged in session', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: dataRegister.token + 1 },
      json: { description: 'validDescriptionUpdated' }
    }
  );
  expect(resDesUpdate.statusCode).toBe(403);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('Error: Quizid is not valid', () => {
  const quizIdString: string = (dataQuizCreate.quizId + 1).toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: dataRegister.token },
      json: { description: 'validDescriptionUpdated' }
    }
  );
  expect(resDesUpdate.statusCode).toBe(400);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('Error: This user does not own this quiz', () => {
  const res2 = request(
    'POST',
    `${url}:${port}/v1/admin/auth/register`,
    { json: { email: 'name.name1@test.com', password: 'Passtest123', nameFirst: 'Correct', nameLast: 'Correct' } }
  );
  expect(res2.statusCode).toBe(200);
  const data2 = JSON.parse(res2.body.toString());
  expect(data2).toStrictEqual({ token: expect.any(String) });

  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: data2.token },
      json: { description: 'validDescriptionUpdated' }
    }
  );
  expect(resDesUpdate.statusCode).toBe(400);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('Error: The updated description is more than 100 characters in length', () => {
  const newDescription: string = 'Hello'.repeat(21);
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: dataRegister.token },
      json: { description: newDescription }
    }
  );
  expect(resDesUpdate.statusCode).toBe(400);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('Success, updated description for the specified quiz', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
    `${url}:${port}/v2/admin/quiz/${quizIdString}/description`,
    {
      headers: { token: dataRegister.token },
      json: { description: 'validDescriptionUpdated' }
    }
  );
  expect(resDesUpdate.statusCode).toBe(200);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual({});
});

// V1 Routes
test('V1 Error: Token is not a valid structure', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
`${url}:${port}/v1/admin/quiz/${quizIdString}/description`,
{ json: { token: ')*(@!#92', description: 'validDescriptionUpdated' } }
  );
  expect(resDesUpdate.statusCode).toBe(401);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('V1 Error: Provided token is valid structure, but is not for a currently logged in session', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
`${url}:${port}/v1/admin/quiz/${quizIdString}/description`,
{ json: { token: dataRegister.token + 1, description: 'validDescriptionUpdated' } }
  );
  expect(resDesUpdate.statusCode).toBe(403);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('V1 Error: Quizid is not valid', () => {
  const quizIdString: string = (dataQuizCreate.quizId + 1).toString();
  const resDesUpdate = request(
    'PUT',
`${url}:${port}/v1/admin/quiz/${quizIdString}/description`,
{ json: { token: dataRegister.token, description: 'validDescriptionUpdated' } }
  );
  expect(resDesUpdate.statusCode).toBe(400);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual(ERROR);
});

test('V1 Success, updated description for the specified quiz', () => {
  const quizIdString: string = dataQuizCreate.quizId.toString();
  const resDesUpdate = request(
    'PUT',
`${url}:${port}/v1/admin/quiz/${quizIdString}/description`,
{ json: { token: dataRegister.token, description: 'validDescriptionUpdated' } }
  );
  expect(resDesUpdate.statusCode).toBe(200);
  const dataDesUpdate = JSON.parse(resDesUpdate.body.toString());
  expect(dataDesUpdate).toStrictEqual({});
});
