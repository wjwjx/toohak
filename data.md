```javascript


// Description 
//
// Data is an object containing 2 arrays {users, quizzes}
//
// Users:
//  Users is an array of objects with variables
//      userId - number
//      nameFirst - string
//      nameLast - string
//      email - string
//      password - string
//      numSuccessfulLogins - number
//      numFailedPasswordsSinceLastLogin - number
//      tokenId: string[]
//
// Quizzes
//  Quizzes is an array of objects with variables
//      quizId: number
//      name: string
//      description: string
//      timeCreated: string
//      timeLastEdited: string
//      creatorId: number
//      thumbnailUrl: string
//      questions: [
//           {
//              questionId: number
//              questionBody: {
//                  question: string
//                  duration: number
//                  thumbnailUrl: string
//                  points: number
//                  answers: [
//                      {
//                        answerId: integer
//                        answer: string
//                        correct: boolean
//                        colour: string
//                      }
//                  ]
//               }
//            }
// answerId and colour are generated within the createQuestion function
// T


// General information on the quiz is stored
// Within each quiz object, is an array called questions
// Within this array called questions are multiple objects, being question 1, 2 etc.
// Within each of these objects (e.g. Question 1) contains info about the question, answers, etc.

let data = {

  users: [
    {
      authUserId: 1,
      email: 'jameswhite@gmail.com',
      nameFirst: 'James',
      nameLast: 'White',
      password: 'jamesWhite15',
      numSuccessfulLogins: 3,
      numFailedPasswordsSinceLastLogin: 1
      tokens[]:
    },
      {
      authUserId: 2,
      email: 'rongchen@gmail.com',
      nameFirst: 'Rong',
      nameLast: 'Chen',
      password: 'wanseyrd',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 99
      tokens[]:
    },
    // More Users... (users: array)
  ],

  quizzes: [
    {
      quizId: 1,
      creatorId: 1,
      authUserId: 1,
      timeCreated: 683125870,
      timeLastEdited: 3125870,
      name: 'Quiz 1 - Addition',
      description: 'Quiz 1 contains addition problems',
      questions: [
        { 
          questionId: 1,
          questionName: '9 + 10',
          questionTimer: 10;
          questionChoices: [
            { id: 'A', answer: 9, isCorrect: false },
            { id: 'B', answer: 10, isCorrect: false },
            { id: 'C', answer: 21, isCorrect: true },
            { id: 'D', answer: 19, isCorrect: false },
          ],
        },
        // More Questions... (questions: array)
      ],
    },
    // More quizzes... (quizzes: array)
  ];

  trash: [
      {
      quizId: 3,
      creatorId: 1,
      authUserId: 1,
      timeCreated: 683125870,
      timeLastEdited: 3125870,
      name: 'Quiz 3 - Subtraction',
      description: 'Quiz 3 contains subtraction problems',
      questions: [
        { 
          questionId: 1,
          questionName: '9 - 10',
          questionTimer: 10;
          questionChoices: [
            { id: 'A', answer: -20, isCorrect: false },
            { id: 'B', answer: -10, isCorrect: false },
            { id: 'C', answer: -1, isCorrect: true },
            { id: 'D', answer: 19, isCorrect: false },
          ],
        },
        // More Questions... (questions: array)
      ],
    },
    // More trash quizzes... (trash: array)
  ]
};