// Functions starting with adminQuiz
import { getData, setData, Quiz, Data, QuizQuestion, Answer, QuestionBody, Colour, User, quizStates, QuizState, Session, Player, Message, SessionQuizQuestion, Action, Actions } from './dataStore';
import { getUserIdByToken, getTotalQuestionDuration, validAnswerLengths, answersDifferent, correctAnswerExists, genUniqueColour, findQuiz, findQuestion, findDataIdCounter, moreThanOrEqualTo10ENDState, doesPlayerExist, getQuestionDuration } from './other';
import FileType from 'file-type';
import request from 'sync-request';
import fs from 'fs';
import HTTPError from 'http-errors';
import { port, url } from './config.json'

// Interfaces
export interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: QuizQuestion[],
  duration: number
}

export interface ErrorResponse {
    error: string
}

export interface ReturnedQuizQuestionV2 {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: Answer[];
}

export interface ReturnedQuizInfoV2 {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: ReturnedQuizQuestionV2[];
  duration: number;
  thumbnailUrl: string;
}

export interface ReturnedQuizQuestionV1 {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
}

export interface ReturnedQuizInfoV1 {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: ReturnedQuizQuestionV1[];
  duration: number;
}

export interface ReturnedAnswer {
  answerId: number;
  answer: string;
  colour: Colour;
  correct: boolean;
}

export interface ReturnedQuestion {
  questionId: number;
  question: string;
  duration: number;
  thumbnailUrl: string;
  points: number;
  answers: ReturnedAnswer[];
}

export interface ReturnedSessionMetadata {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: ReturnedQuestion[];
  duration: number;
  thumbnailUrl: string;
}

export interface ReturnedSessionStatus {
  state: QuizState,                     
  atQuestion: number,
  players: string[],
  metadata: ReturnedSessionMetadata,
}

export interface QuestionId {
  questionId?: number,
  error?: string,
}

interface AnswerInformation {
  answerId: number;
  playersCorrect?: string[];
}

interface PlayerRanking {
  playerName: string;
  points: number;
}

interface QuestionResults {
  answerInformation: AnswerInformation[];
  averageAnswerTime?: number;
  percentCorrect: number;
  playerRanking?: PlayerRanking[];
  questionId: number;
}

interface sessionHistory {
  activeSessions: number[];
  inactiveSessions: number[];
}

export let questionIdIncrement = 0;
// Resets the questionIdIncrement when clear is called
export function resetQuestionIdIncrement(): void {
  questionIdIncrement = 0;
}

function generateRandom7DigitNumber() {
  return Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
}

export interface playerReturn {
  playerId: number,
}

export let playerIdIncrement = 0;
// Resets the questionIdIncrement when clear is called
export function resetPlayerIdIncrement(): void {
  playerIdIncrement = 0;
}


/** Update the description of the relevant quiz.
 *
 * This function takes in 3 variables:
 * 1. authUserId
 * 2. quizId
 * 3. description
 *
 * Assuming matching authUserId and quizId, will change the description of the relevant quiz
 * @param {string} token The token assosciated with the user's registered account
 * @param {number} quizId The quizId where the description will be updated
 * @param {string} description The new description of the quiz
 * @param {boolean} throwHTTPError Flag associated with v1 or v2 route
 * @return {{}} Returns an empty object
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string, throwHTTPError: boolean): Record<string, never> | ErrorResponse {
  const data: Data = getData();
  const quizFind: Quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure.' },
    { condition: !userId, errorCode: 403, message: 'Token is valid structure, but not for currently logged in session.' },
    { condition: !quizFind, errorCode: 400, message: 'There is no quiz with this quizID.' },
    { condition: !(quizFind?.creatorId === userId) && quizFind, errorCode: 400, message: 'QuizId does not refer to a quiz that this user owns.' },
    { condition: description.length > 100, errorCode: 400, message: 'Description is more than 100 characters.' }
  ];
  
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }
  quizFind.description = description;
  setData(data);
  return {};
}

/** Update the name of the relevant quiz.
 *
 * This function takes in 4 variables:
 * 1. token
 * 2. quizId
 * 3. name
 * 4. throwHTTPError
 *
 * If token and quizId is found, update its name
 * @param {string} token The token associated with a users login
 * @param {number} quizId The quizId where the name will be updated
 * @param {string} name The new name of the quiz
 * @param {boolean} throwHTTPError determines if this function should throw or return errors
 * @return {{}} Returns an empty object
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string, throwHTTPError: boolean): Record<string, never> | ErrorResponse {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quiz && !(quiz.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' },
    { condition: !/^[a-zA-Z0-9 ]+$/.test(name), errorCode: 400, message: 'Name contains any characters that are not alphanumeric or are spaces' },
    { condition: !/\S/.test(name), errorCode: 400, message: 'Name contains only spaces' },
    { condition: name.length < 3 || name.length > 30, errorCode: 400, message: 'Name is either less than 3 characters long or more than 30 characters long.' },
  ];

  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }
 
  // Checking for duplicate name
  const otherQuizWithSameName = data.quizzes.find(q => q.name === name && q.quizId !== quizId && q.creatorId === userId);
  if (otherQuizWithSameName) {
    if (throwHTTPError) {
      throw HTTPError(400, 'Name is already used by the current logged in user for another quiz.')
    } else {
    return ({ error: 'Name is already used by the current logged in user for another quiz.' });
    }
  }

  // Update quiz name and last edited timestamp
  quiz.name = name;
  quiz.timeLastEdited = (Date.now() / 1000);
  setData(data);
  return {};
}

/** Given a particular quiz, permanently remove the quiz.
 *
 * This function takes in 2 variables:
 * 1. token
 * 2. quizId
 * 3. throwHTTPError 
 *
 * After passing in this information, the quiz with quizId will be removed from the user with authUserId
 * @param {string} token The token assosciated with the user's registered account
 * @param {number} quizId The quizId to be removed
 * @param {boolean} throwHTTPError Function flag for v1 or v2 
 * @return {{}} Returns an empty object
 */
export function adminQuizRemove(token: string, quizId: number, throwHTTPError: boolean): Record<string, never> | ErrorResponse {
  const data: Data = getData();
  const quizFind: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const sessionFind: Session[] = data.sessions.filter(s => s.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure.' },
    { condition: !userId, errorCode: 403, message: 'Token is valid structure, but not for currently logged in session.' },
    { condition: !quizFind, errorCode: 400, message: 'There is no quiz with this quizID.' },
    { condition: !(quizFind?.creatorId === userId) && quizFind, errorCode: 400, message: 'QuizId does not refer to a quiz that this user owns.' },
    { condition: sessionFind.find(session => session.state !== QuizState.END), errorCode: 400, message: 'll sessions for this quiz must be in END state.' }
  ];
  
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }
  let indexCounter = 0;
  for (const quiz of data.quizzes) {
    if (quiz.quizId === quizId) {
      const quizToRemove: Quiz = data.quizzes[indexCounter];
      data.quizzes.splice(indexCounter, 1);
      data.trash.push(quizToRemove);
      setData(data);
      break;
    }
    indexCounter++;
  }
  return {};
}

/** Get all of the relevant information about the current quiz.
 *
 * This function takes in 2 variables:
 * 1. token
 * 2. quizId
 *
 * This function returns additional Quiz Information admin side containing additional details such as timeCreated and timeLastEdited
 * @param {number} token The token assosciated with the user's registered account
 * @param {number} quizId The quizId to get relevant information about
 * @returns {
*  quizId: number,
*  name: string,
*  timeCreated: number,
*  timeLastEdited: number,
*  description: string,
*  numQuestions: number,
*  questions: array([
*    {
*      questionId: number,
*      question: string,
*      thumbnailUrl: string,
*      duration: number,
*      points: number,
*      answers: array([
*        {
*          answerId: number,
*          answer: string,
*          colour: string,
*          correct: boolean,
*        }
*      ]),
*    }
*  ]),
*  duration: number,
*  thumbnailUrl: string,
* } 
* An object containing detailed information about the quiz
*/
export function adminQuizInfo(token: string, quizId: number, throwHTTPError: boolean): ReturnedQuizInfoV1 | ReturnedQuizInfoV2 | ErrorResponse {
  const data: Data = getData();
  const quizFind: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quizFind, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quizFind && !(quizFind.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' }
  ];
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  const totalDuration: number = getTotalQuestionDuration(quizFind);

  if (throwHTTPError) {
    return {
      quizId: quizFind.quizId,
      name: quizFind.name,
      timeCreated: quizFind.timeCreated,
      timeLastEdited: quizFind.timeLastEdited,
      description: quizFind.description,
      numQuestions: quizFind.questions.length,
      questions: quizFind.questions.map(question => ({
        questionId: question.questionId,
        question: question.questionBody.question,
        duration: question.questionBody.duration,
        thumbnailUrl: question.questionBody.thumbnailUrl,
        points: question.questionBody.points,
        answers: question.questionBody.answers.map(answer => ({
          answerId: answer.answerId,
          answer: answer.answer,
          colour: answer.colour,
          correct: answer.correct
        }))
      })),
      duration: totalDuration,
      thumbnailUrl: quizFind.thumbnailUrl
    };
  } else {
    return {
      quizId: quizFind.quizId,
      name: quizFind.name,
      timeCreated: quizFind.timeCreated,
      timeLastEdited: quizFind.timeLastEdited,
      description: quizFind.description,
      numQuestions: quizFind.questions.length,
      questions: quizFind.questions.map(question => ({
        questionId: question.questionId,
        question: question.questionBody.question,
        duration: question.questionBody.duration,
        points: question.questionBody.points,
        answers: question.questionBody.answers.map(answer => ({
          answerId: answer.answerId,
          answer: answer.answer,
          colour: answer.colour,
          correct: answer.correct
        }))
      })),
      duration: totalDuration,
    };
  }
}

/** Provide a list of all quizzes that are owned by the currently logged in user.
 * The function returns an object containing an array of a singular object containing quizID and name
 *
 * @param {string} token The token associated with a users login
 * @param {boolean} throwHTTPError The flag associated with v1 or v2 route 
 * @returns {{
 *   quizzes: {
 *     quizId: number,
 *     name: string,
 *   }[]
 * }} Object containing an array, where each array element is an object containing a quizId and name
 */
export function adminQuizList(token: string, throwHTTPError: boolean): {quizzes: {quizId: number, name: string}[]} | ErrorResponse {
  const data: Data = getData();
  const userId: number | null = getUserIdByToken(token);
  // Token is not a valid structure
  if (!/^-?\d+$/.test(token)) {
    if (throwHTTPError) {
      throw HTTPError(401, 'Token is not a valid structure');
    } else {
      return ({ error: 'Token is not a valid structure' });
    }
  }
  // Provided token is valid structure, but is not for a currently logged in session
  if (!userId) {
    if (throwHTTPError) {
      throw HTTPError(403, 'Provided token is valid structure, but is not for a currently logged in session');
    } else {
      return ({ error: 'Provided token is valid structure, but is not for a currently logged in session' });
    }
  }
  const quizzes: {quizId: number, name: string}[] = [];
  // Loop through each quiz where matches the user, and returns the quizzes
  for (const quiz of data.quizzes) {
    if (quiz.creatorId === userId) {
      quizzes.push({
        quizId: quiz.quizId,
        name: quiz.name
      });
    }
  }
  return {
    quizzes: quizzes
  };
}

/** Given basic details about a new quiz, create one for the logged in user.
 *
 * This function takes in 3 variables:
 * 1. authUserId
 * 2. name
 * 3. description
 *
 *  @param {number} token The userId assosciated with the user's registered account
 *  @param {string} name The name of the new quiz
 *  @param {string} description The description of the new quiz
 *  @returns {{quizId: number}} An object containing the quizId of the newly created quiz
 */
export function adminQuizCreate(token: string, name: string, description: string, throwHTTPError: boolean): {error?: string; quizId?: number} {
  const data: Data = getData();
  const userId = getUserIdByToken(token);

  const errors = [
    { condition: name.length < 3, errorCode: 400, message: 'invalid quiz name - too short' },
    { condition: name.length > 30, errorCode: 400, message: 'invalid quiz name - too long' },
    { condition: !/^[a-zA-Z0-9 ]+$/.test(name), errorCode: 400, message: 'name is invalid format' },
    { condition: description.length > 100, errorCode: 400, message: 'description length too long' },
    { condition: data.quizzes.find(quizzes => quizzes.name === name && quizzes.creatorId === userId), errorCode: 400, message: 
    'this user already has a quiz by that name' }
  ];

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'Token is not a valid structure.');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }

  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  if (!userId) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token is valid structure but not for currently logged in session');
    } else {
    return ({ error: 'Token is valid structure, but not for currently logged in session.' });
    }
  }

  let dataIdCounter: number = findDataIdCounter();

  data.quizzes.push({
    quizId: dataIdCounter,
    name: name,
    description: description,
    timeCreated: (Date.now() / 1000),
    timeLastEdited: (Date.now() / 1000),
    creatorId: userId,
    thumbnailUrl: '',
    questions: [],
  });

  setData(data);

  return {
    quizId: dataIdCounter,
  };
}

/** Create a new question for a particular quiz. 
 *
 * This function takes in 3 variables:
 * 1. quizId
 * 2. token
 * 3. questionBody
 *
 *  @param {number} quizId The quizId to add the question to
 *  @param {string} token A token that should correctly match logged in user
 *  @param {QuestionBody} questionBody The information of the new quiz
 *  @returns {ErrorResponse | { questionId: number }} An error, or an object containing questionId of the new question created
 *
 */
export async function adminQuizCreateQuestion(quizId: number, token: string, questionBody: QuestionBody, throwHTTPError: boolean ): Promise<ErrorResponse | { questionId: number }> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);
  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quiz && !(quiz.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' },
    { condition: questionBody.question.length < 5 || questionBody.question.length > 50, errorCode: 400, message: 'Question string is less than 5 characters in length or greater than 50 characters in length.' },
    { condition: questionBody.answers.length < 2 || questionBody.answers.length > 6, errorCode: 400, message: 'The question has more than 6 answers or less than 2 answers.' },
    { condition: questionBody.duration < 0, errorCode: 400, message: 'The question duration is not a positive number.' },
    { condition: quiz && getTotalQuestionDuration(quiz) + questionBody.duration > 180, errorCode: 400, message: 'The sum of the question durations in the quiz exceeds 3 minutes.' },
    { condition: questionBody.points < 1 || questionBody.points > 10, errorCode: 400, message: 'The points awarded for the question are less than 1 or greater than 10' },
    { condition: !validAnswerLengths(questionBody), errorCode: 400, message: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long.' },
    { condition: !answersDifferent(questionBody), errorCode: 400, message: 'Any answer strings are duplicates of one another (within the same question)' },
    { condition: !correctAnswerExists(questionBody), errorCode: 400, message: 'There are no correct answers' },
  ];
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  if (throwHTTPError && !questionBody.thumbnailUrl.startsWith('http://localhost')) {
    // The thumbnailUrl is an empty string
    if (questionBody.thumbnailUrl.trim() === '') {
     throw HTTPError(400, "The thumbnailUrl is an empty string")
    }
    let res;
    try {
      res = request('GET', questionBody.thumbnailUrl);
    } catch (error) {
      throw HTTPError(400, "The thumbnailUrl does not return to a valid file");
    }
  
    if (res.statusCode !== 200) {
      throw HTTPError(400, "The thumbnailUrl does not return to a valid file")
    }
    // The response body data includes bytes that make up an image, sync-request getBody gets the information as a Buffer
    const type = await FileType.fromBuffer(res.getBody() as Buffer);
    // The thumbnailUrl, when fetched, is not a JPG or PNG file type
    if (!type || (type.ext !== 'jpg' && type.ext !== 'png')) {
      throw HTTPError(400, "The thumbnailUrl, when fetched, is not a JPG or PNG file type")
    }
    // If it gets to this point, it means that the file is valid and is an image...
    // Download it
    const filename = `${Date.now()}_questionthumbnail.${type.ext}`;
    const pathLocal = `src/thumbnails/${filename}`;
    fs.writeFileSync(pathLocal, res.getBody(), { flag: 'w'});
    questionBody.thumbnailUrl = `${url}:${port}/thumbnails/${filename}`;
  }

  // A for loop that will go through every single answer and assign it
  // 1. An answerId for each answer
  // 2. A unique colour
  const usedColours: Colour[] = [];
  for (let i = 0; i < questionBody.answers.length; i++) {
    questionBody.answers[i].answerId = i + 1;
    const uniqueColour: Colour = genUniqueColour(usedColours);
    questionBody.answers[i].colour = uniqueColour;
    usedColours.push(uniqueColour);
  }

  // Creating the new data and setting it into dataStore
  questionIdIncrement += 1;
  const newQuestion: QuizQuestion = {
    questionId: questionIdIncrement,
    questionBody: questionBody
  };
  quiz.questions.push(newQuestion);
  quiz.timeLastEdited = (Date.now() / 1000);
  setData(data);
  return {
    questionId: questionIdIncrement,
  };
}

/** Update the relevant details of a particular question within a quiz
 *
 * This function takes in 5 variables:
 * 1. quizId
 * 2. questionId
 * 3. token
 * 4. questionBody
 * 5. throwHTTPError
 *
 *  @param {number} quizId The quizId where the question needs updating
 *  @param {number} questionId The questionId of the question that needs updating
 *  @param {string} token A token that should correctly match logged in user
 *  @param {QuestionBody} questionBody The updated information to update
 *  @param {boolean} throwHTTPError decides whether this is a v1/v2 function and needs to throw errors
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 *
 */
export async function adminUpdateQuizQuestion(quizId: number, questionId: number, token: string, questionBody: QuestionBody, throwHTTPError: boolean): Promise<ErrorResponse | Record<string, never>> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: /^-?\d*\.?\d+$/.test(token) === false, errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quiz && !(quiz.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' }
  ];
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  const questionToUpdate: QuizQuestion | undefined = quiz.questions.find(question => question.questionId === questionId);

  const errors1 = [
    { condition: !questionToUpdate, errorCode: 400, message: 'Question Id does not refer to a valid question within this quiz.' },
    { condition: questionBody.question.length < 5 || questionBody.question.length > 50, errorCode: 400, message: 'Question string is less than 5 characters in length or greater than 50 characters in length' },
    { condition: questionBody.answers.length < 2 || questionBody.answers.length > 6, errorCode: 400, message: 'The question has more than 6 answers or less than 2 answers.' },
    { condition: questionBody.duration < 0, errorCode: 400, message: 'The question duration is not a positive number.' }
  ];
  for (const error of errors1) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  const totalQuestionDuration: number = getTotalQuestionDuration(quiz);
  const proposedDuration: number = totalQuestionDuration - questionToUpdate.questionBody.duration + questionBody.duration;

  const errors2 = [
    { condition: proposedDuration > 180, errorCode: 400, message: 'If this question were to be updated, the sum of the question durations in the quiz exceeds 3 minutes.' },
    { condition: questionBody.points < 1 || questionBody.points > 10, errorCode: 400, message: 'The points awarded for the question are less than 1 or greater than 10.' },
    { condition: !validAnswerLengths(questionBody), errorCode: 400, message: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long' },
    { condition: !answersDifferent(questionBody), errorCode: 400, message: 'Any answer strings are duplicates of one another (within the same question)' },
    { condition: !correctAnswerExists(questionBody), errorCode: 400, message: 'There are no correct answers' },
  ];
  for (const error of errors2) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  if (throwHTTPError) {
    // The thumbnailUrl is an empty string
    if (questionBody.thumbnailUrl.trim() === '') {
     throw HTTPError(400, "The thumbnailUrl is an empty string")
    }
    let res;
    try {
      res = request('GET', questionBody.thumbnailUrl);
    } catch (error) {
      throw HTTPError(400, "The thumbnailUrl does not return to a valid file");
    }
  
    if (res.statusCode !== 200) {
      throw HTTPError(400, "The thumbnailUrl does not return to a valid file")
    }
    // The response body data includes bytes that make up an image, sync-request getBody gets the information as a Buffer
    const type = await FileType.fromBuffer(res.getBody() as Buffer);
    // The thumbnailUrl, when fetched, is not a JPG or PNG file type
    if (!type || (type.ext !== 'jpg' && type.ext !== 'png')) {
      throw HTTPError(400, "The thumbnailUrl, when fetched, is not a JPG or PNG file type")
    }
    // If it gets to this point, it means that the file is valid and is an image...
    // Download it
    const filename = `${Date.now()}_questionthumbnail.${type.ext}`;
    const pathLocal = `src/thumbnails/${filename}`;
    fs.writeFileSync(pathLocal, res.getBody(), { flag: 'w'});
    questionBody.thumbnailUrl = `${url}:${port}/thumbnails/${filename}`;
  }

  // A for loop that will go through every single answer and randomize the colours of questions again
  const usedColours: Colour[] = [];
  for (let i = 0; i < questionBody.answers.length; i++) {
    const uniqueColour: Colour = genUniqueColour(usedColours);
    questionBody.answers[i].colour = uniqueColour;
    usedColours.push(uniqueColour);
  }

  // Setting the new data in questionBody passed in to replace the existing
  // Update the timeLastEdited
  questionToUpdate.questionBody = questionBody;
  quiz.timeLastEdited = (Date.now() / 1000);
  setData(data);
  return {};
}

/** Move a question from one particular position in the quiz to another
 *
 * This function takes in 5 variables:
 * 1. quizId
 * 2. questionId
 * 3. token
 * 4. questionBody
 * 5. throwHTTPError
 *
 *  @param {number} quizId The quizId where the question needs moving
 *  @param {number} questionId The questionId of the question that needs moving
 *  @param {string} token A token that should correctly match logged in user
 *  @param {number} newPosition The new location position of the question to move to
 *  @param {boolean} throwHTTPError determines if this function should throw or return errors
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 *
 */
export function adminQuizMoveQuestion(quizId: number, questionId: number, token: string, newPosition: number, throwHTTPError: boolean): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quiz && !(quiz.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' }
  ];

  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  const questionToUpdate: QuizQuestion | undefined = quiz.questions.find(question => question.questionId === questionId);

  // Question Id does not refer to a valid question within this quiz
  if (!questionToUpdate) {
    if (throwHTTPError) {
      throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz.');
    } else {
      return ({ error: 'Question Id does not refer to a valid question within this quiz.' });
    }
  }
  // NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions
  const questionLength: number = quiz.questions.length;
  if (newPosition < 0 || newPosition > (questionLength - 1)) {
    if (throwHTTPError) {
      throw HTTPError(400, 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions..');
    } else {
    return ({ error: 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions.' });
    }
  }

  // Find the current position of the question
  const currentQuestionIndex: number = quiz.questions.findIndex(question => question.questionId === questionId);
  // NewPosition is the position of the current question
  if (newPosition === currentQuestionIndex) {
    if (throwHTTPError) {
      throw HTTPError(400, 'NewPosition is the position of the current question.');
    } else {
    return ({ error: 'NewPosition is the position of the current question.' });
    }
  }

  // Remove the question from its current position
  quiz.questions.splice(currentQuestionIndex, 1);
  // Insert the question at the new position
  quiz.questions.splice(newPosition, 0, questionToUpdate);
  quiz.timeLastEdited = (Date.now() / 1000);
  setData(data);
  return {};
}

/** Delete a specified question in a specified quiz
 * 
 * This function takes in 3 variables:
 * 1. quizId
 * 2. questionId
 * 3. token
 *  @param {number} quizid The quizId to identify the quiz  
 *  @param {number} questionid The questionId to identify the question to be deleted
 *  @param {string} token The token to evaluate if it is a currently logged in session
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 */
export function adminQuestionDelete(quizid: number, questionid: number, token: string, throwHTTPError: boolean): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const quizFind = data.quizzes.find(quiz => quiz.quizId === quizid);

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'token isnt a valid structure');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }

  const givenUserId: number | null = getUserIdByToken(token);

  if (givenUserId === null) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token isnt logged in');
    } else {
    return ({ error: 'provided token is valid structure, but not for a currently logged in session' });
    }
  }


  if (data.quizzes.find(quiz => quiz.quizId === quizid) === undefined) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'quizid doesnt refer to valid quiz');
    } else {
    return ({ error: 'quizid does not refer to a valid quiz' });
    }
  }

  if (findQuiz(token, quizid) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'quiz isnt owned byt his user');
    } else {
    return ({ error: 'quizid does not refer to a quiz that this user owns' });
    }
  }

  if (findQuestion(quizid, questionid) === -1) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'questionid isnt valid question in this quiz');
    } else {
    return ({ error: 'questionid does not refer to a valid question in this quiz' });
    }
  }

  let questionCounter = findQuestion(quizid, questionid);

  data.quizzes[quizid - 1].questions.splice(questionCounter, 1);
  return {};
}

/** Duplicate a specified question in a specified quiz
 * 
 * This function takes in 3 variables:
 * 1. token
 * 2. questionId
 * 3. quizid
 *  @param {number} quizid The quizId to identify the quiz  
 *  @param {number} questionid The questionId to identify the question to be deleted
 *  @param {string} token The token to evaluate if it is a currently logged in session
 *  @returns {ErrorResponse | { newQuestionId: number }} An error or an object with newQuestionId
 */
export async function adminQuizQuestionDuplicate(token: string, questionId: number, quizId: number,  throwHTTPError: boolean): Promise<ErrorResponse | { newQuestionId: number }> {
  const data: Data = getData();
  const quiz: Quiz | undefined = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);
  let questionToUpdate: QuizQuestion | undefined;
  
  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure.' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session.' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: !(quiz?.creatorId === userId) && quiz, errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' },
  ];
  
  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }
  
  questionToUpdate = quiz.questions.find(question => question.questionId === questionId);
  if (!questionToUpdate) {
    if (throwHTTPError) {
      throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz.');
    } else {
      return { error: 'Question Id does not refer to a valid question within this quiz.' };
    }
  }

  const currentQuestionIndex: number = quiz.questions.findIndex(question => question.questionId === questionId);
  const questionBod: QuestionBody = questionToUpdate.questionBody;
  let updatedQuestionId: QuestionId;
  if (throwHTTPError) {
    updatedQuestionId = await adminQuizCreateQuestion(quizId, token, questionBod, true);  
  } else {
    updatedQuestionId = await adminQuizCreateQuestion(quizId, token, questionBod, false);
  }
  const newQuestId: number = updatedQuestionId.questionId;
  questionToUpdate.questionId = updatedQuestionId.questionId;
  quiz.questions.splice(currentQuestionIndex + 1, 0, questionToUpdate);
  quiz.timeLastEdited = (Date.now() / 1000);
  setData(data);
  return { newQuestionId: newQuestId };
}

/** Restore a particular quiz from the trash back to an active quiz
 *
 * This function takes in a token and a quizid from the trash to put back into the active quizzes
 *
 *  @param {string} token A token associated with a users login
 *  @param {number} quizid A quizid in the trash to restore
 *  @returns {Record<string, never> | ErrorResponse} Returns an empty object, or error string message
 */
export function adminQuizRestore(token: string, quizid: number, throwHTTPError: boolean): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const userId: number | null = getUserIdByToken(token);

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'token is not a valid structure');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }
  if (!userId) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token is not for currently logged in session');
    } else {
    return ({ error: 'provided token is valid structure, but not for a currently logged in session' });
    }
  }
  const trashQuiz: Quiz = data.trash.find(quiz => quiz.quizId === quizid);
  const availableQuiz: Quiz = data.quizzes.find(quiz => quiz.quizId === quizid);

  // If the quizId is not found in either the trash or available quizzes...
  if (!trashQuiz && !availableQuiz) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'quizid doesnt refer to valid quiz');
    } else {
    return ({ error: 'Quiz ID does not refer to a valid quiz' });
    }
  }// We found it somewhere. If it is in available quiz, return an error...
  if (availableQuiz) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'quizid refers to quiz thats not c urrently in trash');
    } else {
    return ({ error: 'Quiz ID refers to a quiz that is not currently in the trash' });
    }
  }// We know it is in trashQuiz now, check that the quiz is owned by the user...
  if (trashQuiz.creatorId !== userId) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'quizid doesnt refer to a quiz this user owns');
    } else {
    return ({ error: 'Quiz ID does not refer to a quiz that this user owns' });
    }
  }
  // At this point, we should have found the quiz to restore from trash and its a quiz that the user owns...
  // Find the quiz in trash, delete it and move it to the active quizzes again
  const trashQuizIndex: number = data.trash.findIndex(quiz => quiz.quizId === quizid);
  data.trash.splice(trashQuizIndex, 1);
  data.quizzes.push(trashQuiz);
  setData(data);

  return {};
}

/** View the quizzes that are currently in the trash
 *
 * This function takes in a token
 *
 *  @param {string} token A token associated with a users login
 *  @returns {{quizzes: {name: string, quizId: number}[]} | ErrorResponse} Returns an array quizzes, or error string message
 */
export function adminViewTrash(token: string, throwHTTPError: boolean): {quizzes: {name: string, quizId: number}[]} | ErrorResponse {
  const data: Data = getData();

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'token is not a valid structure');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }
  if (getUserIdByToken(token) === null) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token is not for currently logged in session');
    } else {
    return ({ error: 'provided token is valid structure, but not for a currently logged in session' });
    }
  }

  const quizzes: {name: string, quizId: number}[] = [];
  for (const trash of data.trash) {
    quizzes.push({
      name: trash.name,
      quizId: trash.quizId,
    });
  }

  return {
    quizzes,
  };
}

/** Permanently delete specific quizzes currently sitting in the trash
 *
 * This function takes in 2 variables:
 * 1. token
 * 2. quizids
 *
 *  @param {string} token A token associated with a users login
 *  @param {string} quizids An array containing quizids that should be deleted
 *  @returns {ErrorResponse | Record<string, never>} Returns an object if successful or an error object
 *
 */
export function adminTrashEmpty(token: string, quizids: string[], throwHTTPError: boolean): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const userId: number | null = getUserIdByToken(token);

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'token is not a vlaid structure');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }
  if (!userId) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token isnt logged in session');
    } else {
    return ({ error: 'provided token is valid structure, but not for a currently logged in session' });
    }
  }

  for (const quizId of quizids) {
    const parsedQuizId: number = parseInt(quizId);
    const trashQuiz: Quiz = data.trash.find(quiz => quiz.quizId === parsedQuizId);
    const availableQuiz: Quiz = data.quizzes.find(quiz => quiz.quizId === parsedQuizId);
    // If the quizId is not found in either the trash or available quizzes...
    if (!trashQuiz && !availableQuiz || availableQuiz || trashQuiz.creatorId !== userId) {
      if (throwHTTPError === true) {
        throw HTTPError(400, 'errorcode 400');
      } else {
      return ({ error: 'errorcode 400' });
      }
    }
  }
  // If we reached here, it means that it has gone through every quiz passed in to delete
  // and confirmed that they are in the trash and owned by the currently logged in user
  // Delete them...
  for (const quizId of quizids) {
    const parsedQuizId: number = parseInt(quizId);
    const trashIndex: number = data.trash.findIndex(quiz => quiz.quizId === parsedQuizId);
    data.trash.splice(trashIndex, 1);
  }

  return {};
}

/** Transfer ownership of a quiz to a different user based on their email
 *
 * This function takes in 4 variables:
 * 1. quizId
 * 2. token
 * 3. userEmail
 * 4. throwHTTPError
 *
 *  @param {number} quizId the quizId of the quiz being transferred around
 *  @param {string} token A token associated with a users login
 *  @param {string} userEmail The userEmail of the person to transfer the quiz too
 *  @param {boolean} throwHTTPError to determine if this function should throw or return errors
 *  @returns {ErrorResponse | Record<string, never>} Returns an empty object if successful or an error object
 *
 */
export function adminQuizTransfer(quizId: number, token: string, userEmail: string, throwHTTPError: boolean): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !userId, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
    { condition: !quiz, errorCode: 400, message: 'Quiz ID does not refer to a valid quiz.' },
    { condition: quiz && !(quiz.creatorId === userId), errorCode: 400, message: 'Quiz ID does not refer to a quiz that this user owns.' }
  ];

  for (const error of errors) {
    if (error.condition) {
      if (throwHTTPError) {
        throw HTTPError(error.errorCode, error.message);
      } else {
        return { error: error.message };
      }
    }
  }

  const targetUser: User = data.users.find(user => user.email === userEmail);
  if (!targetUser) {
    if (throwHTTPError) {
      throw HTTPError(400, 'userEmail is not a real user') 
    } else {
    return ({ error: 'userEmail is not a real user' });
    }
  }

  // Check if the current user is the same as the target user
  if (targetUser.userId === userId) {
    if (throwHTTPError) {
      throw HTTPError(400, 'userEmail is the current logged in user') 
    } else {
    return ({ error: 'userEmail is the current logged in user' });
    }
  }

  const targetUserQuizzes: Quiz[] = data.quizzes.filter(quiz => quiz.creatorId === targetUser.userId);
  if (targetUserQuizzes.find(q => q.name === quiz.name)) {
    if (throwHTTPError) {
      throw HTTPError(400, 'Quiz ID refers to a quiz that has a name that is already used by the target user') 
    } else {
    return ({ error: 'Quiz ID refers to a quiz that has a name that is already used by the target user' });
    }
  }
  // Transfer the quizzes creator Id to the other persons user Id
  quiz.creatorId = targetUser.userId;
  setData(data);
  return {};
}

/** This copies the quiz, so that any edits whilst a session is running does not affect active session
 *
 * This function takes in 3 variables:
 * 1. quizId
 * 2. token
 * 3. autoStartNum
 *
 *  @param {number} quizId the quizId of the quiz associated with starting a new session
 *  @param {string} token A token associated with a users login
 *  @param {number} autoStartNum Number of people to autostart the quiz once that number of people join
 *  @returns {ErrorResponse | { sessionId: number }} Returns the sessionId of the created session, or throws an HTTPError
 */
export function adminQuizStartNewSession(quizId: number, token: string, autoStartNum: number): ErrorResponse | { sessionId: number } {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  // Token is not a valid structure
  if (!/^-?\d*\.?\d+$/.test(token)) {
    throw HTTPError(401, "Token is not a valid structure")
  }
  // Provided token is valid structure, but is not for a currently logged in session
  if (!userId) {
    throw HTTPError(403, "Provided token is valid structure, but is not for a currently logged in session")
  }
  // Quiz ID does not refer to a valid quiz
  if (!quiz) {
    throw HTTPError(400, "Quiz ID does not refer to a valid quiz")
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!(quiz.creatorId === userId)) {
    throw HTTPError(400, "Quiz ID does not refer to a quiz that this user owns")
  }
  if (autoStartNum > 50) {
    throw HTTPError(400, "autoStartNum is a number greater than 50")
  }
  if (quiz.questions.length === 0) {
    throw HTTPError(400, "The quiz does not have any questions in it")
  }
  if (moreThanOrEqualTo10ENDState(data)) {
    throw HTTPError(400, "A maximum of 10 sessions that are not in END state currently exist")
  }

  let sessionIdNumberRandom: number = generateRandom7DigitNumber();

  const quizCopy: Quiz = JSON.parse(JSON.stringify(quiz));
  const session: Session = {
    sessionId: sessionIdNumberRandom,
    state: QuizState.LOBBY,
    autoStartNum: autoStartNum,
    atQuestion: 0,
    numPlayers: 0,
    players: [],
    messages: [],
    ...quizCopy
  }

  data.sessions.push(session);
  setData(data);
  return { 
    sessionId: sessionIdNumberRandom,
  };
}

/** Get the status of a particular quiz session
 *
 * This function takes in 3 variables:
 * 1. quizId
 * 2. sessionId
 * 3. token
 *
 *  @param {number} quizId the quizId of the quiz in the session
 *  @param {string} sessionId The sessionId of the session we want to get the status/informatino from
 *  @param {number} token A token associated with a users login
 *  @returns {ReturnedSessionStatus | ErrorResponse} Returns an object containing information, or an error response
 */
export function adminQuizGetSessionStatus(quizId: number, sessionId: number, token: string): ReturnedSessionStatus | ErrorResponse {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const session: Session = data.sessions.find(sessions => sessions.sessionId === sessionId);
  const userId: number | null = getUserIdByToken(token);

  // Token is not a valid structure
  if (!/^-?\d*\.?\d+$/.test(token)) {
    throw HTTPError(401, "Token is not a valid structure")
  }
  // Provided token is valid structure, but is not for a currently logged in session
  if (!userId) {
    throw HTTPError(403, "Provided token is valid structure, but is not for a currently logged in session")
  }
  // Quiz ID does not refer to a valid quiz
  if (!quiz) {
    throw HTTPError(400, "Quiz ID does not refer to a valid quiz")
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!(quiz.creatorId === userId)) {
    throw HTTPError(400, "Quiz ID does not refer to a quiz that this user owns")
  }
  // Session ID issues
  if (!session) {
    throw HTTPError(400, "Session Id does not refer to a valid session")
  }
  if (session.quizId !== quizId) {
    throw HTTPError(400, "The Quiz ID passed in is not the correct quiz for the session")
  }

  return {
    state: session.state,
    atQuestion: session.atQuestion,
    players: session.players.map(player => player.name),
    metadata: {
      quizId: session.quizId,
      name: session.name,
      timeCreated: session.timeCreated,
      timeLastEdited: session.timeLastEdited,
      description: session.description,
      numQuestions: session.questions.length,
      questions: session.questions.map(q => ({
        questionId: q.questionId,
        question: q.questionBody.question,
        duration: q.questionBody.duration,
        thumbnailUrl: q.questionBody.thumbnailUrl,
        points: q.questionBody.points,
        answers: q.questionBody.answers.map(a => ({
          answerId: a.answerId,
          answer: a.answer,
          colour: a.colour,
          correct: a.correct,
        })),
      })),
      duration: session.questions.reduce((sum, q) => sum + q.questionBody.duration, 0),
      thumbnailUrl: session.thumbnailUrl,
    }
  }
}

/** Update the state of a particular session by sending an action command
 * 
 * This function takes in 4 variables:
 * 1. quizId
 * 2. sessionId
 * 3. token
 * 4. action
 *
 *  @param {number} quizId the quizId associated with the sesssion
 *  @param {number} sessionId the sessionId associated with a session
 *  @param {string} token a token associated with a users login
 *  @param {string} action an action command that updates the session state according to the spec
 *  @returns {ErrorResponse | Record<string, never>} Returns an empty object on sucess, throws an error otherwise
 */
export function updateSessionState(quizId: number, sessionId: number, token: string, action: string): ErrorResponse | Record<string, never> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const session: Session = data.sessions.find(sessions => sessions.sessionId === sessionId);
  const userId: number | null = getUserIdByToken(token);
  // Token is not a valid structure
  if (!/^-?\d*\.?\d+$/.test(token)) {
    throw HTTPError(401, "Token is not a valid structure")
  }
  // Provided token is valid structure, but is not for a currently logged in session
  if (!userId) {
    throw HTTPError(403, "Provided token is valid structure, but is not for a currently logged in session")
  }
  // Quiz ID does not refer to a valid quiz
  if (!quiz) {
    throw HTTPError(400, "Quiz ID does not refer to a valid quiz")
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!(quiz.creatorId === userId)) {
    throw HTTPError(400, "Quiz ID does not refer to a quiz that this user owns")
  }
  // Session ID issues
  if (!session) {
    throw HTTPError(400, "Session Id does not refer to a valid session")
  }
  if (session.quizId !== quizId) {
    throw HTTPError(400, "The Quiz ID passed in is not the correct quiz for the session")
  }
  if (!Action.includes(action as Actions)) {
    throw HTTPError(400, "Action provided is not a valid Action enum");
  }

  switch (action) {

    case Actions.NEXT_QUESTION:
      if (session.state === QuizState.LOBBY || session.state === QuizState.ANSWER_SHOW || session.state === QuizState.QUESTION_CLOSE) {
        // No more questions, go to final result
        if (session.atQuestion >= session.questions.length) {
          session.state = QuizState.FINAL_RESULTS;
        } else {
          session.state = QuizState.QUESTION_COUNTDOWN;
          // Increment the question position
          session.atQuestion++;
          for (let player of session.players) {
            player.atQuestion++;
          }

          session.countdownTimeout = setTimeout(() => {
            session.state = QuizState.QUESTION_OPEN;
            session.questions[session.atQuestion - 1].questionStartTime = Date.now();
            const duration: number = getQuestionDuration(session);
            session.countdownTimeout = null;

            session.questionTimeout = setTimeout(() => {
              session.state = QuizState.QUESTION_CLOSE;
              // After session.state is set to QUESTION_CLOSE, the results should be processed using the function
              processQuestionResults(sessionId, session.atQuestion);
              session.questionTimeout = null;
            }, duration * 1000);
          }, 100);
        }
      } else {
        throw HTTPError(400, "Action enum cannot be applied in the current state")
      }
      break;

    case Actions.END: // Calling END will timeout everything and set things to END
      if (session.countdownTimeout) {
        clearTimeout(session.countdownTimeout);
        session.countdownTimeout = null;
      }
      if (session.questionTimeout) {
        clearTimeout(session.questionTimeout);
        session.questionTimeout = null;
      }
      session.state = QuizState.END;
      break;

    case Actions.GO_TO_ANSWER:
      if (session.state === QuizState.QUESTION_OPEN || session.state === QuizState.QUESTION_CLOSE) { // If QUESTION_CLOSE, automatically quesitonTimeout will be set to NULL
        if (session.questionTimeout) { // If QUESTION_OPEN, and we want to GO_TO_ANSWER, clear the timeout so information can be processed
          clearTimeout(session.questionTimeout);
          session.questionTimeout = null;
          processQuestionResults(sessionId, session.atQuestion);
        }
        session.state = QuizState.ANSWER_SHOW;
      } else {
        throw HTTPError(400, "Action enum cannot be applied in the current state")
      }
      break;

    case Actions.GO_TO_FINAL_RESULTS:
      if (session.state === QuizState.QUESTION_CLOSE || session.state === QuizState.ANSWER_SHOW) {
        session.state = QuizState.FINAL_RESULTS;
      } else {
        throw HTTPError(400, "Action enum cannot be applied in the current state")
      }
      break;
  }
  return {};
}

/** This is a helper function to process the question results
 * 
 * This function takes in 2 variables:
 * 1. sessionId
 * 2. questionPosition

 *
 *  @param {number} sessionId the sessionId where a question has just finishe and needs to be processed
 *  @param {number} questionPosition the questionPosition within the questions array of a session to udpate
 *  @returns {void} This function does not need to return anything
 */
export function processQuestionResults(sessionId: number, questionPosition: number): void {
  const data: Data = getData();
  const session: Session = data.sessions.find(s => s.sessionId === sessionId);
  
  // Get the question we are processing information for, and its correct answers
  const question: SessionQuizQuestion = session.questions[questionPosition - 1];
  const correctAnswers = question.questionBody.answers.filter(answer => answer.correct);
  
  // Prepare the structure for question results
  const questionResults: QuestionResults = {
    answerInformation: correctAnswers.map(answer => ({
      answerId: answer.answerId,
      playersCorrect: []
    })),
    averageAnswerTime: 0,
    percentCorrect: 0,
    playerRanking: [],
    questionId: question.questionId,
  };

   // Filter through the players so that only those that submitted an answer are shown
   let playersWhoSubmitted = session.players.filter(player => player.selectingAnswers.length > 0);
  // A users answer is not correct and will not display in playersCorrect, unless they select all the correct answers
  // The assumption for this is explained here https://edstem.org/au/courses/11881/discussion/1471628

  // AnswersTimes is an object that is going to store all the answerTimes of each player for a particular question
  // In saying that...only players who submitted an answer are used in the calculation of averageAnswerTime
  let AnswersTimes: { [playerId: string]: number } = {};
  playersWhoSubmitted.forEach(player => {
    // If the player got all the correct options, it means they got the question correct
    // The amount of correctAnswers should be the length of answerInformation
    // Therefore, we can get the answer, and push the correct playerName into [i], which correlates with the answerInformations array
    const gotAllCorrect = correctAnswers.every(answer => player.selectingAnswers.includes(answer.answerId));
    if (gotAllCorrect) {
      correctAnswers.forEach((answer, i) => {
        questionResults.answerInformation[i].playersCorrect.push(player.name);
      });
    }
    AnswersTimes[player.playerId] = player.answerTime; 
  });

  // Average answer time calculation divides by players who submitted an answer
  const totalAnswerTime = Object.values(AnswersTimes).reduce((total, time) => total + time, 0);
  questionResults.averageAnswerTime = totalAnswerTime / playersWhoSubmitted.length;

  // Percentage correct calculation
  questionResults.percentCorrect = (questionResults.answerInformation[0].playersCorrect.length / session.players.length) * 100;

  // Filter the answer times to only include players who got the answer correct
  const correctPlayersAnswerTimes: { [playerId: string]: number } = Object.keys(AnswersTimes)
  .filter(playerId => questionResults.answerInformation.some(info => info.playersCorrect.includes(data.sessions.find(s => s.sessionId === sessionId).players.find(p => p.playerId === parseInt(playerId)).name)))
  .reduce((obj: { [key: string]: number }, key) => {
    obj[key] = AnswersTimes[key];
    return obj;
  }, {});

  // For each player in the session
  session.players.forEach(player => {
    // Checks to see if at least one element in answerInformation where playersCorrect includes the current player name
    // This is convenient because if a players name is on any list, it means they got all the answers correct
    if (questionResults.answerInformation.some(info => info.playersCorrect.includes(player.name))) {
      // Gets all the correctAnswersTimes, and sorts them based on who was fastest at the top
      // Then get the keys (player IDs) of this object (Which we need to stringify because keys are strings)
      // For example ['2' , '1' , '3'], where 2, 1 and 3 are the player IDs in string form
      // The indexing is a way of ranking each player. We add 1, because a person at index 0 is rank 1, index 1 is rank 2 etc.
      // We then get the playerId for the each player, and we find this index in the keys
      // This should give the players rank
      const rank = Object.keys(correctPlayersAnswerTimes)
        .sort((a, b) => correctPlayersAnswerTimes[a] - correctPlayersAnswerTimes[b])
        .indexOf(player.playerId.toString()) + 1;
      // The player's score is calculated as the product of the question's points and the scaling factor, which is 1 divided by the player's rank
      // Rounded to the nearest 1 decimal place
      player.scoreCurrentQuestion = Math.round((question.questionBody.points * (1 / rank)) * 10) / 10; 
      player.score += player.scoreCurrentQuestion;
    } else {
      player.scoreCurrentQuestion = 0;
    }
  });

 // Creating player ranking for the current question
  let playerRankingForCurrentQuestion = session.players.map(player => ({
    playerName: player.name,
    points: player.scoreCurrentQuestion
  }));
  // Sorting the player ranking in descending order based on points, then add it to playerRanking
  playerRankingForCurrentQuestion.sort((a, b) => b.points - a.points);
  questionResults.playerRanking = playerRankingForCurrentQuestion;
  // Update the question results in the session
  question.questionResults = questionResults;

  // Reset player fields for next question
  session.players.forEach(player => {
    player.selectingAnswers = [];
    player.answerTime = 0;
    player.scoreCurrentQuestion = 0;
  });

   // Save the data
  setData(data);
  return;
}

/** Update the thumbnail of a quiz
 *
 * This function takes in 3 variables:
 * 1. quizId
 * 2. token
 * 3. imgURL
 *
 *  @param {number} quizId The quizId where the question needs updating
 *  @param {string} token A token that should correctly match logged in user
 *  @param {string} imgURL The updated thumbnail url
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 *
 */
export async function adminUpdateQuizThumbnail(quizId: number, token: string, imgURL: string): Promise<ErrorResponse | Record<string, never>> {
  const data: Data = getData();
  const quiz: Quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  const userId: number | null = getUserIdByToken(token);

  // Token is not a valid structure
  if (/^-?\d*\.?\d+$/.test(token) === false) {
    throw HTTPError(401, 'Token is not a valid structure' );
  }
  // Provided token is valid structure, but is not for a currently logged in session
  if (!userId) {
    throw HTTPError(403, 'Provided token is valid structure, but is not for a currently logged in session' );
  }
  // Quiz ID does not refer to a valid quiz
  if (!quiz) {
    throw HTTPError(400, 'Quiz ID does not refer to a valid quiz.' );
  }
  // Quiz ID does not refer to a quiz that this user owns
  if (!(quiz.creatorId === userId)) {
    throw HTTPError(400, 'Quiz ID does not refer to a quiz that this user owns.' );
  }

  let res;
  try {
    res = request('GET', imgURL);
  } catch (error) {
    throw HTTPError(400, "The thumbnailUrl does not return to a valid file");
  }

  if (res.statusCode !== 200) {
    throw HTTPError(400, "The thumbnailUrl does not return to a valid file")
  }
  // The response body data includes bytes that make up an image, sync-request getBody gets the information as a Buffer
  const type = await FileType.fromBuffer(res.getBody() as Buffer);
  // The thumbnailUrl, when fetched, is not a JPG or PNG file type
  if (!type || (type.ext !== 'jpg' && type.ext !== 'png')) {
    throw HTTPError(400, "The thumbnailUrl, when fetched, is not a JPG or PNG file type")
  }
  // If it gets to this point, it means that the file is valid and is an image...
  // Download it
  const filename = `${Date.now()}_quizthumbnail.${type.ext}`;
  const pathLocal = `src/thumbnails/${filename}`;
  fs.writeFileSync(pathLocal, res.getBody(), { flag: 'w'});


  quiz.thumbnailUrl = `${url}:${port}/thumbnails/${filename}`;
  quiz.timeLastEdited = (Date.now() / 1000);
  await setData(data);
  return {};
}

/** Get the infromation abotu a question that the guest player is currently on 
 * contains information about questionid, question, duration, thumbnailURL, points 
 * answers array which contains answerID, answer and colour. 
 *
 * This function takes in 3 variables:
 * 1. token
 * 2. quizId
 *
 *  @param {number} quizId The quizId where the question needs updating
 *  @param {string} token A token that should correctly match logged in user
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 *
 */
export function currentQuestionInfo(playerId: number, questionPosition: number): {error?: string} | ReturnedQuizQuestionV2 {
  const data: Data = getData();
  const findPlayer: number | null = doesPlayerExist(data, playerId)
  if (!findPlayer) {
    throw HTTPError(400, "player ID does not exist")
  } 
  const session: Session = data.sessions.find(s => s.sessionId === findPlayer);
  if (questionPosition < session.atQuestion || questionPosition > session.questions.length) {
    throw HTTPError(400, "question position is not valid for the session this player is in");
  }
  if (session.state === QuizState.LOBBY || session.state === QuizState.END) {
    throw HTTPError(400, "session is in Lobby or End state");
  }
  if (session.atQuestion !== questionPosition) {
    throw HTTPError(400, "session is not currently on this question");
  }
  const specfiedQuestion: QuizQuestion = session.questions[questionPosition - 1];
  return {
    questionId: specfiedQuestion.questionId,
    question: specfiedQuestion.questionBody.question,
    duration: specfiedQuestion.questionBody.duration,
    thumbnailUrl: specfiedQuestion.questionBody.thumbnailUrl,
    points: specfiedQuestion.questionBody.points,
    answers: specfiedQuestion.questionBody.answers.map(answer => ({
      answerId: answer.answerId,
      answer: answer.answer,
      colour: answer.colour,
    }))
  }
}

/** Retrieves active and inactive session ids (sorted in acending order) for a quiz
 *
 * This function takes in 3 variables:
 * 1. token
 * 2. quizId
 *
 *  @param {number} quizId The quizId where the question needs updating
 *  @param {string} token A token that should correctly match logged in user
 *  @returns {ErrorResponse | Record<string, never>} An error or empty object on success
 *
 */
export function viewSessions(token: string, quizId: number): sessionHistory {
  const data: Data = getData();
  let activeSessions: number[] = [];
  let inactiveSessions: number[] = [];

  for (let session of data.sessions) {
    if (session.quizId === quizId) {
      if (session.state === "END") {
        inactiveSessions.push(session.sessionId);
      } else {
        activeSessions.push(session.sessionId);
      }
    }
  }
  activeSessions.sort((a, b) => a - b);
  inactiveSessions.sort((a, b) => a - b);
  return { activeSessions, inactiveSessions };
}
