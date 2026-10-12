import { useToast } from '@renderer/components/ui/Toast'
import { COPY } from '@renderer/lib/copy'
import { useCallback, useEffect, useState } from 'react'

import { ABOUT_LINKS, DEVELOPER_EMAIL } from './about-links'
import { AboutConnect } from './components/AboutConnect'
import { AboutDetails } from './components/AboutDetails'
import { AboutProfileCard } from './components/AboutProfileCard'

export default function AboutScreen(): React.JSX.Element {
  const { showToast } = useToast()
  const [version, setVersion] = useState('…')

  useEffect(() => {
    void window.api.system.getVersion().then((result) => {
      if (result.ok) setVersion(result.value)
    })
  }, [])

  const open = useCallback(
    async (url: string): Promise<void> => {
      const result = await window.api.system.openExternal(url)
      if (!result.ok) showToast(result.error.message)
    },
    [showToast],
  )
  const copyEmail = useCallback(async (): Promise<void> => {
    const result = await window.api.clipboard.writeText(DEVELOPER_EMAIL)
    showToast(result.ok ? COPY.about.emailCopied : result.error.message)
  }, [showToast])
  const openLicenses = useCallback(async (): Promise<void> => {
    const result = await window.api.system.openLicenses()
    if (!result.ok) showToast(result.error.message)
  }, [showToast])

  return (
    <div
      className="bounded-workspace mx-auto flex w-full max-w-[1200px] flex-col gap-2.5"
      data-testid="about-screen"
    >
      <div className="grid min-h-0 flex-1 grid-cols-[290px_1fr] gap-4 @min-[1024px]:grid-cols-[340px_1fr]">
        <AboutProfileCard
          onEmail={() => void open(ABOUT_LINKS.email)}
          onGithub={() => void open(ABOUT_LINKS.github)}
          onLinkedin={() => void open(ABOUT_LINKS.linkedin)}
        />
        <AboutDetails onGithub={() => void open(ABOUT_LINKS.github)} />
      </div>
      <AboutConnect
        onCopyEmail={() => void copyEmail()}
        onDonate={() => void open(ABOUT_LINKS.donate)}
        onGithub={() => void open(ABOUT_LINKS.github)}
        onLinkedin={() => void open(ABOUT_LINKS.linkedin)}
      />
      <footer className="text-fg-muted flex shrink-0 flex-col items-center gap-0.5 text-center text-[9px] leading-3">
        <span>{COPY.about.footer(version)}</span>
        <span>{COPY.about.legal}</span>
        <button
          className="hover:text-accent focus-visible:text-accent underline-offset-2 hover:underline"
          onClick={() => void openLicenses()}
          type="button"
        >
          {COPY.about.licenses}
        </button>
      </footer>
    </div>
  )
}
