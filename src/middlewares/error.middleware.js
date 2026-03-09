export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;

  response.status(statusCode).json({
    success: false,
    message: error.message ?? 'Internal server error.',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}
