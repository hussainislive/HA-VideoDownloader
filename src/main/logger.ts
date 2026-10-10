import log from 'electron-log/main'

const URL_WITH_QUERY = /(https?:\/\/[^\s?]+)\?[^\s]*/giu

function redact(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(URL_WITH_QUERY, '$1?[redacted]') : value
}

log.initialize()
log.transports.file.maxSize = 2 * 1024 * 1024
log.transports.file.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

export const logger = {
  debug: (message: string, ...details: readonly unknown[]): void => {
    log.debug(redact(message), ...details.map(redact))
  },
  error: (message: string, ...details: readonly unknown[]): void => {
    log.error(redact(message), ...details.map(redact))
  },
  info: (message: string, ...details: readonly unknown[]): void => {
    log.info(redact(message), ...details.map(redact))
  },
  warn: (message: string, ...details: readonly unknown[]): void => {
    log.warn(redact(message), ...details.map(redact))
  },
}
