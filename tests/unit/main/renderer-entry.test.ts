import { rendererEntry } from '@main/window/renderer-entry'
import { describe, expect, it } from 'vitest'

describe('renderer entry', () => {
  it('uses the local file for packaged apps even when a development URL is injected', () => {
    expect(rendererEntry(true, 'https://untrusted.example')).toEqual({ kind: 'file' })
  })

  it('uses the Vite URL only for unpackaged development', () => {
    expect(rendererEntry(false, 'http://localhost:5173')).toEqual({
      kind: 'url',
      value: 'http://localhost:5173',
    })
    expect(rendererEntry(false)).toEqual({ kind: 'file' })
  })
})
