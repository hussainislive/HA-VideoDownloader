import { Button } from '@renderer/components/ui/Button'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { Select } from '@renderer/components/ui/Select'
import { Switch } from '@renderer/components/ui/Switch'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

describe('Button', () => {
  it('preserves its label and disables interaction while loading', () => {
    render(<Button loading>Download</Button>)
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
  })
})

describe('Switch', () => {
  it('exposes switch semantics and toggles from the keyboard', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} label="Notifications" onChange={onChange} />)
    const control = screen.getByRole('switch', { name: 'Notifications' })
    expect(control).toHaveAttribute('aria-checked', 'false')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Select', () => {
  it('selects an option with arrow and Enter keys', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        label="Quality"
        onChange={onChange}
        options={[
          { label: '1080p', value: '1080' },
          { label: '720p', value: '720' },
        ]}
        value="1080"
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Quality' })
    select.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('720')
  })
})

describe('SegmentedControl', () => {
  it('moves selection using keyboard-activated buttons', async () => {
    const user = userEvent.setup()
    function Example(): React.JSX.Element {
      const [value, setValue] = useState<'video' | 'audio'>('video')
      return (
        <SegmentedControl
          label="Media kind"
          onChange={setValue}
          options={[
            { label: 'Video', value: 'video' },
            { label: 'Audio', value: 'audio' },
          ]}
          value={value}
        />
      )
    }
    render(<Example />)
    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Audio' })).toHaveAttribute('aria-pressed', 'true')
  })
})
