import type { DownloadJob } from '@shared/types/download'
import type { AppError } from '@shared/types/result'

import { transitionJob } from './job'

export function completedJob(job: DownloadJob, filePath: string): DownloadJob {
  return {
    ...transitionJob(job, 'completed', false),
    filePath,
    progress: {
      ...job.progress,
      phase: 'completed',
      percent: 100,
      speedBps: 0,
      etaSec: 0,
    },
  }
}

export function unexpectedDownloadFailure(job: DownloadJob, message: string): DownloadJob {
  return {
    ...transitionJob(job, 'failed', false),
    error: { code: 'UNKNOWN', message, retryable: true },
  }
}

export function failedOrRetryJob(job: DownloadJob, error: AppError): DownloadJob {
  if (
    job.usedCachedProbe &&
    ['HTTP_403_OR_BLOCKED', 'FORMAT_UNAVAILABLE', 'VIDEO_UNAVAILABLE', 'UNKNOWN'].includes(
      error.code,
    )
  ) {
    return { ...job, state: 'queued', usedCachedProbe: false, error }
  }
  if (
    error.code === 'FORMAT_UNAVAILABLE' &&
    job.options.videoFormatId &&
    !job.usedGenericFallback
  ) {
    return {
      ...job,
      state: 'queued',
      options: { ...job.options, videoFormatId: undefined, audioFormatId: undefined },
      usedGenericFallback: true,
      error,
    }
  }
  if (error.code === 'NETWORK_STALLED' && job.stallRetries < 1) {
    return {
      ...job,
      state: 'queued',
      stallRetries: job.stallRetries + 1,
      error,
    }
  }
  const needsMkv =
    error.code === 'FFMPEG_FAILED' &&
    job.options.kind === 'video' &&
    job.options.container === 'mp4' &&
    !job.usedContainerFallback
  if (needsMkv) {
    return {
      ...job,
      state: 'queued',
      options: { ...job.options, container: 'mkv' },
      usedContainerFallback: true,
      error,
    }
  }
  return { ...transitionJob(job, 'failed', false), error }
}
