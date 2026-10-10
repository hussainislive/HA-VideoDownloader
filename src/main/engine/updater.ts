import type { EngineUpdateResult } from '@shared/types/engine'
import type { AppError, Result } from '@shared/types/result'
import { err, ok } from '@shared/types/result'

import { logger } from '../logger'
import { type BinaryService } from './binaries'
import { type ProcessResult, ProcessRunner, type ProcessRunOptions } from './process-runner'

type UpdateBinaries = Pick<
  BinaryService,
  'refreshStatus' | 'restoreBundledCopy' | 'status' | 'ytdlpInvocation'
>

interface UpdateRunner {
  run(
    file: string,
    args: readonly string[],
    options?: ProcessRunOptions,
  ): Promise<ProcessResult & { stdout: string; stderr: string }>
}

function updateError(detail: string): AppError {
  return {
    code: 'ENGINE_UPDATE_FAILED',
    message: 'The download engine could not be updated.',
    detail,
    retryable: true,
    hint: 'Check your connection and try again.',
  }
}

export class EngineUpdater {
  constructor(
    private readonly binaries: UpdateBinaries,
    private readonly runner: UpdateRunner = new ProcessRunner(),
  ) {}

  async checkAndUpdate(): Promise<Result<EngineUpdateResult>> {
    const before = this.binaries.status.ytdlp.version
    if (!before) return err(updateError('The installed engine has no readable version.'))
    const invocation = this.binaries.ytdlpInvocation(['-U'])
    try {
      const update = await this.runner.run(invocation.file, invocation.args, {
        timeoutMs: 90_000,
        ...(invocation.env ? { env: invocation.env } : {}),
      })
      if (update.code !== 0) {
        logger.error('Engine updater exited unsuccessfully', update.stderr)
        await this.#restoreIfBroken()
        return err(updateError('The updater exited without completing.'))
      }
      const refreshed = await this.binaries.refreshStatus()
      const after = refreshed.ytdlp.version
      if (!after) {
        await this.binaries.restoreBundledCopy()
        await this.binaries.refreshStatus()
        return err(updateError('The update was invalid; the bundled engine was restored.'))
      }
      return ok({ before, after, updated: before !== after })
    } catch (error) {
      logger.error('Engine update failed', error)
      await this.binaries.restoreBundledCopy().catch(() => undefined)
      await this.binaries.refreshStatus().catch(() => undefined)
      return err(updateError('The bundled engine was restored after an update failure.'))
    }
  }

  async #restoreIfBroken(): Promise<void> {
    const status = await this.binaries.refreshStatus()
    if (status.ytdlp.found) return
    await this.binaries.restoreBundledCopy()
    await this.binaries.refreshStatus()
  }
}
