import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Log technical error details securely on the server
  console.error(`[API Error] [${req.method} ${req.url}]:`, err?.message || err);
  if (err?.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Friendly user-facing messages
  let statusCode = err.status || err.statusCode || 500;
  let userMessage = 'An unexpected system error occurred. Please try again or contact the farm administrator.';

  if (err.name === 'ZodError') {
    statusCode = 400;
    userMessage = 'Validation failed. Please verify the submitted sensor or session data.';
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      details: err.errors
    });
    return;
  }

  if (err.message && (err.message.includes('sensor') || err.message.includes('offline'))) {
    userMessage = err.message;
  } else if (statusCode === 404) {
    userMessage = err.message || 'The requested resource was not found.';
  } else if (statusCode === 401 || statusCode === 403) {
    userMessage = err.message || 'You do not have permission to perform this action.';
  }

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    technicalCode: err.code || 'INTERNAL_ERROR'
  });
}
