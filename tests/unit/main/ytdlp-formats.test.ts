import {
  availableQualityTiers,
  estimateAudioSize,
  estimateVideoSize,
  selectVideoFormat,
} from '@main/engine/ytdlp/formats'
import type { MediaFormat } from '@shared/types/media'
import { describe, expect, it } from 'vitest'

const formats: MediaFormat[] = [
  { id: 'v480', width: 854, height: 480, vcodec: 'avc1', acodec: 'none', filesize: 500_000 },
  {
    id: 'v1030',
    width: 1_920,
    height: 1_030,
    vcodec: 'vp9',
    acodec: 'none',
    filesizeApprox: 2_000_000,
  },
  { id: 'audio', vcodec: 'none', acodec: 'mp4a', abr: 128, filesize: 100_000 },
]

describe('format selection and estimates', () => {
  it('uses the 95 percent tier tolerance', () => {
    expect(availableQualityTiers(formats)).toEqual([1080, 720, 480])
  })

  it('maps vertical media by its shorter side', () => {
    const vertical = [{ id: 'short', width: 1080, height: 1920, vcodec: 'avc1', acodec: 'none' }]
    expect(availableQualityTiers(vertical)).toContain(1080)
    expect(selectVideoFormat(vertical, 1080)?.id).toBe('short')
  })

  it('combines video and audio size while preserving approximation', () => {
    expect(estimateVideoSize(formats, 1080, 10)).toEqual({ bytes: 2_100_000, approximate: true })
    expect(estimateAudioSize(10, 320)).toEqual({ bytes: 400_000, approximate: true })
  })
})
