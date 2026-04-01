'use strict';

const { createApp } = require('./create-app');

async function main() {
  const port = Number(process.env.PORT || 3000);
  const app = await createApp({ port });

  app.server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Wizard of Oz Control Application listening on http://localhost:${port}/admin`);
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
