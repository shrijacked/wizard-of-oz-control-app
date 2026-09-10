'use strict';

const os = require('node:os');

function getLocalNetworkAddresses(port) {
  let interfaces;
  try {
    interfaces = os.networkInterfaces();
  } catch (error) {
    // Some locked-down environments deny interface enumeration. LAN URLs are a
    // convenience, not a requirement, so degrade gracefully instead of failing
    // the whole status endpoint.
    return [];
  }

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
          robot: `http://${entry.address}:${port}/robot`,
          audit: `http://${entry.address}:${port}/audit`,
        },
      });
    }
  }

  return addresses;
}

function getLocalHostnameUrls(port) {
  const raw = String(os.hostname() || '').trim().replace(/\.local$/i, '');
  if (!raw) {
    return null;
  }
  const hostname = `${raw}.local`;
  return {
    hostname,
    urls: {
      admin: `http://${hostname}:${port}/admin`,
      subject: `http://${hostname}:${port}/subject`,
      robot: `http://${hostname}:${port}/robot`,
      audit: `http://${hostname}:${port}/audit`,
    },
  };
}

module.exports = {
  getLocalNetworkAddresses,
  getLocalHostnameUrls,
};
