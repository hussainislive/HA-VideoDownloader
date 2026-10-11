import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { Contact, Copy, GitBranch, Heart, Mail } from 'lucide-react'

import { DEVELOPER_EMAIL } from '../about-links'

interface AboutConnectProps {
  onCopyEmail: () => void
  onDonate: () => void
  onGithub: () => void
  onLinkedin: () => void
}

export function AboutConnect({
  onCopyEmail,
  onDonate,
  onGithub,
  onLinkedin,
}: AboutConnectProps): React.JSX.Element {
  return (
    <Card className="flex shrink-0 items-center justify-between gap-3 px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <Button className="max-w-56" onClick={onCopyEmail} size="sm" variant="secondary">
          <Mail aria-hidden="true" className="text-accent size-3" />
          <span className="truncate">{DEVELOPER_EMAIL}</span>
          <Copy aria-hidden="true" className="size-3" />
        </Button>
        <Button onClick={onGithub} size="sm" variant="ghost">
          <GitBranch aria-hidden="true" className="size-3" /> {COPY.about.github}
        </Button>
        <Button onClick={onLinkedin} size="sm" variant="ghost">
          <Contact aria-hidden="true" className="size-3" /> {COPY.about.linkedin}
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right @min-[960px]:block">
          <p className="text-fg-body flex items-center justify-end gap-1 text-[10px] font-medium">
            <Heart aria-hidden="true" className="text-accent size-3" />
            {COPY.about.donatePrompt}
          </p>
          <p className="text-fg-muted text-[9px]">{COPY.about.donateNote}</p>
        </div>
        <Button onClick={onDonate} size="sm" variant="primary">
          <Heart aria-hidden="true" className="size-3" /> {COPY.about.donate}
        </Button>
      </div>
    </Card>
  )
}
