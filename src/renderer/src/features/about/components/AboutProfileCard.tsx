import developerPhoto from '@renderer/assets/developer.jpg'
import { Badge } from '@renderer/components/ui/Badge'
import { Card } from '@renderer/components/ui/Card'
import { IconButton } from '@renderer/components/ui/IconButton'
import { COPY } from '@renderer/lib/copy'
import { Contact, GitBranch, Mail } from 'lucide-react'
import { useState } from 'react'

interface AboutProfileCardProps {
  onEmail: () => void
  onGithub: () => void
  onLinkedin: () => void
}

export function AboutProfileCard({
  onEmail,
  onGithub,
  onLinkedin,
}: AboutProfileCardProps): React.JSX.Element {
  const [photoFailed, setPhotoFailed] = useState(false)
  return (
    <Card className="relative flex min-h-0 flex-col items-center justify-between overflow-hidden p-4 text-center">
      <div className="flex flex-col items-center">
        <div className="border-accent shadow-glow-sm bg-surface-solid mb-2.5 flex size-[118px] items-center justify-center overflow-hidden rounded-full border-[3px]">
          {photoFailed ? (
            <span className="text-accent text-3xl font-bold">HA</span>
          ) : (
            <img
              alt={COPY.about.photoAlt}
              className="h-full w-full scale-[1.38] object-cover object-[center_24%]"
              decoding="async"
              height={118}
              onError={() => setPhotoFailed(true)}
              src={developerPhoto}
              width={118}
            />
          )}
        </div>
        <h1 className="text-fg-heading text-xl font-bold tracking-tight">{COPY.about.name}</h1>
        <p className="text-fg-muted mt-0.5 text-xs font-medium">{COPY.about.role}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          <Badge tone="accent">{COPY.about.experience}</Badge>
          <Badge>{COPY.about.openSourceDeveloper}</Badge>
        </div>
      </div>
      <div className="border-line-subtle mt-2 flex w-full justify-center gap-3 border-t pt-2.5">
        <IconButton label={COPY.about.sendEmail} onClick={onEmail} title={COPY.about.sendEmail}>
          <Mail aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton label={COPY.about.github} onClick={onGithub} title={COPY.about.github}>
          <GitBranch aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton label={COPY.about.linkedin} onClick={onLinkedin} title={COPY.about.linkedin}>
          <Contact aria-hidden="true" className="size-4" />
        </IconButton>
      </div>
    </Card>
  )
}
