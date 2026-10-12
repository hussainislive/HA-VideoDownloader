import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ProcessRunner, windowsTaskkillPath } from '@main/engine/process-runner'
import { describe, expect, it } from 'vitest'

const worker = join(process.cwd(), 'tests/fixtures/process/worker.mjs')

describe('ProcessRunner', () => {
  it('decodes UTF-8 across chunks and handles CRLF', async () => {
    const result = await new ProcessRunner().run(process.execPath, [worker, 'chunked'])
    expect(result).toMatchObject({ code: 0, stdout: '€\ntwo' })
  })

  it('drains huge output without deadlocking', async () => {
    const result = await new ProcessRunner().run(process.execPath, [worker, 'huge'])
    expect(result.code).toBe(0)
    expect(result.stdout.split('\n')).toHaveLength(10_000)
  })

  it('returns non-zero exit codes and stderr', async () => {
    const result = await new ProcessRunner().run(process.execPath, [worker, 'exit'])
    expect(result).toMatchObject({ code: 7, stderr: 'expected failure' })
  })

  it.runIf(process.platform !== 'win32')(
    'kills the process group including a grandchild',
    async () => {
      const handle = new ProcessRunner().start(process.execPath, [worker, 'grandchild'])
      const childPid = await new Promise<number>((resolve) => {
        handle.onStdoutLine((line) => resolve(Number(line)))
      })
      await handle.kill('force')
      await handle.result
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(() => process.kill(childPid, 0)).toThrow()
    },
  )

  it('pins the safe spawn options in every code path', async () => {
    const source = await readFile(join(process.cwd(), 'src/main/engine/process-runner.ts'), 'utf8')
    expect(source).toContain('shell: false')
    expect(source.match(/windowsHide: true/gu)).toHaveLength(2)
    expect(source).not.toContain('shell: true')
  })

  it('resolves taskkill from the Windows system directory without a shell', () => {
    expect(windowsTaskkillPath({ SystemRoot: 'C:\\Windows' })).toBe(
      'C:\\Windows\\System32\\taskkill.exe',
    )
    expect(windowsTaskkillPath({})).toBe('taskkill.exe')
  })
})
