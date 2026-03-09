import app from './app.js';
import { closeDatabaseConnection } from './config/db.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`${env.appName} is running on port ${env.port}`);
});

async function shutdown(reason) {
  console.log(`Shutting down server (${reason})...`);

  server.close(async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});
