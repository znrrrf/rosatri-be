import type { ErrorRequestHandler } from 'express';

type AppError = Error & {
  statusCode?: number;
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const appError = error as AppError;
  const statusCode = appError.statusCode ?? 500;

  response.status(statusCode).json({
    success: false,
    message: appError.message ?? 'Internal server error.',
    stack: process.env.NODE_ENV === 'production' ? undefined : appError.stack,
  });
};