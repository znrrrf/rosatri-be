export function notFoundHandler(request, _response, next) {
  const error = new Error(`Route ${request.originalUrl} not found.`);
  error.statusCode = 404;
  next(error);
}
