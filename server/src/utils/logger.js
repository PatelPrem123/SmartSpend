const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  },
  error: (msg, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error ? (isProduction ? error.message : error) : '');
  },
  debug: (msg, meta = {}) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, meta);
    }
  },
};
