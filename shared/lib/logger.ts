/**
 * Simple logger utility for server actions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  context: '\x1b[35m', // Magenta
  timestamp: '\x1b[90m', // Gray
};

/**
 * Logger utility for server-side code
 */
export const logger = {
  /**
   * Log a debug message
   */
  debug: (message: string, options?: LogOptions) => {
    logMessage('debug', message, options);
  },

  /**
   * Log an info message
   */
  info: (message: string, options?: LogOptions) => {
    logMessage('info', message, options);
  },

  /**
   * Log a warning message
   */
  warn: (message: string, options?: LogOptions) => {
    logMessage('warn', message, options);
  },

  /**
   * Log an error message
   */
  error: (message: string, error?: unknown, options?: LogOptions) => {
    const errorData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : { error };

    logMessage('error', message, {
      ...options,
      data: {
        ...options?.data,
        error: errorData,
      },
    });
  },
};

/**
 * Internal function to format and log messages
 */
function logMessage(level: LogLevel, message: string, options?: LogOptions) {
  const timestamp = new Date().toISOString();
  const contextStr = options?.context ? `[${options.context}]` : '';

  // Create colored output for console
  const coloredOutput = `${colors.timestamp}${timestamp}${colors.reset} ${colors[level]}[${level.toUpperCase()}]${colors.reset} ${colors.context}${contextStr}${colors.reset} ${message}`;

  switch (level) {
    case 'debug':
      console.debug(coloredOutput, options?.data ? options.data : '');
      break;
    case 'info':
      console.info(coloredOutput, options?.data ? options.data : '');
      break;
    case 'warn':
      console.warn(coloredOutput, options?.data ? options.data : '');
      break;
    case 'error':
      console.error(coloredOutput, options?.data ? options.data : '');
      break;
  }
}
