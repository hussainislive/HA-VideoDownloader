import { Button } from '@renderer/components/ui/Button'
import { Card } from '@renderer/components/ui/Card'
import { COPY } from '@renderer/lib/copy'
import { Code2, ExternalLink, GitFork, UserRound } from 'lucide-react'

interface AboutDetailsProps {
  onGithub: () => void
}

export function AboutDetails({ onGithub }: AboutDetailsProps): React.JSX.Element {
  return (
    <div className="grid min-h-0 grid-rows-[1fr_1fr_auto] gap-2.5">
      <Card className="flex min-h-0 flex-col justify-center p-3.5" variant="solid">
        <Heading icon={UserRound} label={COPY.about.aboutMe} />
        <p className="text-fg-body mt-1.5 text-[12px] leading-[1.45]">{COPY.about.bio}</p>
      </Card>
      <Card className="flex min-h-0 flex-col justify-center p-3.5" variant="solid">
        <Heading icon={Code2} label={COPY.about.expertiseTitle} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COPY.about.expertise.map((skill) => (
            <span
              className="border-line bg-surface-elevated text-fg-body rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
              key={skill}
            >
              {skill}
            </span>
          ))}
        </div>
      </Card>
      <Card className="flex items-center gap-3 p-3" variant="elevated">
        <span className="bg-accent-soft text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
          <GitFork aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-fg-heading text-xs font-semibold">{COPY.about.freeTitle}</h2>
          <p className="text-fg-body text-[10px]">{COPY.about.freeDescription}</p>
        </div>
        <Button onClick={onGithub} size="sm" variant="secondary">
          {COPY.about.viewGithub} <ExternalLink aria-hidden="true" className="size-3" />
        </Button>
      </Card>
    </div>
  )
}

function Heading({
  icon: Icon,
  label,
}: {
  icon: typeof UserRound
  label: string
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <Icon aria-hidden="true" className="text-accent size-3.5" />
      <h2 className="text-fg-heading text-[11px] font-bold tracking-wider uppercase">{label}</h2>
    </div>
  )
}
