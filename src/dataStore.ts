import fs from 'fs';
import path from 'path';
import stringify from 'json-stringify-safe';

export enum Colour {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow',
  Purple = 'purple',
  Brown = 'brown',
  Orange = 'orange',
}

export enum Actions {
  NEXT_QUESTION = 'NEXT_QUESTION',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END',
}

export const Action: Actions[] = [
  Actions.NEXT_QUESTION,
  Actions.GO_TO_ANSWER,
  Actions.GO_TO_FINAL_RESULTS,
  Actions.END,
];

export enum QuizState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export const quizStates: QuizState[] = [
  QuizState.LOBBY,
  QuizState.QUESTION_COUNTDOWN,
  QuizState.QUESTION_OPEN,
  QuizState.QUESTION_CLOSE,
  QuizState.ANSWER_SHOW,
  QuizState.FINAL_RESULTS,
  QuizState.END
];

export interface User {
  userId: number,
  nameFirst: string,  nameLast: string,
  email: string,
  password: string,
  passwordHistory: string[],
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  tokenId: string[],
}

export interface Answer {
  answerId?: number,
  answer: string,
  correct?: boolean,
  colour?: Colour,
}

export interface QuestionBody {
  question: string,
  duration: number,
  thumbnailUrl?: string,
  points: number,
  answers: Answer[],
}

export interface QuizQuestion {
  questionId: number,
  questionBody: QuestionBody,
}

export interface Quiz {
  quizId: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  creatorId: number,
  thumbnailUrl?: string,
  questions: QuizQuestion[],
}

export interface Player {
  playerId: number,
  name: string,
  score: number,
  atQuestion: number,
  selectingAnswers: number[],
  answerTime: number,
  scoreCurrentQuestion: number
}

export interface Message {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number,
}

export interface SessionQuizQuestion {
  questionId: number,
  questionStartTime?: number,
  questionResults?: {
    answerInformation: {
      answerId: number,
      playersCorrect?: string[],
    }[],
    averageAnswerTime?: number,
    percentCorrect: number,
    playerRanking?: {
      playerName: string,
      points: number
    }[],
    questionId: number
  },
  questionBody: QuestionBody,
}

export interface Session {
  sessionId: number,
  state: QuizState,
  countdownTimeout?: NodeJS.Timeout | null,
  questionTimeout?: NodeJS.Timeout | null,
  autoStartNum: number,
  atQuestion: number,
  numPlayers: number,
  players: Player[],
  messages: Message[],
  quizId: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  creatorId: number,
  thumbnailUrl?: string,
  questions: SessionQuizQuestion[],
}

export interface Data {
  users: User[],
  quizzes: Quiz[],
  trash: Quiz[],
  sessions: Session[],
}

export interface playerStatus {
  state: QuizState,
  numQuestions: number,
  atQuestion: number
}

let data: Data = {
  users: [],
  quizzes: [],
  trash: [],
  sessions: []
};

// Determine the path for our data file
const dataFilePath = path.resolve(__dirname, 'data.json');

// Load data from the file at startup
if (fs.existsSync(dataFilePath)) {
  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  data = JSON.parse(rawData);
}


// Use get() to access the data
function getData(): Data {
  return data;
}

function setData(newData: Data): void {
  data = newData;
  fs.writeFileSync(dataFilePath, stringify(data, null, 2));
}

// Persistence: Data is saved at every 10 seconds
// In addition to that, data is also saved after every setData() call from our functions
export let intervalId = setInterval(() => {
  setData(getData());
}, 10000); // Save every 10 seconds

export { getData, setData };
