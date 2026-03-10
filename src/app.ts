import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: 'Welcome to Rosatri backend API setup.',
    data: {
      service: env.appName,
      apiBaseUrl: env.apiPrefix,
      healthCheck: `${env.apiPrefix}/health`,
    },
  });
});

app.use(env.apiPrefix, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;