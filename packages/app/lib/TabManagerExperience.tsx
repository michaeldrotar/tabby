import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import { useTabbyResources } from './TabbyProvider'
import {
  createTabManagerController,
  projectTabManager,
} from './tabManagerModel'
import type { TabManagerController } from './tabManagerModel'

export const TabManagerExperience = ({
  controller: supplied,
}: {
  controller?: TabManagerController
}) => {
  const resources = useTabbyResources()
  const { backend, view, environment, preferences, host } = resources
  const snapshot = useSyncExternalStore(
    backend.subscribe,
    backend.getSnapshot,
    backend.getSnapshot,
  )
  const state = useStore(view)
  const controller = useMemo(
    () =>
      supplied ??
      createTabManagerController({
        backend,
        view,
        environment,
        preferences,
        host,
      }),
    [supplied, backend, view, environment, preferences, host],
  )
  useEffect(() => {
    controller.reconcile()
  }, [controller, snapshot])
  useEffect(() => () => controller.cancel(), [controller])
  const model = projectTabManager(snapshot, state, environment.now())
  return <TabManager model={model} onIntent={controller.dispatch} />
}
