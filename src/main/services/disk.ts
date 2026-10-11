import { randomUUID } from 'node:crypto'
import { access, constants } from 'node:fs'
import { open, statfs, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export async function getFreeBytes(path: string): Promise<number> {
  const stats = await statfs(path)
  return stats.bavail * stats.bsize
}

export async function assertWritableDirectory(path: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) =>
      access(path, constants.W_OK, (error) => (error ? reject(error) : resolve())),
    )
    const testPath = join(path, `.ha-write-test-${randomUUID()}`)
    const file = await open(testPath, 'wx')
    await file.close()
    await unlink(testPath)
  } catch (error) {
    throw new Error('The selected folder is not writable.', { cause: error })
  }
}
