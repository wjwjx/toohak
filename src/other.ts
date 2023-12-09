import { Colour, getData, setData, User, Quiz, Data, QuestionBody, QuizQuestion, Answer, quizStates, QuizState, Session } from './dataStore';
import { resetTokenIdIncrement, tokenIdIncrement } from './auth';
import { resetQuestionIdIncrement, resetPlayerIdIncrement } from './quiz';

// allColours is an array where every element is of type Colour
// This means that every element in here must be a value from Colour enum
const allColours: Colour[] = [
  Colour.Red,
  Colour.Blue,
  Colour.Green,
  Colour.Yellow,
  Colour.Purple,
  Colour.Brown,
  Colour.Orange,
];


/** finds the email of a user
 * 
 * @param {string} email the email of a user
 * @param {number} userId the userId of a user
 * @returns {string | null} a string email or null
 */
export function findEmail(email: string, userId: number): string | null {
  let data: Data = getData();
  let findEmail: number = 0;
  let validChange: number = 0;
  for (const users in data.users) {
    if (data.users.find(user => user.email === email) && data.users[findEmail].userId !== userId) {
      validChange = 1;
      break;
    }
    findEmail++;
  } 
  if (validChange === 1) {
    return null;
  } else {
    return email;
  }
}

/** Sets the dataIdCounter for adminQuizCreate function
 * 
 * @returns {number}
 */
export function findDataIdCounter() {
  let dataIdCounter = 0;
  const data = getData();
  if (data.trash.length === 0) {
    dataIdCounter = data.quizzes[data.quizzes.length - 1]?.quizId + 1 || 1;
  } else if (data.quizzes.length === 0) {
    dataIdCounter = data.trash[data.trash.length - 1]?.quizId + 1 || 1;
  } else {
    dataIdCounter = Math.max(data.quizzes[data.quizzes.length - 1]?.quizId || 1, data.trash[data.trash.length - 1]?.quizId || 1);
    dataIdCounter += 1;
  }
  return dataIdCounter;
}

/** Generates a unique colour from the remaining unused colours
 *
 * @param {Colour[]} usedColours an array of Colour string enums
 * @return {Colour} returns a colour that has not been used, in string enum form
 */
export function genUniqueColour(usedColours: Colour[]): Colour {
  // Copy allColours into a new array so we don't modify the original
  const availableColours: Colour[] = [...allColours];

  // For loop iterates over every element (colour string) in usedColours
  //  - It passes in the usedColour into availableColours
  //  - This will return -1 if not found
  //  - Therefore, if usedColour, it will remove from availableColours
  for (const usedColour of usedColours) {
    const index: number = availableColours.indexOf(usedColour);
    if (index !== -1) {
      availableColours.splice(index, 1);
    }
  }

  // We return a random array element (which is a colour string) to assign
  return availableColours[Math.floor(Math.random() * availableColours.length)];
}

/** Reset the state of the application back to the start.
 *
 * The clear function wipes all data from the data storage
 * @return {{}} returns an empty object
 */
export function clear(): {} {
  let dataReset: Data = {
    users: [],
    quizzes: [],
    trash: [],
    sessions: [],
  };
  resetTokenIdIncrement();
  resetQuestionIdIncrement();
  resetPlayerIdIncrement();
  setData(dataReset);
  return {};
}

/** Function finds a quiz and returns true or false depending on whether 
 * 
 * @param {string} token The token string assosciated with a register/login user 
 * @param {number} quizid The quizid used to identify the specified quiz
 * @returns {true || false}
 */
export function findQuiz(token: string, quizid: number) {
  const data = getData();
  const givenUserId = getUserIdByToken(token);
  for (let quizzesCounter = 0; quizzesCounter < data.quizzes.length; quizzesCounter++) {
    if (data.quizzes[quizzesCounter].quizId === quizid) {
      if (data.quizzes[quizzesCounter].creatorId === givenUserId) {
        return true;
      }
    }
  }
  return false;
}

/** Function finds a question inside a specified quiz, and returns the index of the question if found, 
 * and returns -1 if not found.
 * 
 * @param {number} quizid
 * @param {questionid} questionid 
 * @returns {questionCounter || -1}
 */
export function findQuestion(quizid: number, questionid: number) {
  const data = getData();

  let questionCounter = 0;
  for (questionCounter = 0; questionCounter < data.quizzes[quizid - 1].questions.length; questionCounter++) {
    if (data.quizzes[quizid - 1].questions[questionCounter].questionId === questionid) {
      return questionCounter;
    }
  }

  return -1;

}

/** Function takes in a token and returns the UserId with that token
 *
 * @param {string} token The token string associated with a register/login user
 * @returns {number | null} Returns the userId if found
 */
export function getUserIdByToken(token: string): number | null {
  const data: Data = getData();
  const user: User = data.users.find(user => user.tokenId.includes(token));
  // If a user was found, return their ID, otherwise return null
  return user ? user.userId : null;
}

/** Function takes in a quiz, and adds up the total duration of quiz questions
 *
 * @param {Quiz} quiz The quiz associated with a quizId
 * @returns {number} Returns a number in seconds, the total duration of all questions
 */
export function getTotalQuestionDuration(quiz: Quiz): number {
  let totalQuestionDuration = 0;
  quiz.questions.forEach(question => {
    totalQuestionDuration += question.questionBody.duration;
  });
  return totalQuestionDuration;
}

/** Function checks to see if all answers are of valid length
 *
 * @param {QuestionBody} questionBody Input containing question information
 * @returns {boolean} True/False if all answers are of valid length
 */
export function validAnswerLengths(questionBody: QuestionBody): boolean {
  return questionBody.answers.every(answer => answer.answer.length >= 1 && answer.answer.length <= 30);
}

/** Function checks to see if all answers are different to teach other
 *
 * @param {QuestionBody} questionBody Input containing question information
 * @returns {boolean} True/False if all answers in a question are different
 */
export function answersDifferent(questionBody: QuestionBody): boolean {
  let seenAnswers: Set<string> = new Set();
  for (let answer of questionBody.answers) {
    const answerText: string = answer.answer;
    if (seenAnswers.has(answerText)) {
      return false;
    }
    seenAnswers.add(answerText);
  }
  return true;
}

/** Function checks to see if a correct answer option exists
 *
 * @param {QuestionBody} questionBody Input containing question information
 * @returns {boolean} True/False if a correct answer choice is present
 */
export function correctAnswerExists(questionBody: QuestionBody): boolean {
  return questionBody.answers.some(answer => answer.correct === true);
}

/** Function that checks if password has at least one number & at least one letter
 *
 * @param {string} NewPassword Input containing the new password as a string
 * @returns {boolean} True/False if a correct answer choice is present
*/
export function isPasswordValid(newPassword: string): boolean {
  // This regular expression checks for at least one number
  const containsNumber: boolean = /\d/.test(newPassword);

  // This regular expression checks for at least one letter
  const containsLetter: boolean = /[a-zA-Z]/.test(newPassword);

  // If newPassword contains at least one number and one letter, return true
  return containsNumber && containsLetter;
}

/** Function checks if there is more than or equal to 10 end state sessions
 *
 * @param {Data} data the datastore
 * @returns {boolean} true/false boolean
*/
export function moreThanOrEqualTo10ENDState(data: Data): boolean | null {
  let nonEndSessionCount: number = 0;
  for (let session of data.sessions) {
    if (session.state !== QuizState.END) {
      nonEndSessionCount++;
    }
  }
  return nonEndSessionCount >= 10;
}

/** Function checks if a player exists
 *
 * @param {Data} data the datastore
 * @param {number} playerid the playerid
 * @returns {number} sessionId of the player
*/
export function doesPlayerExist(data: Data, playerId: number): number | null {
  for (let session of data.sessions) {
    for (let player of session.players) {
      if (player.playerId === playerId) {
        return session.sessionId; // If the playerId exists, return the sesionId where the player is
      }
    }
  }

  return null; // Return null, if player does not exist
}

/** Gets the duration of a question
 *
 * @param {Session} session the session of the question we want to get the duration of
 * @returns {number} sessionId of the player
*/
export function getQuestionDuration(session: Session): number {
    const currentQuestionIndex: number = session.atQuestion;
    const currentQuestion: QuizQuestion = session.questions[currentQuestionIndex - 1];
    return currentQuestion.questionBody.duration;
}

/** Function searches for the quiz inside data and if it finds, return true,
 *  else, return false
 * 
 * @param {number} quizid 
 * @returns {true || false}
 */
export function validQuiz(quizid: number) {
  let data = getData();
  if (data.quizzes.find(quiz => quiz.quizId === quizid) === undefined) {
    return false;
  } else {
    return true;
  }
}

/** Takes in a sessionid and checks data for that session
 * 
 * @param {number} sessionid 
 * @returns {true || false}
 */
export function findSession(sessionid: number, quizid: number): true | false {
  let data = getData();
  const session: Session = data.sessions.find(s => s.sessionId === sessionid);
  if (session.quizId !== quizid) {
    return false;
  } else {
    return true;
  }
}

/** Generates a random name consisting of letters for the first 5 characters and numbers for the next 3.
 * 
 * @returns { string } result
 */
export function guestNameGenerator() {
  let result = '';
  let letterCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let charactersLength = letterCharacters.length;
  let numberCharacters = '0123456789';
  let numbersLength = numberCharacters.length;
  let counter = 0;
  while (counter < 5) {
    let letter = letterCharacters.charAt(Math.floor(Math.random() * charactersLength));
    result += letter;
    letterCharacters.replace(letter, '');
    counter++;
  }
  counter = 0;
  while (counter < 3) {
    let number = numberCharacters.charAt(Math.floor(Math.random()) * numbersLength);
    result += number;
    numberCharacters.replace(number, '');
    counter++;
  }
  return result;
}
