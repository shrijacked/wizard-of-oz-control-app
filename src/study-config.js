'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_STUDY_CONFIG = Object.freeze({
  plannedRounds: 3,
  slotCount: 7,
  tangramPuzzlesDir: 'tangram puzzles',
  pieces: [
    { id: 'orange-triangle', label: 'Orange Triangle', color: '#e07a3f' },
    { id: 'green-square', label: 'Green Square', color: '#3f8f5c' },
    { id: 'purple-triangle', label: 'Purple Triangle', color: '#7a4fa0' },
    { id: 'pink-triangle', label: 'Pink Triangle', color: '#d6699e' },
    { id: 'yellow-parallelogram', label: 'Yellow Parallelogram', color: '#d3a53a' },
    { id: 'blue-triangle', label: 'Blue Triangle', color: '#2f6f9f' },
    { id: 'red-triangle', label: 'Red Triangle', color: '#c0433a' },
  ],
  hintPresets: [],
});

function normalizePiece(piece, index) {
  const label = String(piece?.label || '').trim();
  if (!label) {
    return null;
  }

  const id = String(piece?.id || '').trim() || `piece-${index + 1}`;
  const color = String(piece?.color || '').trim() || '#5a5148';
  return { id, label, color };
}

function normalizeStudyConfig(raw = {}) {
  const plannedRounds = Number.isFinite(raw.plannedRounds) && raw.plannedRounds > 0
    ? Math.floor(raw.plannedRounds)
    : DEFAULT_STUDY_CONFIG.plannedRounds;

  const slotCount = Number.isFinite(raw.slotCount) && raw.slotCount > 0
    ? Math.floor(raw.slotCount)
    : DEFAULT_STUDY_CONFIG.slotCount;

  const pieces = Array.isArray(raw.pieces)
    ? raw.pieces.map((piece, index) => normalizePiece(piece, index)).filter(Boolean)
    : [];

  const hintPresets = Array.isArray(raw.hintPresets)
    ? raw.hintPresets.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 24)
    : [];

  const tangramPuzzlesDir = String(raw.tangramPuzzlesDir || '').trim()
    || DEFAULT_STUDY_CONFIG.tangramPuzzlesDir;

  return {
    plannedRounds,
    slotCount,
    tangramPuzzlesDir,
    pieces: pieces.length ? pieces : DEFAULT_STUDY_CONFIG.pieces.map((piece) => ({ ...piece })),
    hintPresets,
  };
}

function loadStudyConfig(configPath = path.join(process.cwd(), 'config', 'study.json')) {
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return normalizeStudyConfig(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return normalizeStudyConfig(DEFAULT_STUDY_CONFIG);
    }

    // A malformed config must not crash a study machine — fall back to defaults
    // and surface the problem on the console.
    // eslint-disable-next-line no-console
    console.error(`Failed to load study config at ${configPath}: ${error.message}. Using defaults.`);
    return normalizeStudyConfig(DEFAULT_STUDY_CONFIG);
  }
}

function saveStudyConfig(config, configPath = path.join(process.cwd(), 'config', 'study.json')) {
  const normalized = normalizeStudyConfig(config);
  const payload = {
    plannedRounds: normalized.plannedRounds,
    slotCount: normalized.slotCount,
    tangramPuzzlesDir: normalized.tangramPuzzlesDir,
    pieces: normalized.pieces,
    hintPresets: normalized.hintPresets,
  };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`);
  return normalized;
}

module.exports = {
  DEFAULT_STUDY_CONFIG,
  normalizeStudyConfig,
  loadStudyConfig,
  saveStudyConfig,
};
