'use strict';

const { randomUUID } = require('node:crypto');

class AdminGuard {
  constructor(options = {}) {
    this.pin = String(options.pin || process.env.ADMIN_PIN || '').trim();
    this.tokens = new Map();
  }

  isEnabled() {
    return Boolean(this.pin);
  }

  getPublicStatus() {
    return {
      pinRequired: this.isEnabled(),
      activeUnlocks: this.tokens.size,
    };
  }

  getStatusForToken(token) {
    return {
      ...this.getPublicStatus(),
      authenticated: this.isAuthenticated(token),
    };
  }

  unlock(pin) {
    if (!this.isEnabled()) {
      return {
        token: null,
        pinRequired: false,
        authenticated: true,
      };
    }

    if (String(pin || '').trim() !== this.pin) {
      const error = new Error('Invalid admin PIN.');
      error.statusCode = 401;
      throw error;
    }

    const token = randomUUID();
    this.tokens.set(token, {
      issuedAt: new Date().toISOString(),
    });

    return {
      token,
      pinRequired: true,
      authenticated: true,
    };
  }

  lock(token) {
    if (!token) {
      return false;
    }

    return this.tokens.delete(token);
  }

  isAuthenticated(token) {
    if (!this.isEnabled()) {
      return true;
    }

    return Boolean(token && this.tokens.has(token));
  }

  assertAuthorized(token) {
    if (this.isAuthenticated(token)) {
      return;
    }

    const error = new Error('Admin controls are locked. Unlock with the local PIN first.');
    error.statusCode = 423;
    throw error;
  }
}

module.exports = {
  AdminGuard,
};
