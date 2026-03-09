import { checkDatabaseConnection } from '../config/db.js';
import { env } from '../config/env.js';

export async function getHealthStatus(_request, response) {
  const database = await checkDatabaseConnection();
  const statusCode = database.ok ? 200 : 503;

  response.status(statusCode).json({
    success: database.ok,
    message: 'Rosatri backend status.',
    data: {
      service: env.appName,
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      database,
    },
  });
}
