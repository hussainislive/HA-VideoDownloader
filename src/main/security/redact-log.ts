import { homedir } from 'node:os'

const URL = /https?:\/\/[^\s]+/giu

function redactText(value: string): string {
  return value.replace(URL, '[redacted-url]').split(homedir()).join('~')
}

function redact(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return redactText(value)
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
      ...(value.stack ? { stack: redactText(value.stack) } : {}),
    }
  }
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return '[circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((entry) => redact(entry, seen))
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redact(entry, seen)]),
    )
  }
  return value
}

export function redactLogValue(value: unknown): unknown {
  return redact(value, new WeakSet())
}
