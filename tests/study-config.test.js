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
    pieces: [{ id: 'orange-triangle', label: 'Orange Triangle', color: '#e07a3f' }],
    hintPresets: ['Try rotating that piece.', ''],
  });

  assert.equal(config.plannedRounds, 3);
  assert.equal(config.slotCount, 7);
  assert.equal(config.pieces[0].id, 'orange-triangle');
  assert.deepEqual(config.hintPresets, ['Try rotating that piece.']);
});

test('study config falls back to defaults when the file is missing', () => {
  const missingPath = path.join(os.tmpdir(), `woz-missing-study-${Date.now()}.json`);
  const config = loadStudyConfig(missingPath);
  assert.equal(config.plannedRounds, 9);
  assert.equal(config.tangramPuzzlesDir, 'tangram puzzles');
  assert.ok(config.pieces.length >= 1);
});

test('study config writes hint presets back to disk', () => {
  const filePath = path.join(os.tmpdir(), `woz-save-study-${Date.now()}.json`);
  saveStudyConfig({
    plannedRounds: 3,
    slotCount: 7,
    hintPresets: ['Try rotating that piece.', '  ', 'Look at the outline.'],
  }, filePath);
  const loaded = loadStudyConfig(filePath);
  assert.deepEqual(loaded.hintPresets, ['Try rotating that piece.', 'Look at the outline.']);
  fs.unlinkSync(filePath);
});

test('study config falls back when the file is malformed', () => {
  const filePath = path.join(os.tmpdir(), `woz-bad-study-${Date.now()}.json`);
  fs.writeFileSync(filePath, '{not-json');
  const config = loadStudyConfig(filePath);
  assert.equal(config.plannedRounds, 9);
  fs.unlinkSync(filePath);
});
