import fetch from 'node-fetch';
import fs from 'fs';

const urlMatcher = /\/perl\/chessgame\?gid=([0-9]+)\"/g;
const pages = 59;

const gameIds = [];

for (let i = 0; i < pages; i++) {
  console.log(`Fetching page ${i}`);
  const response = await fetch(`https://www.chessgames.com/perl/chess.pl?page=${i + 1}&pid=52629`);
  const body = await response.text();

  const bef = gameIds.length;
  for (const match of body.matchAll(urlMatcher)) {
    gameIds.push(parseInt(match[1]));
  }
  console.log(`Added ${gameIds.length - bef} games`);
}

fs.writeFileSync('games.json', JSON.stringify(gameIds));
