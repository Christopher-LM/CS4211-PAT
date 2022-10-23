import fs from 'fs';
import process from 'node:process';
import { Chess } from 'chess.js'

// Constants
const SCORE_MAP = {
  'k': 0,
  'q': 9,
  'r': 5,
  'n': 3,
  'b': 3,
  'p': 1,
};

const pieceIdxMap = {
  'k': 0,
  'q': 1,
  'r': 2,
  'n': 3,
  'b': 4,
  'p': 5,
};

const WINNING = 0;
const LOSING = 1;
const NEUTRAL = 2;

const ADVANCE = 0;
const CAPTURE = 1;
const ENDWIN = 2;
const ENDLOSE = 3;
const ENDDRAW = 4;

const initCounterMatrix = () => {
  return [
    [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ]
  ];
}

// Input
const dir = 'json_5';
const isBlackFlag = 'isDingBlack';
const isWinFlag = 'isDingWin';

const games = fs.readdirSync(dir);
const counter = initCounterMatrix();

games.forEach(x => {
  const fData = fs.readFileSync(`${dir}/${x}`).toString();
  const data = JSON.parse(fData);
  const game = new Chess();

  const isConcernedTurn = () => {
    return (data[isBlackFlag] && (game.turn() === 'b')) || (!data[isBlackFlag] && (game.turn() === 'w'));
  }
  
  const calcBoardState = () => {
    const score = {
      black: 0,
      white: 0,
    };
  
    const board = game.board();
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (board[x][y] === null) {
          continue;
        }
        const p = board[x][y];
        if (p.color === 'w') {
          score.white += SCORE_MAP[p.type];
        } else {
          score.black += SCORE_MAP[p.type];
        }
      }
    }
  
    if (score.black === score.white) {
      return NEUTRAL;
    }
  
    const isBlackWinning = score.black > score.white;
    if (data[isBlackFlag]) {
      return isBlackWinning ? WINNING : LOSING;
    } else {
      return isBlackWinning ? LOSING : WINNING;
    }
  }

  // Load State
  game.clear();
  for (let i = 0; i < data.boardState.length; i++) {
    const piece = data.boardState[i];
    game.put(piece, piece.square);
  }
  game._turn = data.nextTurn;
  
  for (let i = 0; i < data.moves.length; i++) {
    const shouldCare = isConcernedTurn();
    const winState = calcBoardState();
    const moveDat = game.move(data.moves[i]);
  
    if (shouldCare) {
      const pieceIdx = pieceIdxMap[moveDat.piece];
      if (i === data.moves.length - 1) {
        // Final move in set, game ended because of move
        const m = data.isDraw ? ENDDRAW : (data[isWinFlag] ? ENDWIN : ENDLOSE);
        counter[winState][pieceIdx][m]++;
      } else {
        counter[winState][pieceIdx][moveDat.captured ? CAPTURE : ADVANCE]++;
      }
    }
  
    if (moveDat.captured) {
      break;
    }
  }
});

console.log(counter);
// Normalize counter

const sectionHeaders = ['// Winning Block', '// Losing Block', '// Neutral Block'];
const pieceSuffix = [' //K', ' //Q', ' //R', ' //N', ' //B', ' //P'];
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 6; j++) {
    const arr = counter[i][j];
    const sum = arr.reduce((x, y) => x + y, 0);
    if (sum === 0) {
      counter[i][j] = [1,1,1,1,1];
      continue;
    }

    const normalizedArr = arr.map((x) => 1 + Math.round((x * 95) / sum))
    counter[i][j] = normalizedArr;
  }
}

for (let i = 0; i < 3; i++) {
  console.log(sectionHeaders[i]);
  for (let j = 0; j < 6; j++) {
    const line = counter[i][j].map((x) => `${x}`).map((x) => x.padEnd(2, ' ')).join(', ');
    const isFinal = i === 2 && j === 5;

    console.log(line + (isFinal ? '' : ',') + pieceSuffix[j]);
  }
  console.log();
}
