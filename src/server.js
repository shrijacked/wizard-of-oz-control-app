'use strict';

const { createApp } = require('./create-app');

async function main() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const app = await createApp({ port });

  // A live study must survive an unexpected throw rather than exit mid-session.
  // Log loudly and keep serving; the request/socket that faulted is already
  // isolated by the per-request and per-socket try/catch handlers.
  process.on('uncaughtException', (error) => {
    // eslint-disable-next-line no-console
    console.error('Uncaught exception (kept the server running):', error);
  });
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection (kept the server running):', reason);
  });

  app.server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Wizard of Oz Control Application listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/admin`);
  });

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
