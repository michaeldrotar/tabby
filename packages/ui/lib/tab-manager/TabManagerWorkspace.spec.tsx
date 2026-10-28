// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, expect, it } from 'vitest'
import { TabManagerWorkspace } from './TabManagerWorkspace'

afterEach(cleanup)

const Workspace = () => {
  const [value, onChange] = useState('tabs')
  return (
    <TabManagerWorkspace
      value={value}
      onChange={onChange}
      panes={[
        { id: 'tabs', label: 'Tabs and windows', content: <p>Open tabs</p> },
        {
          id: 'recently-closed',
          label: 'Recently closed',
          content: <p>Closed items</p>,
        },
        {
          id: 'additional',
          label: 'Another view',
          content: <p>Additional pane</p>,
        },
      ]}
    />
  )
}

it('replaces the full content area when choosing any registered pane', () => {
  render(<Workspace />)
  const view = screen.getByRole('combobox', { name: 'Tab manager view' })
  fireEvent.change(view, { target: { value: 'recently-closed' } })
  expect(screen.getByText('Closed items')).toBeVisible()
  expect(screen.queryByText('Open tabs')).not.toBeInTheDocument()
  fireEvent.change(view, { target: { value: 'additional' } })
  expect(screen.getByText('Additional pane')).toBeVisible()
  expect(screen.queryByText('Closed items')).not.toBeInTheDocument()
})
