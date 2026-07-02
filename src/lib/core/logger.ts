/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelToConsole: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  }
  return payload
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    levelToConsole.debug(formatMessage('debug', message, meta))
  },
  info(message: string, meta?: Record<string, unknown>) {
    levelToConsole.info(formatMessage('info', message, meta))
  },
  warn(message: string, meta?: Record<string, unknown>) {
    levelToConsole.warn(formatMessage('warn', message, meta))
  },
  error(message: string, meta?: Record<string, unknown>) {
    levelToConsole.error(formatMessage('error', message, meta))
  },
}
