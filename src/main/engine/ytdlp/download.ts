import type { DownloadJob, DownloadProgress } from '@shared/types/download'
import type { AppError, Result } from '@shared/types/result'
import { err, ok } from '@shared/types/result'

import { logger } from '../../logger'
import { type ProcessHandle, ProcessRunner } from '../process-runner'
import { buildDownloadArgs } from './args'
import { mapEngineError } from './errors'
import { type PreparedProbe, type ProbeCache } from './probe-cache'
import { parseProgressLine, phaseFromOutput, ProgressAccumulator } from './progress'

export interface DownloadCallbacks {
  onProgress(progress: DownloadProgress): void
  onActivity(): void
}

export interface DownloadRun {
  readonly pid: number | undefined
  readonly usedCachedProbe?: boolean
  readonly completion: Promise<Result<{ filePath: string }>>
  kill(): Promise<void>
}

export interface DownloadBinaryProvider {
  readonly paths: { ffmpeg: string }
  ytdlpInvocation(args: readonly string[]): {
    file: string
    args: string[]
    env?: NodeJS.ProcessEnv
  }
}

export class YtdlpDownloadService {
  constructor(
    private readonly binaries: DownloadBinaryProvider,
    private readonly runner = new ProcessRunner(),
    private readonly stallMs = 60_000,
    private readonly probeCache?: ProbeCache,
  ) {}

  start(job: DownloadJob, callbacks: DownloadCallbacks): DownloadRun {
    const prepared = job.attempt === 1 ? this.probeCache?.prepare(job.url, job.mediaId) : undefined
    const invocation = this.binaries.ytdlpInvocation(
      buildDownloadArgs(job, {
        ffmpegPath: this.binaries.paths.ffmpeg,
        ...(prepared ? { infoJsonPath: prepared.path } : {}),
      }),
    )
    const handle = this.runner.start(invocation.file, invocation.args, {
      ...(invocation.env ? { env: invocation.env } : {}),
    })
    return this.#monitor(handle, callbacks, prepared)
  }

  #monitor(
    handle: ProcessHandle,
    callbacks: DownloadCallbacks,
    prepared?: PreparedProbe,
  ): DownloadRun {
    let lastActivity = Date.now()
    let filePath: string | undefined
    let stalled = false
    const stderr: string[] = []
    const progress = new ProgressAccumulator()
    const activity = (): void => {
      lastActivity = Date.now()
      callbacks.onActivity()
    }
    const inspectLine = (line: string): void => {
      if (line.startsWith('HAFILE|')) filePath = line.slice('HAFILE|'.length)
      const existing = line.match(/^\[download\] (.+) has already been downloaded$/u)?.[1]
      if (existing) filePath = existing
    }
    handle.onStdoutLine((line) => {
      activity()
      inspectLine(line)
      const parsed = parseProgressLine(line)
      if (parsed) callbacks.onProgress(progress.update(parsed))
      const phase = phaseFromOutput(line)
      if (phase) callbacks.onProgress({ phase })
    })
    handle.onStderrLine((line) => {
      activity()
      inspectLine(line)
      if (stderr.length < 2_000) stderr.push(line)
      const phase = phaseFromOutput(line)
      if (phase) callbacks.onProgress({ phase })
    })
    const detector = setInterval(
      () => {
        if (Date.now() - lastActivity >= this.stallMs) {
          stalled = true
          void handle.kill()
        }
      },
      Math.min(1_000, Math.max(20, this.stallMs / 4)),
    )
    const completion = handle.result
      .then((result): Result<{ filePath: string }> => {
        clearInterval(detector)
        if (stalled) return err(mapEngineError('', 'NETWORK_STALLED'))
        if (result.code !== 0) {
          const raw = stderr.join('\n')
          logger.error('Download engine failed', raw)
          return err(mapEngineError(raw))
        }
        return ok({ filePath: filePath ?? '' })
      })
      .catch((error: unknown): Result<{ filePath: string }> => {
        clearInterval(detector)
        const failure: AppError = mapEngineError(
          error instanceof Error ? error.message : '',
          'ENGINE_NOT_FOUND',
        )
        return err(failure)
      })
      .finally(() => {
        try {
          prepared?.cleanup()
        } catch (error) {
          logger.warn('Could not remove temporary probe data', error)
        }
      })
    return {
      pid: handle.pid,
      usedCachedProbe: Boolean(prepared),
      completion,
      kill: () => handle.kill(),
    }
  }
}
