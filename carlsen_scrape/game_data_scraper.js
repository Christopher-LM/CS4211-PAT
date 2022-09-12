import fetch from 'node-fetch';
import fs from 'fs';

const data = fs.readFileSync('games.json');
const gameIds = JSON.parse(data);

console.log(gameIds.length);
let curIdx = 0;

for (let i = 0; i < 10; i++) {
  (async () => {
    while (curIdx < gameIds.length) {
      const curId = gameIds[curIdx];
      console.log(`ID: ${curId}`)
      curIdx++;

      const response = await fetch(`https://www.chessgames.com/perl/nph-chesspgn?text=1&gid=${curId}`);
      const body = await response.text();

      fs.writeFileSync(`data/${curId}`, body);
    }
  })();
}