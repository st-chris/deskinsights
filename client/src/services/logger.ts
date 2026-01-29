const isDev = import.meta.env.DEV;

const logger = {
  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, data);
    }
    // In production, send to logging service
  },

  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, send to error tracking service
  },
};

export default logger;
