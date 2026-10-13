import { useToast } from '@renderer/components/ui/Toast'
import { useFreeBytes } from '@renderer/hooks/use-free-bytes'
import { COPY } from '@renderer/lib/copy'
import { useSettingsStore } from '@renderer/store/settings-store'
import { navigateToTab, useUiStore } from '@renderer/store/ui-store'
import type { MediaInfo } from '@shared/types/media'
import {
  availableQualityTiers,
  estimateAudioSize,
  estimateVideoSize,
} from '@shared/utils/media-formats'
import { normalizeMediaUrl } from '@shared/utils/url'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  closestQuality,
  createEnqueueInput,
  optionsFromSettings,
  settingsUpdate,
} from '../downloader-options'
import type { DownloaderController, DownloaderOptions, LinkPhase } from '../downloader-types'

const probeCache = new Map<string, MediaInfo>()

export function useDownloader(): DownloaderController {
  const settings = useSettingsStore((state) => state.settings)
  const freeBytes = useFreeBytes(settings?.downloadDir)
  const { showToast } = useToast()
  const [url, setUrlState] = useState('')
  const [phase, setPhase] = useState<LinkPhase>('idle')
  const [media, setMedia] = useState<MediaInfo>()
  const [userMessage, setUserMessage] = useState<string>()
  const [isEnqueuing, setIsEnqueuing] = useState(false)
  const [lowDiskWarning, setLowDiskWarning] = useState(false)
  const [options, setOptions] = useState<DownloaderOptions>(() => optionsFromSettings(settings))
  const requestId = useRef(0)
  const userEdited = useRef(false)
  const lastClipboardUrl = useRef('')
  const pendingPreserveUrl = useRef(false)

  useEffect(() => {
    return useSettingsStore.subscribe((state, previous) => {
      if (phase === 'idle' && state.settings !== previous.settings) {
        setOptions(optionsFromSettings(state.settings))
      }
    })
  }, [phase])

  const probe = useCallback(async (rawUrl: string): Promise<void> => {
    const id = ++requestId.current
    const normalized = normalizeMediaUrl(rawUrl)
    setPhase('validating')
    setUserMessage(undefined)
    if (!normalized) {
      setMedia(undefined)
      setPhase('error')
      setUserMessage(COPY.downloader.invalid)
      return
    }
    await window.api.media.cancelProbe()
    if (id !== requestId.current) return
    const cached = probeCache.get(normalized)
    if (cached) {
      setMedia(cached)
      setPhase('ready')
      return
    }
    setPhase('probing')
    const result = await window.api.media.probe(normalized)
    if (id !== requestId.current) return
    if (!result.ok) {
      if (result.error.code === 'CANCELED') return
      setMedia(undefined)
      setPhase('error')
      setUserMessage(result.error.hint ?? result.error.message)
      return
    }
    probeCache.set(normalized, result.value)
    setMedia(result.value)
    setPhase('ready')
    setOptions((current) => ({
      ...current,
      quality: closestQuality(availableQualityTiers(result.value.formats), current.quality),
    }))
  }, [])

  useEffect(() => {
    if (!url.trim()) return
    const timer = window.setTimeout(() => void probe(url), 250)
    return () => {
      window.clearTimeout(timer)
      requestId.current += 1
      void window.api.media.cancelProbe()
    }
  }, [probe, url])

  const setUrl = useCallback((value: string, userInitiated = true): void => {
    userEdited.current = userInitiated && value.trim().length > 0
    if (!value.trim()) {
      setPhase('idle')
      setMedia(undefined)
      setUserMessage(undefined)
    } else setPhase('typing')
    setUrlState(value)
  }, [])

  const paste = useCallback(async (): Promise<void> => {
    const result = await window.api.clipboard.readUrl()
    if (result.ok && result.value) {
      lastClipboardUrl.current = result.value
      setUrl(result.value, false)
    } else showToast(COPY.downloader.clipboardEmpty)
  }, [setUrl, showToast])

  useEffect(() => {
    const handleFocus = async (): Promise<void> => {
      if (
        !settings?.autoPasteClipboard ||
        userEdited.current ||
        useUiStore.getState().activeTab !== 'downloader'
      )
        return
      const result = await window.api.clipboard.readUrl()
      if (result.ok && result.value && result.value !== lastClipboardUrl.current) {
        lastClipboardUrl.current = result.value
        setUrl(result.value, false)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [setUrl, settings?.autoPasteClipboard])

  const availableQualities = useMemo(
    () => (media ? availableQualityTiers(media.formats) : []),
    [media],
  )
  const sizeEstimate = useMemo(() => {
    if (!media) return undefined
    return options.kind === 'video'
      ? estimateVideoSize(media.formats, options.quality, media.durationSec)
      : estimateAudioSize(media.durationSec, options.bitrate)
  }, [media, options.bitrate, options.kind, options.quality])

  const setOption = useCallback(
    <Key extends keyof DownloaderOptions>(key: Key, value: DownloaderOptions[Key]): void => {
      setOptions((current) => ({ ...current, [key]: value }))
      if (!settings) return
      void window.api.settings.update(settingsUpdate(key, value)).then((result) => {
        if (result.ok) useSettingsStore.getState().setSettings(result.value)
      })
    },
    [settings],
  )

  const enqueue = useCallback(
    async (preserveUrl: boolean): Promise<void> => {
      if (!media || !settings) return
      const input = createEnqueueInput(
        media,
        settings,
        options,
        normalizeMediaUrl(url) ?? media.webpageUrl,
      )
      setIsEnqueuing(true)
      const result = await window.api.downloads.enqueue(input)
      setIsEnqueuing(false)
      if (!result.ok) {
        setUserMessage(result.error.message)
        setPhase('error')
        return
      }
      showToast(COPY.downloader.added, {
        label: COPY.downloader.viewQueue,
        onClick: () => navigateToTab('queue'),
      })
      if (!preserveUrl) setUrl('', false)
    },
    [media, options, setUrl, settings, showToast, url],
  )

  const submit = useCallback(
    async (skipDiskWarning = false, preserveUrl = false): Promise<void> => {
      if (phase !== 'ready') {
        await probe(url)
        return
      }
      if (
        !skipDiskWarning &&
        sizeEstimate &&
        freeBytes !== undefined &&
        freeBytes < sizeEstimate.bytes * 1.1
      ) {
        pendingPreserveUrl.current = preserveUrl
        setLowDiskWarning(true)
        return
      }
      setLowDiskWarning(false)
      await enqueue(skipDiskWarning ? pendingPreserveUrl.current : preserveUrl)
      pendingPreserveUrl.current = false
    },
    [enqueue, freeBytes, phase, probe, sizeEstimate, url],
  )

  const clear = useCallback(() => {
    requestId.current += 1
    userEdited.current = false
    setUrl('', false)
    void window.api.media.cancelProbe()
  }, [setUrl])

  const selectFolder = useCallback(async (): Promise<void> => {
    const result = await window.api.dialog.chooseFolder()
    if (!result.ok) showToast(COPY.downloader.changeFolderFailed)
    else if (result.value) {
      const updated = await window.api.settings.update({ downloadDir: result.value })
      if (updated.ok) useSettingsStore.getState().setSettings(updated.value)
      else showToast(COPY.downloader.changeFolderFailed)
    }
  }, [showToast])

  return {
    availableQualities,
    clear,
    freeBytes,
    isEnqueuing,
    lowDiskWarning,
    media,
    options,
    paste,
    phase,
    probeNow: () => void probe(url),
    selectFolder,
    setLowDiskWarning,
    setOption,
    setUrl,
    sizeEstimate,
    submit,
    url,
    userMessage,
  }
}
