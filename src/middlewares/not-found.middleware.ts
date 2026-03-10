import type { NextFunction, Request, Response } from 'express';

type AppError = Error & {
  statusCode?: number;
};

export function notFoundHandler(request: Request, _response: Response, next: NextFunction): void {
  const error = new Error(`Route ${request.originalUrl} not found.`) as AppError;
  error.statusCode = 404;
  next(error);
}