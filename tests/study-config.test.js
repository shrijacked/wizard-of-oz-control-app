'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadStudyConfig, normalizeStudyConfig, saveStudyConfig } = require('../src/study-config');

test('study config keeps valid pieces, slots, and hint presets', () => {
  const config = normalizeStudyConfig({
    plannedRounds: 3,
    slotCount: 7,
    pieces: [{ id: 'orange-triangle', label: 'Orange Triangle', color: '#e07a3f', programNumber: 1 }],
    hintPresets: ['Try rotating that piece.', ''],
    hintPresetsByPuzzle: {
      1: ['The orange triangle belongs in the upper-left.', ''],
    },
  });

  assert.equal(config.plannedRounds, 3);
  assert.equal(config.slotCount, 7);
  assert.equal(config.pieces[0].id, 'orange-triangle');
  assert.equal(config.pieces[0].programNumber, 1);
  assert.deepEqual(config.hintPresets, ['Try rotating that piece.']);
  assert.deepEqual(config.hintPresetsByPuzzle, {
    1: ['The orange triangle belongs in the upper-left.'],
  });
});

test('study config falls back to defaults when the file is missing', () => {
  const missingPath = path.join(os.tmpdir(), `woz-missing-study-${Date.now()}.json`);
  const config = loadStudyConfig(missingPath);
  assert.equal(config.plannedRounds, 9);
  assert.equal(config.tangramPuzzlesDir, 'tangram puzzles');
  assert.ok(config.pieces.length >= 1);
  assert.deepEqual(
    config.pieces.map(({ label, programNumber }) => [label, programNumber]),
    [
      ['Orange Triangle', 1],
      ['Green Square', 2],
      ['Red Triangle', 3],
      ['Pink Triangle', 4],
      ['Yellow Parallelogram', 5],
      ['Blue Triangle', 6],
      ['Purple Triangle', 7],
    ],
  );
});

test('study config writes hint presets back to disk', () => {
  const filePath = path.join(os.tmpdir(), `woz-save-study-${Date.now()}.json`);
  saveStudyConfig({
    plannedRounds: 3,
    slotCount: 7,
    hintPresets: ['Try rotating that piece.', '  ', 'Look at the outline.'],
    hintPresetsByPuzzle: {
      2: ['The green square belongs at the far upper-left.', '  '],
    },
  }, filePath);
  const loaded = loadStudyConfig(filePath);
  assert.deepEqual(loaded.hintPresets, ['Try rotating that piece.', 'Look at the outline.']);
  assert.deepEqual(loaded.hintPresetsByPuzzle, {
    2: ['The green square belongs at the far upper-left.'],
  });
  fs.unlinkSync(filePath);
});

test('study config falls back when the file is malformed', () => {
  const filePath = path.join(os.tmpdir(), `woz-bad-study-${Date.now()}.json`);
  fs.writeFileSync(filePath, '{not-json');
  const config = loadStudyConfig(filePath);
  assert.equal(config.plannedRounds, 9);
  fs.unlinkSync(filePath);
});
