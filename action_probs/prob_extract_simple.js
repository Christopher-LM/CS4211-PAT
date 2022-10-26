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

// Input
const fData = fs.readFileSync('json_5/1182570.json').toString();
const data = JSON.parse(fData);
const game = new Chess();

const isDingTurn = () => {
  return (data.isDingBlack && (game.turn() === 'b')) || (!data.isDingBlack && (game.turn() === 'w'));
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
  if (data.isDingBlack) {
    return isBlackWinning ? WINNING : LOSING;
  } else {
    return isBlackWinning ? LOSING : WINNING;
  }
}

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

const counter = initCounterMatrix();
// Load State
game.clear();
for (let i = 0; i < data.boardState.length; i++) {
  const piece = data.boardState[i];
  game.put(piece, piece.square);
}
game._turn = data.nextTurn;

for (let i = 0; i < data.moves.length; i++) {
  const shouldCare = isDingTurn();
  const winState = calcBoardState();
  const moveDat = game.move(data.moves[i]);

  if (shouldCare) {
    const pieceIdx = pieceIdxMap[moveDat.piece];
    if (i === data.moves.length - 1) {
      // Final move in set, game ended because of move
      const m = data.isDraw ? ENDDRAW : (data.isDingWin ? ENDWIN : ENDLOSE);
      counter[winState][pieceIdx][m]++;
    } else {
      counter[winState][pieceIdx][moveDat.captured ? CAPTURE : ADVANCE]++;
    }
  }

  if (moveDat.captured) {
    break;
  }
}

console.log(counter);

/*
const countPieces = (board) => {
  let count = 0;
  for (let i = 0; i < 8; i++) {
    const row = board[i];
    for (let j = 0; j < 8; j++) {
      if (row[j] !== null) {
        count++;
      }
    }
  }
  return count;
}

const convertBoard = (board) => {
  let result = [];
  for (let i = 0; i < 8; i++) {
    const row = board[i];
    for (let j = 0; j < 8; j++) {
      if (row[j] !== null) {
        result.push(row[j]);
      }
    }
  }
  return result;
}

const buildJson = (obj) => {
  const game = obj[0];

  let result = 0;
  
  const isDingWhite = names.has(game.tags.White.toLowerCase());
  const isDingBlack = names.has(game.tags.Black.toLowerCase());

  if (!isDingBlack && !isDingWhite) {
    console.log('Not white or black');
    return undefined;
  }

  if (game.tags.Result === '0-1') {
    result = 1;
  } else if (game.tags.Result === '1-0') {
    result = 2;
  } else if (game.tags.Result === '1/2-1/2') {
    result = 3;
  }

  if (result === 0) {
    console.log("Unknown result");
  }
  
  const dingWin = (result === 1 && isDingBlack) || (result === 2 && isDingWhite);
  const draw = result === 3;
  const moves = game.moves;

  const board = new Chess();

  let i = 0;
  for (; i < moves.length; i++) {
    board.move(moves[i].notation.notation);
    if (countPieces(board.board()) <= pieceCount) {
      i++;
      break;
    }
  }

  if (i === moves.length) {
    return undefined;
  }

  const boardState = convertBoard(board.board());

  const movesLeft = [];
  for (; i < moves.length; i++) {
    movesLeft.push(moves[i].notation.notation);
    board.move(moves[i].notation.notation);
  }

  const endPieceCount = countPieces(board.board())

  if (endPieceCount === pieceCount) {
    return undefined;
  }

  return {
    event: game.tags.Event,
    site: game.tags.Site,
    date: game.tags.Date.value,
    eventDate: game.tags.EventDate.value,
    dateMillis: new Date(game.tags.Date.year, game.tags.Date.month - 1, game.tags.Date.day).getTime(),
    eventDateMillis: new Date(game.tags.EventDate.year, game.tags.EventDate.month - 1, game.tags.EventDate.day).getTime(),
    round: game.tags.Round,
    result: game.tags.Result,
    white: isDingWhite ? 'Ding Liren' : game.tags.White,
    black: isDingBlack ? 'Ding Liren' : game.tags.Black,
    isDingWin: dingWin,
    isDraw: draw,
    isDingBlack,
    moves: movesLeft,
    statePieceCount: pieceCount,
    endPieceCount,
    boardState,
  };
}

console.log(buildJson(info));
*/