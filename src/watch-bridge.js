'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

class WatchBridge {
  constructor(options) {
    this.store = options.store;
    this.watchFilePath = options.watchFilePath || path.join(process.cwd(), 'watch', 'watch_data.json');
    this.controlFilePath = options.controlFilePath || path.join(path.dirname(this.watchFilePath), 'control.json');
    this.lastSequenceNumber = 0;
    this.status = {
      filePath: this.watchFilePath,
      active: false,
      lastCheckedAt: null,
      lastProcessedAt: null,
      lastError: null,
      lastSequenceNumber: 0,
      calibrationRequestedAt: null,
    };
    this.listener = null;
  }

  async start() {
    this.status.active = true;
    await this.processFile();

    this.listener = async () => {
      await this.processFile();
    };

    fs.watchFile(this.watchFilePath, { interval: 1000 }, this.listener);
  }

  stop() {
    if (this.listener) {
      fs.unwatchFile(this.watchFilePath, this.listener);
      this.listener = null;
    }

    this.status.active = false;
  }

  getStatus() {
    return { ...this.status };
  }

  async requestCalibration(meta = {}) {
    if (!this.status.active) {
      const error = new Error('The watch bridge is not running.');
      error.statusCode = 409;
      throw error;
    }
    const requestedAt = new Date().toISOString();
    await fs.promises.mkdir(path.dirname(this.controlFilePath), { recursive: true });
    await fs.promises.writeFile(this.controlFilePath, JSON.stringify({
      requestId: randomUUID(),
      action: 'calibrate',
      requestedAt,
      requestedBy: meta.requestedBy || 'researcher',
    }, null, 2));
    this.status.calibrationRequestedAt = requestedAt;
    return { accepted: true, requestedAt };
  }

  async processFile() {
    this.status.lastCheckedAt = new Date().toISOString();

    try {
      const raw = await fs.promises.readFile(this.watchFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      const orderedEntries = [...entries].sort((left, right) => {
        return Number(left.sequence_number || 0) - Number(right.sequence_number || 0);
      });

      for (const entry of orderedEntries) {
        const sequenceNumber = Number(entry.sequence_number || 0);
        if (!sequenceNumber || sequenceNumber <= this.lastSequenceNumber) {
          continue;
        }

        await this.store.ingestWatchEntry(entry);
        this.lastSequenceNumber = sequenceNumber;
        this.status.lastSequenceNumber = sequenceNumber;
        this.status.lastProcessedAt = new Date().toISOString();
      }

      this.status.lastError = null;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.status.lastError = null;
        return;
      }

      this.status.lastError = error.message;
    }
  }
}

module.exports = {
  WatchBridge,
};
