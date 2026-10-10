import { access } from 'node:fs/promises'

import { shell } from 'electron'

export async function showInFolder(path: string): Promise<void> {
  await access(path)
  shell.showItemInFolder(path)
}

export async function openFile(path: string): Promise<void> {
  await access(path)
  const failure = await shell.openPath(path)
  if (failure) throw new Error(failure)
}
