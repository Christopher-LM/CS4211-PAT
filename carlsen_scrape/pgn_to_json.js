import fs from 'fs';
import { parse } from '@mliebelt/pgn-parser';

const names = new Set();
names.add('magnus, carlsen');
names.add('magnus carlsen');
names.add('carlsen magnus');
names.add('carlsen, magnus');
names.add('carlsen,m');
names.add('carlsen magnus  (nor)');
names.add('m carlsen');

const buildJson = (obj) => {
  const game = obj[0];

  let result = 0;
  
  const isCarlsenWhite = names.has(game.tags.White.toLowerCase());
  const isCarlsenBlack = names.has(game.tags.Black.toLowerCase());

  if (!isCarlsenWhite && !isCarlsenBlack) {
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
  
  const carlsenWin = (result === 1 && isCarlsenBlack) || (result === 2 && isCarlsenWhite);
  const draw = result === 3;

  return {
    event: game.tags.Event,
    site: game.tags.Site,
    date: game.tags.Date.value,
    eventDate: game.tags.EventDate.value,
    dateMillis: new Date(game.tags.Date.year, game.tags.Date.month - 1, game.tags.Date.day).getTime(),
    eventDateMillis: new Date(game.tags.EventDate.year, game.tags.EventDate.month - 1, game.tags.EventDate.day).getTime(),
    round: game.tags.Round,
    result: game.tags.Result,
    white: isCarlsenWhite ? 'Magnus Carlsen' : game.tags.White,
    black: isCarlsenBlack ? 'Magnus Carlsen' : game.tags.Black,
    isCarlsenWin: carlsenWin,
    isDraw: draw,
    isCarlsenBlack,
    moves: game.moves.map(x => x.notation.notation),
  };
}

const games = fs.readdirSync('data');
const y = games.forEach(x => {
  const data = fs.readFileSync(`data/${x}`).toString();
  try {
    const info = parse(data);
    const obj = buildJson(info);
    if (obj !== undefined) {
      fs.writeFileSync(`json_data/${x}.json`, JSON.stringify(obj, undefined, 2));
    } else {
      console.log(`skipping ${x}`);
    }
  } catch {
    console.log(`Parsing error, skipping ${x}`)
  }
  
});

console.log("Done");