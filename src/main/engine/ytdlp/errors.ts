import type { AppError, AppErrorCode } from '@shared/types/result'

const RULES: ReadonlyArray<{
  pattern: RegExp
  code: AppErrorCode
  message: string
  hint?: string
}> = [
  {
    pattern: /unsupported url|no suitable extractor/iu,
    code: 'UNSUPPORTED_URL',
    message: 'This website or link is not supported.',
  },
  {
    pattern:
      /unable to download (?:webpage|json metadata)|unable to connect|temporary failure in name resolution|network is unreachable|offline/iu,
    code: 'NETWORK_OFFLINE',
    message: 'The network appears to be offline.',
  },
  {
    pattern: /http error 403|forbidden|sign in to confirm you.re not a bot/iu,
    code: 'HTTP_403_OR_BLOCKED',
    message: 'The website blocked this download.',
    hint: 'Update the engine and try again.',
  },
  {
    pattern: /not available in your country|geo.restrict/iu,
    code: 'GEO_BLOCKED',
    message: 'This content is not available in your region.',
  },
  {
    pattern: /requested format is not available|no video formats found/iu,
    code: 'FORMAT_UNAVAILABLE',
    message: 'The selected quality or format is not available.',
  },
  {
    pattern: /private video|video (?:is )?unavailable|has been removed|not available/iu,
    code: 'VIDEO_UNAVAILABLE',
    message: 'This video is private, removed, or unavailable.',
  },
  {
    pattern: /login required|sign in|members-only|age.restricted|cookies/iu,
    code: 'LOGIN_REQUIRED',
    message: 'This content requires signing in, which is not supported.',
  },
  {
    pattern: /ffmpeg.*not found|ffprobe.*not found/iu,
    code: 'FFMPEG_MISSING',
    message: 'The bundled media processor is missing.',
  },
  {
    pattern: /ffmpeg.*(?:error|failed)|postprocessing.*error|merge.*failed/iu,
    code: 'FFMPEG_FAILED',
    message: 'The video and audio could not be merged.',
    hint: 'The download can be retried as MKV.',
  },
  {
    pattern: /no space left|disk full/iu,
    code: 'DISK_FULL',
    message: 'There is not enough free disk space.',
  },
  {
    pattern: /permission denied|operation not permitted/iu,
    code: 'PERMISSION_DENIED',
    message: 'The download folder is not writable.',
    hint: 'Choose another folder.',
  },
  {
    pattern: /file name too long|filename too long/iu,
    code: 'FILENAME_TOO_LONG',
    message: 'The generated file name is too long.',
  },
  {
    pattern: /bad cpu type|bad architecture|exec format error/iu,
    code: 'ENGINE_BAD_ARCH',
    message: 'The download engine is not compatible with this Mac.',
    hint: 'Install Rosetta or use a matching build.',
  },
]

export function mapEngineError(stderr: string, fallbackCode: AppErrorCode = 'UNKNOWN'): AppError {
  const rule = RULES.find(({ pattern }) => pattern.test(stderr))
  if (rule) {
    return {
      code: rule.code,
      message: rule.message,
      retryable: !['LOGIN_REQUIRED', 'GEO_BLOCKED', 'VIDEO_UNAVAILABLE'].includes(rule.code),
      ...(rule.hint ? { hint: rule.hint } : {}),
    }
  }
  return {
    code: fallbackCode,
    message:
      fallbackCode === 'NETWORK_STALLED'
        ? 'The download stopped responding.'
        : 'The download engine reported an unexpected problem.',
    retryable: true,
    hint: 'Update the engine and try again.',
  }
}
