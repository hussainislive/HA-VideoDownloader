import { z } from 'zod'

export const EmptyInputSchema = z.undefined()

export const OpenExternalInputSchema = z.object({
  url: z.string().min(1).max(2_048),
})

export type OpenExternalInput = z.infer<typeof OpenExternalInputSchema>

const QualitySchema = z.union([
  z.literal(480),
  z.literal(720),
  z.literal(1080),
  z.literal(1440),
  z.literal(2160),
])

const DownloadOptionsSchema = z.object({
  kind: z.enum(['video', 'audio']),
  quality: QualitySchema,
  container: z.enum(['mp4', 'mkv']),
  audioFormat: z.enum(['mp3', 'm4a', 'wav']),
  bitrate: z.union([z.literal(128), z.literal(256), z.literal(320)]),
  embedMetadata: z.boolean(),
  videoFormatId: z.string().min(1).optional(),
  audioFormatId: z.string().min(1).optional(),
})

export const ProbeInputSchema = z.object({ url: z.url().max(4_096) })

export const EnqueueInputSchema = z.object({
  url: z.url().max(4_096),
  mediaId: z.string().min(1).max(300),
  title: z.string().min(1).max(500),
  uploader: z.string().max(300).optional(),
  thumbnailUrl: z.url().optional(),
  platform: z.string().min(1).max(100),
  durationSec: z.number().nonnegative().optional(),
  options: DownloadOptionsSchema,
  outputDir: z.string().min(1).max(4_096),
})

export const JobIdInputSchema = z.object({ id: z.uuid() })
export const LibraryDeleteInputSchema = z.object({ id: z.uuid(), deleteFile: z.boolean() })
export const LibrarySearchInputSchema = z.object({
  query: z.string().max(500),
  kind: z.enum(['video', 'audio']).optional(),
})
export const PathInputSchema = z.object({ path: z.string().min(1).max(4_096) })
export const TextInputSchema = z.object({ text: z.string().max(4_096) })
export const SettingsUpdateInputSchema = z
  .object({
    downloadDir: z.string().min(1).max(4_096).optional(),
    defaultKind: z.enum(['video', 'audio']).optional(),
    defaultQuality: QualitySchema.optional(),
    defaultContainer: z.enum(['mp4', 'mkv']).optional(),
    defaultAudioFormat: z.enum(['mp3', 'm4a', 'wav']).optional(),
    defaultAudioBitrate: z.union([z.literal(128), z.literal(256), z.literal(320)]).optional(),
    maxConcurrent: z.number().int().min(1).max(4).optional(),
    autoPasteClipboard: z.boolean().optional(),
    notifyOnComplete: z.boolean().optional(),
    embedMetadata: z.boolean().optional(),
    keepWindowOnTop: z.boolean().optional(),
  })
  .strict()
