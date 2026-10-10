import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { app, screen } from 'electron'
import { z } from 'zod'

import { logger } from '../logger'

const WindowStateSchema = z.object({
  height: z.number().int().min(600),
  isMaximized: z.boolean(),
  width: z.number().int().min(850),
  x: z.number().int(),
  y: z.number().int(),
})

export type WindowState = z.infer<typeof WindowStateSchema>

function statePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function isVisible(state: WindowState): boolean {
  return screen.getAllDisplays().some(({ bounds }) => {
    const horizontal = state.x < bounds.x + bounds.width && state.x + state.width > bounds.x
    const vertical = state.y < bounds.y + bounds.height && state.y + state.height > bounds.y
    return horizontal && vertical
  })
}

export function loadWindowState(): WindowState | null {
  try {
    const file = statePath()
    if (!existsSync(file)) return null
    const result = WindowStateSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
    return result.success && isVisible(result.data) ? result.data : null
  } catch (error) {
    logger.warn('Unable to load window state', error)
    return null
  }
}

export function saveWindowState(state: WindowState): void {
  try {
    const file = statePath()
    const temporaryFile = `${file}.tmp`
    writeFileSync(temporaryFile, JSON.stringify(state), { encoding: 'utf8', mode: 0o600 })
    renameSync(temporaryFile, file)
  } catch (error) {
    logger.warn('Unable to save window state', error)
  }
}
