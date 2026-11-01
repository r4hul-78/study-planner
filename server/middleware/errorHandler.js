export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(`[API Error] ${req.method} ${req.url} [${statusCode}]:`, message);

  res.status(statusCode).json({
    error: {
      code: err.code || 'API_ERROR',
      message: message,
      status: statusCode
    }
  });
}
