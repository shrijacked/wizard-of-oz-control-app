'use strict';

const os = require('node:os');

function getLocalNetworkAddresses(port) {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      addresses.push({
        address: entry.address,
        urls: {
          admin: `http://${entry.address}:${port}/admin`,
          subject: `http://${entry.address}:${port}/subject`,
          audit: `http://${entry.address}:${port}/audit`,
        },
      });
    }
  }

  return addresses;
}

module.exports = {
  getLocalNetworkAddresses,
};
