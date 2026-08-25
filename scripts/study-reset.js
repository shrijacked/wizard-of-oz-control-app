'use strict';

// Archives the current study data (state, event log, exports, uploaded puzzles)
// into data/archive/<timestamp>/ and leaves data/ clean for the next participant.
// The server rebuilds an empty state.json, export/, and puzzles/ on next start.

const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(process.cwd(), 'data');
const archiveRoot = path.join(dataDir, 'archive');

function compactTimestamp(now = new Date()) {
  return now.toISOString().replace(/[:.]/g, '-');
}

function moveIfExists(source, destinationDir, name) {
  if (!fs.existsSync(source)) {
    return false;
  }

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.renameSync(source, path.join(destinationDir, name));
  return true;
}

function main() {
  if (!fs.existsSync(dataDir)) {
    process.stdout.write('No data/ directory yet — nothing to archive.\n');
    return;
  }

  const stamp = compactTimestamp();
  const destination = path.join(archiveRoot, stamp);
  const moved = [];

  for (const name of ['state.json', 'events.jsonl', 'export', 'puzzles']) {
    if (moveIfExists(path.join(dataDir, name), destination, name)) {
      moved.push(name);
    }
  }

  if (moved.length === 0) {
    process.stdout.write('data/ already clean — nothing to archive.\n');
    return;
  }

  process.stdout.write(`Archived ${moved.join(', ')} to ${path.relative(process.cwd(), destination)}\n`);
  process.stdout.write('Start the server to begin a fresh session.\n');
}

main();
