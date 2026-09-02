'use strict';

function safeParticipantId(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.includes('..') || raw.includes('/') || raw.includes('\\')) {
    return 'unknown';
  }

  const cleaned = raw
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');
  if (!cleaned || cleaned.includes('..')) {
    return 'unknown';
  }
  return cleaned.slice(0, 64);
}

function recordingFileName({ participantId, sittingNumber, take }) {
  const sitting = Number.isFinite(Number(sittingNumber)) ? Number(sittingNumber) : 1;
  const takeNumber = Number.isFinite(Number(take)) && Number(take) > 0 ? Math.floor(Number(take)) : 1;
  return `table-${safeParticipantId(participantId)}-sitting${sitting}-${takeNumber}.webm`;
}

function publicRecording(record = {}) {
  return {
    id: String(record.id || ''),
    startedAt: record.startedAt || null,
    endedAt: record.endedAt || null,
    bytes: Number(record.bytes) || 0,
    mimeType: record.mimeType || 'video/webm',
    filename: String(record.filename || ''),
    status: record.status || 'recording',
  };
}

function normalizeRecordings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => publicRecording({
    ...entry,
    lastIndex: Number.isFinite(entry.lastIndex) ? entry.lastIndex : -1,
    updatedAt: entry.updatedAt || entry.startedAt || null,
  })).filter((entry) => entry.id);
}

function latestDownloadableRecording(recordings = []) {
  return [...normalizeRecordings(recordings)]
    .reverse()
    .find((entry) => entry.status === 'saved' || entry.status === 'partial') || null;
}

module.exports = {
  latestDownloadableRecording,
  normalizeRecordings,
  publicRecording,
  recordingFileName,
  safeParticipantId,
};
