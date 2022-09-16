import fs from 'fs';
import { parse } from '@mliebelt/pgn-parser';
import { Chess } from 'chess.js'

const pieceCount = 5;

const names = new Set();
names.add('ding, liren');
names.add('ding liren');
names.add('liren ding');
names.add('ling diren'); // Lmao what

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
  const nextTurn = board.turn();

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
    nextTurn,
  };
}

const games = fs.readdirSync('data');
let successCount = 0;
let skipCount = 0;
let errorCount = 0;
const y = games.forEach(x => {
  const data = fs.readFileSync(`data/${x}`).toString();
  try {
    const info = parse(data);
    const obj = buildJson(info);
    if (obj !== undefined) {
      fs.writeFileSync(`json_${pieceCount}/${x}.json`, JSON.stringify(obj, undefined, 2));
      successCount++;
    } else {
      skipCount++;
    }
  } catch (err) {
    console.log(`Parsing error, skipping ${x}`)
  }
  errorCount++;
});

console.log(`Done with Success: ${successCount}, Skip: ${skipCount}, Error: ${errorCount}`);