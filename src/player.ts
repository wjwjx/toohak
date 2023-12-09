import validator from 'validator';
import { getData, setData, User, Data, Session, QuizState, Player } from './dataStore';
import { getTokenSourceMapRange } from 'typescript';
import { getUserIdByToken, findEmail, isPasswordValid, findQuiz, validQuiz, findSession, guestNameGenerator, doesPlayerExist } from './other';
import  HTTPError  from 'http-errors'
import { ErrorResponse, updateSessionState } from './quiz';
import { sessionResults, userRanks, questionResults, questionBreakdown } from './auth';

export interface playerReturn {
    playerId: number,
}
  
export let playerIdIncrement = 0;
// Resets the questionIdIncrement when clear is called
export function resetPlayerIdIncrement(): void {
    playerIdIncrement = 0;
}

export function guestPlayerJoin(sessionid: number, name: string): {error?: string} | playerReturn {
  let data: Data = getData();
  const session: Session = data.sessions.find(s => s.sessionId === sessionid);
  if (!session) {
    throw HTTPError(400, 'Session not found');
  }
  if (session.state !== QuizState.LOBBY) {
    throw HTTPError(400, 'This quiz is not in LOBBY state');
  }
  if (session.players.find(p => p.name === name)) {
    throw HTTPError(400, 'Someone already has that name');
  }

  if (name === '') {
    const generatedName: string = guestNameGenerator();
    name = generatedName;
  }

  playerIdIncrement++;
  session.players.push({
    playerId: playerIdIncrement,
    name: name,
    score: 0,
    atQuestion: 0,
    selectingAnswers: [],
    answerTime: 0,
    scoreCurrentQuestion: 0,
  });

  session.numPlayers = session.players.length;
  setData(data);

  if (session.numPlayers === session.autoStartNum) {
    let tokenAdmin: string | null = getTokenFromCreator(session, data);
    if (!tokenAdmin) {
      throw HTTPError(400, 'The admin logged out, cannot autoStart without admin present');
    }
    updateSessionState(session.quizId, session.sessionId, tokenAdmin, 'NEXT_QUESTION');
  }

  return {
      playerId: playerIdIncrement,
  }
}

/** Helper function that gets the token of the admin that created the session
 *
 *  @param {Session} session the session that we are trying to auto start
 *  @param {Data} data the entire data object
 *  @returns {string | null} returns the token string, or null
 */
function getTokenFromCreator(session: Session, data: Data): string | null {
  const creator: User = data.users.find(user => user.userId === session.creatorId);
  if (!creator || creator.tokenId.length === 0) {
    return null;
  }
  return creator.tokenId[0]; // Returns first token in the array
}

/** Allow the current player to submit answer(s) to the currently active question
 *  An answer can be re-submitted once first selection is made, as long as game is in the right state
 * This function takes in 3 variables:
 * 1. playerId
 * 2. questionposition
 * 3. answerIds
 *
 *  @param {number} playerId the playerId of the player in session
 *  @param {number} questionposition the questionposition that the player is submitting answers for
 *  @param {number[]} answerIds an array of numbers that represent the answers the player Id is submitting
 *  @returns {ErrorResponse | Record<string, never>} Returns an empty object on sucess, throws an error otherwise
 */
export function playerSubmitAnswers(playerId: number, questionposition: number, answerIds: number[]): ErrorResponse | Record<string, never> {
    const data: Data = getData();
    // findPlayer = NULL if player ID does not exist
    // findPlayer = sessionId if player ID is found in a session
    const findPlayer: number | null = doesPlayerExist(data, playerId)
    if (!findPlayer) {
      throw HTTPError(400, "player ID does not exist")
    }
    const session: Session = data.sessions.find(s => s.sessionId === findPlayer);
    if (questionposition < session.atQuestion || questionposition > session.questions.length) {
      throw HTTPError(400, "question position is not valid for the session this player is in");
    }
    if (session.state !== QuizState.QUESTION_OPEN) {
      throw HTTPError(400, "Session is not in QUESTION_OPEN state");
    }
    if (questionposition > session.atQuestion) {
      throw HTTPError(400, "session is not yet up to this question");
    }
    // Extract valid answer IDs for the current question
    const validAnswerIds: number[] = session.questions[questionposition - 1].questionBody.answers.map(a => a.answerId);
    // Answer IDs invalid
    for (let id of answerIds) {
      if (!validAnswerIds.includes(id)) {
        throw HTTPError(400, "Answer IDs are not valid for this particular question");
      }
    }
    // Check if there are duplicate answer IDs
    // Super Efficient - Creating the Set does not duplicate answerIds
    // Therefore, if the size of the set is the same as original array, there are no duplicates
    const answerIdSet: Set<number> = new Set(answerIds);
    if (answerIdSet.size !== answerIds.length) {
      throw HTTPError(400, "There are duplicate answer IDs provided");
    }
    if (answerIds.length < 1) {
      throw HTTPError(400, "Less than 1 answer ID was submitted");
    }
  
    // Updating the player's answers and answerTime in the session
    const player: Player = session.players.find(p => p.playerId === playerId);
    // Get the currentTime. Get the questionStartTime
    // Calculate the difference between these, this is the time in ms they took to answer for each question
    // https://edstem.org/au/courses/11881/discussion/1465950
    // The time a player takes to answer a question is the time since the question submit answer started, until the last answer the player submitted in seconds
    const currentTime: number = Date.now();
    const questionStartTime: number = session.questions[questionposition - 1].questionStartTime;
    const timeElapsed: number = Math.floor((currentTime - questionStartTime));  
    player.answerTime = timeElapsed;
  
    player.selectingAnswers = answerIds;
    setData(data);
    return {};
}

export function playerGetResults(playerid: number): ErrorResponse | sessionResults {
  let data = getData();
  let sessionid = doesPlayerExist(data, playerid);
  const session: Session = data.sessions.find(s => s.sessionId === sessionid);

  if (!sessionid) {
    throw HTTPError(400, 'playerid not found');
  }

  if (session.state !== QuizState.FINAL_RESULTS) {
    throw HTTPError(400, 'session is not in final results stage');
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

/** Get the results for a particular question of the session a player is playing in 
 * This function takes in 3 variables:
 * 1. playerId
 * 2. questionposition
 *
 *  @param {number} playerId the playerId of the player in session
 *  @param {number} questionposition the questionposition that the player is submitting answers for
 *  @returns {questionResults | ErrorResponse} Returns an questionResults object sucess, throws an error otherwise
 */
export function getQuestionResults(playerId: number, questionposition: number): questionResults | ErrorResponse {
  let data = getData();
  const session: Session = data.sessions.find(s => s.players.some(p => p.playerId === playerId));
  if (!session) {
    throw HTTPError(400, 'playerid not found');
  } else if (questionposition < session.atQuestion || questionposition > session.questions.length) {
    throw HTTPError(400, "question position is not valid for the session this player is in");
  } else if (questionposition > session.atQuestion) {
    throw HTTPError(400, "session is not yet up to this question");
  } else if (session.state !== QuizState.ANSWER_SHOW) {
    throw HTTPError(400, "session is not in ANSWER_SHOW state");
  }
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
  return questionResults[0];
}
