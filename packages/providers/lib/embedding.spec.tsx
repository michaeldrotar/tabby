import {
  OmnibarExperience,
  OptionsExperience,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'
import { MemoryTabbyProvider } from './MemoryTabbyProvider'

it('renders all three products with complete memory defaults without browser globals', () => {
  expect(typeof window).toBe('undefined')
  expect(typeof chrome).toBe('undefined')
  const markup = renderToString(
    <MemoryTabbyProvider scene="single-window">
      <TabbySurface inputMode="static">
        <TabManagerExperience />
        <OmnibarExperience onDismiss={() => {}} />
        <OptionsExperience />
      </TabbySurface>
    </MemoryTabbyProvider>,
  )
  expect(markup).toContain('Tabby')
  expect(markup).toContain('combobox')
  expect(markup).toContain('radio')
})
