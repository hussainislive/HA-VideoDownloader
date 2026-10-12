import log from 'electron-log/main'

import { redactLogValue } from './security/redact-log'

log.initialize()
log.transports.file.maxSize = 2 * 1024 * 1024
log.transports.file.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

export const logger = {
  debug: (message: string, ...details: readonly unknown[]): void => {
    log.debug(redactLogValue(message), ...details.map(redactLogValue))
  },
  error: (message: string, ...details: readonly unknown[]): void => {
    log.error(redactLogValue(message), ...details.map(redactLogValue))
  },
  info: (message: string, ...details: readonly unknown[]): void => {
    log.info(redactLogValue(message), ...details.map(redactLogValue))
  },
  warn: (message: string, ...details: readonly unknown[]): void => {
    log.warn(redactLogValue(message), ...details.map(redactLogValue))
  },
}
