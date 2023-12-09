// Functions starting with adminAuth and adminUser
import validator from 'validator';
import { getData, setData, User, Data, Session, QuizState, playerStatus, Player } from './dataStore';
import { getTokenSourceMapRange } from 'typescript';
import { getUserIdByToken, findEmail, isPasswordValid, validQuiz, findQuiz, findSession } from './other';
import HTTPError from 'http-errors';
import crypto from 'crypto';
import config from './config.json';

function getHashOf(plaintext: string) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export interface sessionResults {
  usersRankedByScore: userRanks[],
  questionResults: questionResults[],
}

export interface questionBreakdown {
  answerId: number,
  playersCorrect: string[],
}

export interface userRanks {
  name: string,
  score: number,
}

export interface questionResults {
  questionId: number,
  questionCorrectBreakdown: questionBreakdown[],
  averageAnswerTime: number,
  percentCorrect: number,
}

export interface userDetails {
  userId: number,
  name: string,
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
}

export let tokenIdIncrement: number = 0;

export function resetTokenIdIncrement() {
  tokenIdIncrement = 0;
}

export interface Message {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number,
}

export interface MessageString {
  messageBody: string,
}

/** Register a user with their email and password, then return a token value, indicating sign on
 *
 * This function takes in 4 variables:
 * 1. Email
 * 2. Password
 * 3. First name
 * 4. Last name
 *
 * After passing in this information, a new user will be made, and the function
 * will return the user's authUserId.
 * @param {string} email The email that the user registers with
 * @param {string} password The password that the user registers with
 * @param {string} nameFirst The first name of the user
 * @param {string} nameLast The last name of the user
 * @returns {{token: string}} An object containing a token associated with the user's registration
 */
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): { error?: string; token?: string } {
  const data: Data = getData();

  const allowedCharacters: RegExp = /^[a-zA-Z '-]+$/;

  // Error cases of incorrectly passed in data
  if (data.users.find(user => user.email === email)) {
    return { error: 'Email address is used by another user' };
  }
  if (!validator.isEmail(email)) {
    return { error: 'Invalid email format' };
  }
  if (nameFirst.length < 2 || nameFirst.length > 20 || !allowedCharacters.test(nameFirst)) {
    return { error: 'First name length not in range or invalid characters exist' };
  }
  if (nameLast.length < 2 || nameLast.length > 20 || !allowedCharacters.test(nameLast)) {
    return { error: 'Last name length not in range' };
  }
  if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { error: 'Invalid password format' };
  }

  // The userIdCounter gets the last user and increments by 1
  // If no users exist, it will create the first user and set its userIdCounter as 1
  // It will also increment the token by 1, and assign this signup token to the user
  const userIdCounter: number = data.users[data.users.length - 1]?.userId + 1 || 1;
  tokenIdIncrement += 1;
  const tokenString: string = tokenIdIncrement.toString();

  data.users.push({
    userId: userIdCounter,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: getHashOf(password),
    passwordHistory: [],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    tokenId: [tokenString],
  });

  setData(data);

  return {
    token: tokenString,
  };
}

/** Given a registered user's email and password, log them in, and return a token value
 *
 * This function takes in 2 variables:
 * 1. Email
 * 2. Password
 *
 * After passing in this information and it matches with a user in the database, the user will be logged into their account
 * and the program will return the user's authUserId. If either email or password are not correct, return error
 * @param {string} email The email that the user registered with
 * @param {string} password The password that the user registered with
 * @returns {{token: string}} An object containing a token associated with the user's login
 */
export function adminAuthLogin(email: string, password: string): { error?: string; token?: string } {
  const data: Data = getData();
  // Go through each object in user: [] array to find matching email. Return error if not found
  const user: User | undefined = data.users.find(user => user.email === email);
  if (!user) {
    return { error: 'Email address does not exist' };
  }
  // Once found matching email, compare the password. If incorrect, return error
  // If correct, return an object with authUserId containing the UserId
  if (user.password !== getHashOf(password)) {
    user.numFailedPasswordsSinceLastLogin += 1;
    setData(data);
    return { error: 'Password is not correct for the given email' };
  }

  user.numSuccessfulLogins += 1;
  user.numFailedPasswordsSinceLastLogin = 0;
  tokenIdIncrement += 1;
  const tokenString: string = tokenIdIncrement.toString();
  user.tokenId.push(tokenString);
  setData(data);
  
  return {
    token: tokenString,
  };
}

/** Given an admin user's authUserId, return details about the user.
 * "name" is the first and last name concatenated with a single space between them
 *
 * This function takes in a singular variable:
 * 1. authUserId
 *
 * Assuming that this user is an admin, return all of the user's information,
 * being their:
 * 1. userId
 * 2. Name
 * 3. Email
 * 4. Number of times they have successfully logged in
 * 4. Number of times they have failed in logging in since the last time they logged in
 *
 * @param {number} authUserId The userId assosciated with the user's registered account
 * @returns {{
 *   user: {
 *     userId: number,
 *     name: string,
 *     email: string,
 *     numSuccessfulLogins: number,
 *     numFailedPasswordsSinceLastLogin: number,
 *   }
 * }} - An object with properties about the userId, name, email, numSuccessfulLogins and numFailedPasswordsSinceLastLogin
 */
export function adminUserDetails(token: string, throwHTTPError: boolean): {error?: string; user?: userDetails} {
  const data: Data = getData();
  const givenUserId = getUserIdByToken(token);

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'Token is not a valid structure');
    } else {
      return ({ error: 'Token is not a valid structure.' });
    }
  }
  
  if (!givenUserId) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'Token is a valid structure, but not for currently logged in session.');
    } else {
    return ({ error: 'Token is valid structure, but not for currently logged in session.' });
    }
  }

  const users: User | undefined = data.users.find(user => user.userId === givenUserId);

  return {
    user:
    {
      userId: users.userId,
      name: users.nameFirst + ' ' + users.nameLast,
      email: users.email,
      numSuccessfulLogins: users.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: users.numFailedPasswordsSinceLastLogin
    }
  };
}

/** Update the details of an admin user
 *
 * @param {string} token associated with a persons login
 * @param {string} email email of the user if they want to change
 * @param {string} nameFirst they might want to change to
 * @param {string} nameLast they might want to change to
 * @param {boolean} throwHTTPError whether this function should throw a HTTPError or return error
 * @returns {{}} returns an empty object on success, or an error string
  */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string, throwHTTPError: boolean): { error?:string } | {} {

  const data = getData();
  const userId = getUserIdByToken(token);

  if (/^-?\d*\.?\d+$/.test(token) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(401, 'token isnt a valid structure');
    } else {
    return ({ error: 'Token is not a valid structure.' });
    }
  }

  if (!userId) {
    if (throwHTTPError === true) {
      throw HTTPError(403, 'token isnt logged in');
    } else {
    return ({error: 'provided token is valid structure, but not for a current logged in session'})
    }
  }

  if (!findEmail(email, userId)) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'email is already used');
    } else {
    return ({error: 'Email is currently used by another user (excluding the current authorised user)'});
    }
  }

  if (validator.isEmail(email) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'email does not satisfy validator');
    } else {
    return ({error: 'email does not satisfy validator'});
    }
  }

  if (nameFirst.length < 2 || nameFirst.length > 20 || /^[a-zA-Z '-]+$/.test(nameFirst) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'name isnt valid length');
    } else {
    return ({error: 'name is not valid length'});
    }
  }

  if (nameLast.length < 2 || nameLast.length > 20 || /^[a-zA-Z '-]+$/.test(nameLast) === false) {
    if (throwHTTPError === true) {
      throw HTTPError(400, 'last name is not valid');
    } else {
    return ({error: 'last name is not valid'});
    }
  }

  // update the user details
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].userId == userId) {
      data.users[i].nameFirst = nameFirst;
      data.users[i].nameLast = nameLast;
      data.users[i].email = email;
      break;
    }
  }

  return {};
}

/** Given a token value for a user, the user is logged out, and null is returned.
 *
 * This function takes in a token from a logged in or registered session from a 
 * user and returns null if the user is 
 * successfully logged out. 
 *
 * After passing in this token in and it matches with a user in the database, 
 * the user will be logged out of their account and the program will return 
 * nothing if successful. If either the user is already logged out or the token 
 * is not valid, return error.
 * @param {string} token An object containing a token associated with the user's login
 * @returns {{}} 
 */
export function adminAuthLogout(token: string, throwHTTPError: boolean): { error?: string } | Record<string, never> {
  const data: Data = getData();
  const userId: number | null = getUserIdByToken(token);

  // Token is not a valid structure
  if (!/^-?\d*\.?\d+$/.test(token)) {
    if (throwHTTPError) {
      throw HTTPError(401, 'Token is not a valid structure.');
    } else {
      return ({ error: 'Token is not a valid structure.' });
    }
  // This token is for a user who has already logged out
  } else if (!userId) {
    if (throwHTTPError) {
      throw HTTPError(400, 'This token is for a user who has already logged out.');
    }
    return ({ error: 'This token is for a user who has already logged out.' });
  } else {
    for (const user of data.users) {
      if (user.tokenId.includes(token)) {
        const indexRemove: number = user.tokenId.indexOf(token);
        user.tokenId.splice(indexRemove, 1);
        setData(data);
        return {};
      }
    }
  }
}

/** Given an admin user's token, changes the old password to new password 
 *
 * This function takes in these variables:
 * 1. token
 * 2. oldPassword
 * 3. newPassword
 * 4. throwHTTPError
 *
 * @param {number} token The token assosciated with the user's registered account
 * @param {string} oldPassword User's old password 
 * @param {string} newPassword User's new password 
 * @returns {} - An empty object 
  */
export function adminUserPassword(token: string, oldPassword: string, newPassword: string, throwHTTPError: boolean): { error?: string } | Record<string, never> {
  const data: Data = getData();
  let originalOldPass: string = oldPassword;
  let originalNewPass: string = newPassword;
  let selectedUser: User = data.users.find(user => user.tokenId.includes(token));
  oldPassword = getHashOf(oldPassword);
  newPassword = getHashOf(newPassword);
  const errors = [
    { condition: !/^-?\d*\.?\d+$/.test(token), errorCode: 401, message: 'Token is not a valid structure' },
    { condition: !selectedUser, errorCode: 403, message: 'Provided token is valid structure, but is not for a currently logged in session' },
  ];
  if (selectedUser) {
    errors.push(
      { condition: !(selectedUser.password === oldPassword), errorCode: 400, message: 'Old Password is not the correct old password' }, 
      { condition: selectedUser.passwordHistory.includes(newPassword), errorCode: 400, message: 'New Password has already been used before by this user' },
      { condition: originalNewPass.length < 8, errorCode: 400, message: 'New Password is less than 8 characters' },
      { condition: !isPasswordValid(originalNewPass), errorCode: 400, message: 'New Password does not contain at least one number and at least one letter' },
      { condition: newPassword === oldPassword, errorCode: 400, message: 'New password is exactly the same as old password' }
    );
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
  selectedUser.password = newPassword;
  selectedUser.passwordHistory.push(oldPassword); 
  setData(data);
  return {};
}

/** Get the chat of the session a player is in
 *
 * @param {number} playerId associated with a player
 * @returns { Message[] } throws errors, if not a message array is returned
  */
export function adminGetPlayerChat(playerId: number): { error?: string } | { messages: Message[]} {
  const data: Data = getData();
   // Find the session where the player is present
  let playersSession: Session | undefined = data.sessions.find(sessions => sessions.players.some((player) => player.playerId === playerId));

  if (!playersSession) {
   throw HTTPError(400, 'Player ID does not exist'); // PlayerID does not exist in any of the sessions
  }

  // Get the messages belonging to the player's session
  const messages: Message[] = playersSession.messages;

  return { messages };
}

/** Send a chat message to the session that the player is in
 *
 * @param {number} playerId associated with a player
 * @param {Message} message the message that the player wants to send
 * @returns {{}} throws errors, if successful, an empty object is returned
  */
export function adminSendPlayerChat(playerId: number, message: MessageString): { error?: string } | {} {
  const data: Data = getData();
   // Find the session where the player is present
  let playersSession: Session | undefined = data.sessions.find(sessions => sessions.players.some((player) => player.playerId === playerId));

  if (!playersSession) {
    // No session found for the player
    throw HTTPError(400, 'Player ID does not exist'); 
  }

  if (message.messageBody === '') {
    throw HTTPError(400, 'Error: message body is less than 1 character'); 
  }
  if (message.messageBody.length > 100) {
    throw HTTPError(400, 'Error: message body is more than 100 characters');
  }

  const playerName: string = playersSession.players.find(players => players.playerId === playerId)?.name;
  
  const messageObject: Message = {
    messageBody: message.messageBody,
    playerId: playerId,
    playerName: playerName,
    timeSent: Math.floor(Date.now() / 1000)
  }

  playersSession.messages.push(messageObject);
  return {};
}

/** Gets the final results of the session
 *
 * @param {string} token associated with an admins login
 * @param {number} quizid the quizid of the quiz associated with a session
 * @param {number} sessionid the sessionid of the quiz that run
 * @returns {sessionResults} throws errors, if successful, an sessionResults is returned
  */
export function getSessionFinalResults(token: string, quizid: number, sessionid: number): {error?: string} | sessionResults {
  let data = getData();
  let givenUserId = getUserIdByToken(token);
  const session: Session | undefined = data.sessions.find(s => s.sessionId === sessionid);

  if (!/^-?\d*\.?\d+$/.test(token)) {
    throw HTTPError(401, "token is invalid structure");
  }

  if (!givenUserId) {
    throw HTTPError(403, "tokens not for a logged in session");
  }

  if (!validQuiz(quizid)) {
    throw HTTPError(400, "unable to find quiz");
  } 

  if (!findQuiz(token, quizid)) {
    throw HTTPError(400, "user has no quiz with this quizid");
  }

  if (!findSession(sessionid, quizid)) {
    throw HTTPError(400, 'there is no session with this quizid');
  }

  if (session.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'quiz is not in final results state');
  }

  // Rank players by score
  const usersRankedByScore = session.players
  .map(player => ({ name: player.name, score: player.score }))
  .sort((a, b) => b.score - a.score);
  
  // For each question in the session, get the results
  const questionResults = session.questions.map(question => {
    const answerInformation = question.questionResults?.answerInformation || [];
    return {
      questionId: question.questionId,
      questionCorrectBreakdown: question.questionBody.answers.filter(answer => answer.correct).map(answer => ({
        answerId: answer.answerId,
        playersCorrect: answerInformation
          .filter(answerInfo => answerInfo.answerId === answer.answerId && answerInfo.playersCorrect.length > 0)
          .flatMap(answerInfo => answerInfo.playersCorrect)
      })),
      averageAnswerTime: question.questionResults?.averageAnswerTime,
      percentCorrect: question.questionResults?.percentCorrect,
    };
  });

  return {
    usersRankedByScore,
    questionResults,
  };
} 

/** Gets the final results of the session in CSV Format
 *
 * @param {string} token associated with an admins login
 * @param {number} quizid the quizid of the quiz associated with a session
 * @param {number} sessionid the sessionid of the quiz that run
 * @returns {{url: string}} throws errors, if successful, a url is returned to the CSV file
  */
export function getFinalSessionResultsCSV(token: string, quizid: number, sessionid: number): {error?: string} | {url: string} {
  let data = getData();
  const givenUserId = getUserIdByToken(token);
  const session: Session = data.sessions.find(s => s.sessionId === sessionid);

  if (!/^-?\d*\.?\d+$/.test(token)) {
    throw HTTPError(401, "token is invalid structure");
  }

  if (!givenUserId) {
    throw HTTPError(403, "tokens not for a logged in session");
  }

  if (!validQuiz(quizid)) {
    throw HTTPError(400, "unable to find quiz");
  } 

  if (!findQuiz(token, quizid)) {
    throw HTTPError(400, "user has no quiz with this quizid");
  }

  if (!findSession(sessionid, quizid)) {
    throw HTTPError(400, 'there is no session with this quizid');
  }

  if (session.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'quiz is not in end state');
  }

  const { convertArrayToCSV } = require('convert-array-to-csv');
  const fs = require('fs');
  const userResults = getSessionFinalResults(token, quizid, sessionid) as sessionResults;
  
  let header: string[] = ['Player',];
  for (let i = 1; i <= session.questions.length; i++) {
    header.push('question' + i + 'score', 'question' + i + 'rank');
  }

  let dataArrays = [];

  for (const players of session.players) {
    dataArrays.push([players.name]);
    for (let i = 1; i <= session.questions.length; i++) {
      let currentQuestion = session.questions.find(q => q.questionId === userResults.questionResults[i - 1].questionId);
      let player = currentQuestion.questionResults.playerRanking.find(p => p.playerName === players.name);
      let currentRank = 1;
      for (const currentPlayer of currentQuestion.questionResults.playerRanking) {
        if (currentPlayer.points > player.points) {
          currentRank++;
        }
      }
      dataArrays[i - 1].push(player.points.toString(), currentRank.toString());
    }
  }

  let csvFromArrayOfArrays: string = convertArrayToCSV(dataArrays, {
    header,
    separator: ','
  });

  fs.writeFile('./src/csvs/results.csv', csvFromArrayOfArrays, (err: Error) => {})

  return{
    url: `/v1/admin/quiz/${quizid}/session/${sessionid}/results/csv/results.csv`,
  }
}

/** Get the status of a guest player that has already joined a sesssion
 * If player ID doesn't exist the function throw error code 400
 * If playerId is valid, the function will return the session's state, numQuestions and the question 
 * current on. 
 *  Takes in 1 paramter 
 * @param {number} playerId associated with an individual's playerId
 * @returns {playerStatus | { error?: string }} throws errors, if successful - returns a playerStatus object
  */
export function getPlayerStatus(playerId: number): playerStatus | { error?: string } {
  const data: Data = getData();
  let selectedSession: Session = data.sessions.find(session => 
    session.players.some(player => player.playerId === playerId)
  );
  // If Player ID does not exist 
  if (!selectedSession) {
    throw HTTPError(400 , 'Player ID does not exist.');
  }
  let selectedPlayer: Player = selectedSession.players.find(player => player.playerId === playerId);
  return {
    state: selectedSession.state,
    numQuestions: selectedSession.questions.length,
    atQuestion: selectedPlayer.atQuestion,
  };
}

