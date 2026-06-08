import winston from 'winston';
import { config, UserRoleType } from '../config';
import { privacyService } from '../services/privacyService';

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const maskedMeta = privacyService.maskSensitiveData(meta, 'GENERAL' as UserRoleType);
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (Object.keys(maskedMeta).length > 0) {
    logMessage += ` ${JSON.stringify(maskedMeta)}`;
  }
  if (stack) {
    logMessage += `\n${stack}`;
  }
  return logMessage;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    })
  );
}

export const auditLogger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(`[AUDIT] ${message}`, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(`[AUDIT] ${message}`, meta);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    logger.error(`[AUDIT] ${message}`, meta);
  },
};
