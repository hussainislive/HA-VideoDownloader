import { EmptyState } from '@renderer/components/ui/EmptyState'
import { COPY } from '@renderer/lib/copy'
import { TriangleAlert } from 'lucide-react'
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return (
        <EmptyState
          description={COPY.errorBoundary.description}
          icon={TriangleAlert}
          title={COPY.errorBoundary.title}
        />
      )
    }
    return this.props.children
  }
}
