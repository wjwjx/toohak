import express, { json, Request, Response, NextFunction } from 'express';
import { echo } from './echo';
import { intervalId } from './dataStore';
import { adminAuthLogin, adminAuthRegister, adminUserDetails, adminAuthLogout, adminUserDetailsUpdate, adminUserPassword, adminGetPlayerChat, adminSendPlayerChat, getSessionFinalResults, getFinalSessionResultsCSV, getPlayerStatus } from './auth';
import { adminQuizCreateQuestion, adminQuizCreate, adminUpdateQuizQuestion, adminQuestionDelete, adminQuizMoveQuestion, 
  adminQuizInfo, adminQuizList, adminQuizNameUpdate, adminQuizDescriptionUpdate, adminQuizRemove, adminQuizQuestionDuplicate, 
  adminQuizRestore, adminViewTrash, adminTrashEmpty, adminQuizTransfer, adminQuizStartNewSession, adminQuizGetSessionStatus, updateSessionState, adminUpdateQuizThumbnail, currentQuestionInfo, viewSessions } from './quiz';
import { guestPlayerJoin, playerGetResults, playerSubmitAnswers, getQuestionResults } from './player';
import { clear } from './other';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());

app.use('/thumbnails', express.static(path.join(__dirname, 'src/thumbnails')));

// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// for logging errors (print to terminal)
app.use(morgan('dev'));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================
// echo
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});
// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const userDetails = adminUserDetails(token, false);

  if ('error' in userDetails) {
    // based on the error message, return the appropriate HTTP status code
    if (userDetails.error === 'Token is not a valid structure.') {
      return res.status(401).json(userDetails);
    }
    if (userDetails.error === 'Token is valid structure, but not for currently logged in session.') {
      return res.status(403).json(userDetails);
    }
  }
  return res.json(userDetails);
});
// adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  // Get data from request body and pass into function
  const { email, password, nameFirst, nameLast } = req.body;
  const response = adminAuthRegister(email, password, nameFirst, nameLast);
  // Check if response has error property
  // Set the HTTP status code to response 400
  // Sends a response body in JSON format with the data from response
  if ('error' in response) {
    return res.status(400).json(response);
  } else {
    return res.json(response);
  }
});
// adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const name = req.body.name as string;
  const description = req.body.description as string;

  const quizCreate = adminQuizCreate(token, name, description, false);

  if ('error' in quizCreate) {
    if (quizCreate.error === 'Token is not a valid structure.') {
      return res.status(401).json(quizCreate);
    } else if (quizCreate.error === 'Token is valid structure, but not for currently logged in session.') {
      return res.status(403).json(quizCreate);
    } else {
      return res.status(400).json(quizCreate);
    }
  }
  // otherwise, return the quizId
  return res.json(quizCreate);
});
// adminViewTrash
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const response = adminViewTrash(token, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'provided token is valid structure, but not for a currently logged in session') {
      return res.status(403).json(response);
    }
  }
  return res.json(response);
});
// V2adminViewTrash
app.get('/v2/admin/quiz/trash', (req: Request, res: Response, next: NextFunction ) => {
  const token = req.header('token') as string;

  try {
    const response = adminViewTrash(token, true);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizList(token, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    }
    if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    }
  }
  return res.json(response);
});
// V2adminQuizList
app.get('/v2/admin/quiz/list', (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('token') as string;

  try {
    const response = adminQuizList(token, true);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, name } = req.body;
  const response = adminQuizNameUpdate(token, quizId, name, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// V1adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const email = req.body.email;
  const nameFirst = req.body.nameFirst;
  const nameLast = req.body.nameLast;

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'provided token is valid structure, but not for a current logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }

  return res.json(response);
});
// adminUserDetailsUpdateV2
app.put('/v2/admin/user/details', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const email = req.body.email;
    const nameFirst = req.body.nameFirst;
    const nameLast = req.body.nameLast;
    const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast, true);
    return res.json(response);
  } catch(err) {
    next(err);
  }
});
// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  // Get data from request body and pass into function
  const { email, password } = req.body;
  const response = adminAuthLogin(email, password);

  // Check if response has error property
  // Set the HTTP status code to response 400
  // Sends a response body in JSON format with the data from response
  if ('error' in response) {
    return res.status(400).json(response);
  } else {
    return res.json(response);
  }
});
// clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  if ('error' in response) {
    return res.status(400).json(response);
  } else {
    return res.json(response);
  }
});
// adminQuizCreateQuestion
app.post('/v1/admin/quiz/:quizid/question', async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, questionBody } = req.body;
  const response = await adminQuizCreateQuestion(quizId, token, questionBody, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminTrashEmpty
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizIds = req.query.quizIds as string[];

  const response = adminTrashEmpty(token, quizIds, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'provided token is valid structure, but not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminUpdateQuizQuestion
app.put('/v1/admin/quiz/:quizid/question/:questionid', async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { token, questionBody } = req.body;

  const response = await adminUpdateQuizQuestion(quizId, questionId, token, questionBody, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminQuizMoveQuestion
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { token, newPosition } = req.body;

  const response = adminQuizMoveQuestion(quizId, questionId, token, newPosition, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminQuestionDelete
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizid as string);
  const questionid = parseInt(req.params.questionid as string);
  const token = req.query.token as string;

  const response = adminQuestionDelete(quizid, questionid, token, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'provided token is valid structure, but not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminQuizInfo
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizid);
  const token = req.query.token as string;
  const response = adminQuizInfo(token, quizid, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// adminAuthLogout
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const token: string = req.body.token;
  const response = adminAuthLogout(token, false);
  if ('error' in response) {
    if (response.error === 'This token is for a user who has already logged out.') {
      return res.status(400).json(response);
    } else if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    }
  } else {
    return res.json(response);
  }
});
// V2adminAuthLogout
app.post('/v2/admin/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  const token: string = req.headers.token as string;
  try {
    const response = adminAuthLogout(token, true);
    return res.json(response);
    } catch (err) {
    next(err);
  }
});
// adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, description } = req.body;

  const response = adminQuizDescriptionUpdate(token, quizId, description, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'Token is valid structure, but not for currently logged in session.') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// V2adminQuizDescriptionUpdate
app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  const description = req.body.description as string;

  try {
    const response = adminQuizDescriptionUpdate(token, quizId, description, true);
    return res.json(response);
    } catch (err) {
    next(err);
  }
});
// adminQuizRemove
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  // Get data from request body and pass into function
  const quizid = parseInt(req.params.quizid);
  const token = req.query.token as string;
  const response = adminQuizRemove(token, quizid, false);
  // Check if response has error property
  // Set the HTTP status code to response 400
  // Sends a response body in JSON format with the data from response
  if ('error' in response) {
    if (response.error === 'Token is valid structure, but not for currently logged in session.') {
      return res.status(403).json(response);
    } else if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// V2adminQuizRemove
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response, next: NextFunction) => {
  const quizid = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  
  try {
    const response = adminQuizRemove(token, quizid, true);
    return res.json(response);
    } catch (err) {
    next(err);
  }
});
// adminQuizQuestionDuplicate
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.body.token as string;
  const response = await adminQuizQuestionDuplicate(token, questionId, quizId, false);
  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session.') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  } else {
    return res.json(response);
  }
});
// V2adminQuizQuestionDuplicate
app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid as string);
  const questionId = parseInt(req.params.questionid as string);
  const token = req.header('token') as string;

  try {
    const response = await adminQuizQuestionDuplicate(token, questionId, quizId, true);
    return res.json(response);
    } catch (err) {
    next(err);
  }
});
// adminQuizRestore
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.body.token;
  const quizid = parseInt(req.params.quizid as string);

  const response = adminQuizRestore(token, quizid, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure.') {
      return res.status(401).json(response);
    } else if (response.error === 'provided token is valid structure, but not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }

  return res.json(response);
});
// adminQuizTransfer
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, userEmail } = req.body;
  const response = adminQuizTransfer(quizId, token, userEmail, false);

  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  }
  return res.json(response);
});
// V2adminUserDetails
app.get('/v2/admin/user/details', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const userDetails = adminUserDetails(token, true);
    return res.json(userDetails);
  } catch(err) {
    next(err);
  }
});
// V2adminQuizCreate
app.post('/v2/admin/quiz', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const name = req.body.name as string;
    const description = req.body.description as string;
    const quizCreate = adminQuizCreate(token, name, description, true);
    return res.json(quizCreate);
  } catch(err) {
    next(err);
  }
});
// V2adminQuizCreateQuestion
app.post('/v2/admin/quiz/:quizid/question', async (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  const { questionBody } = req.body;
   try {
    const response = await adminQuizCreateQuestion(quizId, token, questionBody, true);
    return res.json(response);
    res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminQuizMoveQuestion
app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.header('token') as string;
  const { newPosition } = req.body;
  try {
    const response = adminQuizMoveQuestion(quizId, questionId, token, newPosition, true);
    return res.json(response);
    res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminQuizInfo
app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response, next: NextFunction) => {
  const quizid = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  try {
    const response = adminQuizInfo(token, quizid, true);
    return res.json(response);
    res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminQuizNameUpdate
app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  const { name } = req.body;
  try {
    const response = adminQuizNameUpdate(token, quizId, name, true);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminUpdateQuizQuestion
app.put('/v2/admin/quiz/:quizid/question/:questionid', async (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  const questionId = parseInt(req.params.questionid);
  const { questionBody } = req.body;
  try {
    const response = await adminUpdateQuizQuestion(quizId, questionId, token, questionBody, true);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminQuizRestore
app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const quizid = parseInt(req.params.quizid as string);
    const response = adminQuizRestore(token, quizid, true);
    return res.json(response);
  } catch(err) {
    next(err);
  }
});
// V2adminQuizTransfer
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.header('token') as string;
  const { userEmail } = req.body;
  try {
    const response = adminQuizTransfer(quizId, token, userEmail, true);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V2adminTrashEmpty
app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const quizIds = req.query.quizIds as string[];
    const response = adminTrashEmpty(token, quizIds, true);
    return res.json(response);
  } catch(err) {
    next(err);
  }
});
// V2adminQuestionDelete
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizid = parseInt(req.params.quizid as string);
    const questionid = parseInt(req.params.questionid as string);
    const token = req.header('token') as string;
    const response = adminQuestionDelete(quizid, questionid, token, true);
    return res.json(response);
  } catch(err) {
    next(err);
  }
});
// V1adminUserPassword
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const response = adminUserPassword(token, oldPassword, newPassword, false);
 
  if ('error' in response) {
    if (response.error === 'Token is not a valid structure') {
      return res.status(401).json(response);
    } else if (response.error === 'Provided token is valid structure, but is not for a currently logged in session') {
      return res.status(403).json(response);
    } else {
      return res.status(400).json(response);
    }
  } else {
    return res.json(response);
  }
});
// V2adminUserPassword
app.put('/v2/admin/user/password', (req: Request, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.header('token') as string;
  
  try {
    const response = adminUserPassword(token, oldPassword, newPassword, true);
    return res.json(response);
    } catch (err) {
    next(err);
  }
});
// V1adminQuizStartNewSession
app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const quizId = parseInt(req.params.quizid);
    const { autoStartNum } = req.body;
    const response = adminQuizStartNewSession(quizId, token, autoStartNum);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminQuizGetSessionStatus
app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const quizId = parseInt(req.params.quizid);
    const sessionId = parseInt(req.params.sessionid);
    const response = adminQuizGetSessionStatus(quizId, sessionId, token);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1playerSubmitAnswers
app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { answerIds } = req.body;
    const playerId = parseInt(req.params.playerid);
    const questionposition = parseInt(req.params.questionposition);
    const response = playerSubmitAnswers(playerId, questionposition, answerIds);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1updateSessionState
app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    const quizId = parseInt(req.params.quizid);
    const sessionId = parseInt(req.params.sessionid);
    const token = req.header('token') as string;
    const response = updateSessionState(quizId, sessionId, token, action);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1guestPlayerJoin
app.post('/v1/player/join', (req: Request, res: Response, next: NextFunction) => {
  const sessionid = req.body.sessionId;
  const name = req.body.name;

  try {
    const response = guestPlayerJoin(sessionid, name);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminGetFinalSessionResults
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('token') as string;
  const quizid = req.params.quizid;
  const quizidNumber = parseInt(quizid);
  const sessionid = req.params.sessionid;
  const sessionidNumber = parseInt(sessionid);

  try {
    const response = getSessionFinalResults(token, quizidNumber, sessionidNumber);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1playerGetFinalResults
app.get('/v1/player/:playerid/results', (req: Request, res: Response, next: NextFunction) => {
  const playerid = req.params.playerid;
  const playeridNumber = parseInt(playerid);

  try {
    const response = playerGetResults(playeridNumber);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminGetFinalResultsCSV
app.use('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', express.static('./csvs'), (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('token') as string;
  const quizid = req.params.quizid;
  const sessionid = req.params.sessionid;
  const quizidNumber = parseInt(quizid);
  const sessionidNumber = parseInt(sessionid);

  try {
    const response = getFinalSessionResultsCSV(token, quizidNumber, sessionidNumber);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminPlayerGetChat
app.get('/v1/player/:playerid/chat', (req: Request, res: Response, next: NextFunction) => {
  const playerId = parseInt(req.params.playerid);
  try {
    const response = adminGetPlayerChat(playerId);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminPlayerSendChat
app.post('/v1/player/:playerid/chat', (req: Request, res: Response, next: NextFunction) => {
  const playerId = parseInt(req.params.playerid);
  const { message } = req.body;
  try {
    const response = adminSendPlayerChat(playerId, message);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// V1adminUpdateQuizThumbnail
app.put('/v1/admin/quiz/:quizid/thumbnail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = parseInt(req.params.quizid);
    const token = req.header('token') as string;
    const { imgUrl } = req.body;
    const response = await adminUpdateQuizThumbnail(quizId, token, imgUrl);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// CurrentQuestionInfo
app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response, next: NextFunction) => {
  const playerId: number = parseInt(req.params.playerid);
  const questionPosition: number = parseInt(req.params.questionposition);
  try {
    const response = currentQuestionInfo(playerId, questionPosition);
    res.json(response);
  } catch (err) {
    next(err);
  }
})
// getPlayerStatus
app.get('/v1/player/:playerid', (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerid: number = parseInt(req.params.playerid);
    const response = getPlayerStatus(playerid);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});

// viewSessions
app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('token') as string;
    const quizId = parseInt(req.params.quizid);
    const response = viewSessions(token, quizId);
    return res.json(response);
  } catch (err) {
    next(err);
  }
});
// getQuestionResults 
app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parseInt(req.params.playerid);
    const questionPosition = parseInt(req.params.questionposition);
    const response = getQuestionResults(playerId, questionPosition);
    return res.json(response);
  } catch (err) {
    next(err);
  }
}); 

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  clearInterval(intervalId);
  server.close(() => console.log('Shutting down server gracefully.'));
});


