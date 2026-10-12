export type RendererEntry = { kind: 'file' } | { kind: 'url'; value: string }

export function rendererEntry(isPackaged: boolean, developmentUrl?: string): RendererEntry {
  if (!isPackaged && developmentUrl) return { kind: 'url', value: developmentUrl }
  return { kind: 'file' }
}
