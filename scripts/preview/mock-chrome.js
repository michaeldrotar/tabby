;(() => {
  const { browser, messages, platform } = globalThis.__TABBY_PREVIEW__
  const clone = (value) => structuredClone(value)
  const event = () => {
    const listeners = new Set()
    return {
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      hasListener: (listener) => listeners.has(listener),
      emit: (...args) => listeners.forEach((listener) => listener(...args)),
    }
  }
  const events = (names) =>
    Object.fromEntries(names.map((name) => [name, event()]))
  const windows = browser.windows.map((window) => ({
    incognito: false,
    type: 'normal',
    state: 'normal',
    ...clone(window),
  }))
  const groups = clone(browser.groups ?? [])
  const tabs = browser.tabs.map((tab, index) => ({
    index: browser.tabs
      .slice(0, index)
      .filter((item) => item.windowId === tab.windowId).length,
    groupId: -1,
    active: false,
    highlighted: Boolean(tab.active),
    pinned: false,
    audible: false,
    mutedInfo: { muted: false },
    discarded: false,
    status: tab.discarded ? 'unloaded' : 'complete',
    lastAccessed: Date.now() - (index + 1) * 120000,
    ...clone(tab),
  }))
  const idSequence = (items) => {
    let id = Math.max(0, ...items.map((item) => item.id))
    return () => ++id
  }
  const nextTabId = idSequence(tabs)
  const nextWindowId = idSequence(windows)
  const nextGroupId = idSequence(groups)
  const find = (items, id) => {
    const item = items.find((candidate) => candidate.id === id)
    if (!item) throw new Error(`No sample browser item with ID ${id}.`)
    return item
  }
  const windowTabs = (windowId) =>
    tabs
      .filter((tab) => tab.windowId === windowId)
      .sort((a, b) => a.index - b.index)
  const orderTabs = (items) =>
    items.forEach((tab, index) => {
      tab.index = index
    })
  const removeEmptyGroups = () => {
    for (const group of [...groups]) {
      if (!tabs.some((tab) => tab.groupId === group.id)) {
        groups.splice(groups.indexOf(group), 1)
        api.tabGroups.onRemoved.emit(clone(group))
      }
    }
  }
  const removeTabs = async (ids, isWindowClosing = false) => {
    for (const id of [].concat(ids)) {
      const tab = find(tabs, id)
      tabs.splice(tabs.indexOf(tab), 1)
      const remaining = windowTabs(tab.windowId)
      orderTabs(remaining)
      api.tabs.onRemoved.emit(id, { windowId: tab.windowId, isWindowClosing })
      removeEmptyGroups()
      if (!isWindowClosing) {
        if (remaining.length === 0) await api.windows.remove(tab.windowId)
        else if (tab.active)
          await api.tabs.update(remaining[0].id, { active: true })
      }
    }
  }
  const storageChanged = event()
  const storageArea = (initial, name) => {
    const stored = clone(initial)
    const onChanged = event()
    const notify = (changes) => {
      onChanged.emit(clone(changes), name)
      storageChanged.emit(clone(changes), name)
    }
    return {
      onChanged,
      get: async (keys) => {
        if (keys == null) return clone(stored)
        const names =
          typeof keys === 'string'
            ? [keys]
            : Array.isArray(keys)
              ? keys
              : Object.keys(keys)
        return clone(
          Object.fromEntries(
            names.map((key) => [
              key,
              stored[key] ??
                (typeof keys === 'object' && !Array.isArray(keys)
                  ? keys[key]
                  : undefined),
            ]),
          ),
        )
      },
      set: async (values) => {
        const changes = Object.fromEntries(
          Object.entries(values).map(([key, newValue]) => [
            key,
            { oldValue: stored[key], newValue },
          ]),
        )
        Object.assign(stored, clone(values))
        notify(changes)
      },
      remove: async (keys) => {
        const changes = {}
        for (const key of [].concat(keys)) {
          changes[key] = { oldValue: stored[key] }
          delete stored[key]
        }
        notify(changes)
      },
      setAccessLevel: async () => undefined,
    }
  }
  const matches = (item, query = {}) =>
    Object.entries(query).every(([key, value]) => item[key] === value)
  const api = {
    runtime: {
      id: 'preview',
      getPlatformInfo: async () => ({ os: platform }),
      getURL: (path) =>
        path.startsWith('_favicon/')
          ? `chrome-extension://preview/${path}`
          : new URL(`/${path}`, globalThis.location.origin).href,
      sendMessage: async () => undefined,
      openOptionsPage: async () => undefined,
      onMessage: event(),
    },
    i18n: {
      getUILanguage: () => 'en',
      getMessage: (key, substitutions = []) => {
        const record = messages[key]
        if (!record) return ''
        const values = [].concat(substitutions)
        const zeroIndexed = record.message.includes('$0')
        const message = record.message.replace(/\$([a-z_]+)\$/gi, (_, name) => {
          const content =
            record.placeholders?.[name.toLowerCase()]?.content ?? ''
          return content.replace(
            /\$(\d+)/g,
            (_, index) => values[Number(index) - 1] ?? '',
          )
        })
        return message.replace(
          /\$(\d+)/g,
          (_, index) => values[Number(index) - (zeroIndexed ? 0 : 1)] ?? '',
        )
      },
    },
    storage: {
      local: storageArea(
        { 'preference-storage-key': browser.preferences ?? {} },
        'local',
      ),
      session: storageArea({}, 'session'),
      onChanged: storageChanged,
    },
    commands: { getAll: async () => [] },
    action: { openPopup: async () => undefined },
    sidePanel: { open: async () => undefined },
    bookmarks: { search: async () => [] },
    history: { search: async () => [] },
    sessions: { getRecentlyClosed: async () => [] },
    windows: {
      ...events([
        'onBoundsChanged',
        'onCreated',
        'onFocusChanged',
        'onRemoved',
      ]),
      WindowType: { NORMAL: 'normal' },
      WINDOW_ID_NONE: -1,
      getAll: async () => clone(windows),
      getCurrent: async () =>
        clone(
          windows.find((window) => window.id === browser.currentWindowId) ??
            windows[0],
        ),
      getLastFocused: async () =>
        clone(windows.find((window) => window.focused) ?? windows[0]),
      get: async (id) => clone(find(windows, id)),
      update: async (id, values) => {
        const window = find(windows, id)
        if (values.focused) {
          windows.forEach((item) => {
            item.focused = item.id === id
          })
          api.windows.onFocusChanged.emit(id)
        }
        Object.assign(window, values)
        api.windows.onBoundsChanged.emit(clone(window))
        return clone(window)
      },
      create: async (values = {}) => {
        const window = {
          id: nextWindowId(),
          focused: false,
          incognito: Boolean(values.incognito),
          type: 'normal',
          state: 'normal',
        }
        windows.push(window)
        api.windows.onCreated.emit(clone(window))
        if (values.tabId !== undefined) {
          await api.tabs.move(values.tabId, { windowId: window.id, index: -1 })
        } else {
          for (const url of [].concat(values.url ?? 'chrome://newtab')) {
            await api.tabs.create({ windowId: window.id, url })
          }
        }
        if (values.focused !== false)
          await api.windows.update(window.id, { focused: true })
        return { ...clone(window), tabs: clone(windowTabs(window.id)) }
      },
      remove: async (id) => {
        find(windows, id)
        await removeTabs(
          windowTabs(id).map((tab) => tab.id),
          true,
        )
        windows.splice(
          windows.findIndex((window) => window.id === id),
          1,
        )
        api.windows.onRemoved.emit(id)
      },
    },
    tabGroups: {
      ...events(['onCreated', 'onUpdated', 'onRemoved', 'onMoved']),
      query: async (query = {}) =>
        clone(groups.filter((group) => matches(group, query))),
      get: async (id) => clone(find(groups, id)),
      update: async (id, values) => {
        const group = Object.assign(find(groups, id), values)
        api.tabGroups.onUpdated.emit(clone(group))
        return clone(group)
      },
    },
    tabs: {
      ...events([
        'onActivated',
        'onAttached',
        'onCreated',
        'onDetached',
        'onHighlighted',
        'onMoved',
        'onRemoved',
        'onReplaced',
        'onUpdated',
      ]),
      query: async (query = {}) =>
        clone(
          tabs
            .filter((tab) => matches(tab, query))
            .sort((a, b) => a.windowId - b.windowId || a.index - b.index),
        ),
      get: async (id) => clone(find(tabs, id)),
      update: async (id, values) => {
        const tab = find(tabs, id)
        const { muted, ...changes } = values
        if (muted !== undefined) changes.mutedInfo = { muted }
        if (values.active) {
          windowTabs(tab.windowId).forEach((item) => {
            item.active = item.id === id
            item.highlighted = item.active
          })
          if (tab.discarded)
            Object.assign(changes, { discarded: false, status: 'complete' })
        }
        Object.assign(tab, changes)
        if (values.active)
          api.tabs.onActivated.emit({ tabId: id, windowId: tab.windowId })
        api.tabs.onUpdated.emit(id, clone(changes), clone(tab))
        return clone(tab)
      },
      create: async (values = {}) => {
        const windowId =
          values.windowId ?? browser.currentWindowId ?? windows[0].id
        find(windows, windowId)
        const tab = {
          id: nextTabId(),
          windowId,
          groupId: -1,
          active: false,
          highlighted: false,
          pinned: Boolean(values.pinned),
          audible: false,
          mutedInfo: { muted: false },
          discarded: false,
          status: 'complete',
          lastAccessed: Date.now(),
          title: 'New Tab',
          url: values.url ?? 'chrome://newtab',
        }
        const items = windowTabs(windowId)
        items.splice(
          values.index === undefined || values.index < 0
            ? items.length
            : values.index,
          0,
          tab,
        )
        orderTabs(items)
        tabs.push(tab)
        api.tabs.onCreated.emit(clone(tab))
        api.tabs.onUpdated.emit(tab.id, { status: 'complete' }, clone(tab))
        if (values.active !== false)
          await api.tabs.update(tab.id, { active: true })
        return clone(tab)
      },
      remove: (ids) => removeTabs(ids),
      reload: async (id) => {
        await api.tabs.update(id, { discarded: false, status: 'loading' })
        await api.tabs.update(id, { status: 'complete' })
      },
      discard: async (id) => {
        const tab = find(tabs, id)
        if (tab.active || tab.discarded) return undefined
        return api.tabs.update(id, { discarded: true, status: 'unloaded' })
      },
      duplicate: async (id) => {
        const tab = find(tabs, id)
        const duplicate = await api.tabs.create({
          windowId: tab.windowId,
          index: tab.index + 1,
          url: tab.url,
          active: false,
        })
        return api.tabs.update(duplicate.id, { title: tab.title })
      },
      move: async (ids, { windowId, index }) => {
        const moved = []
        for (const id of [].concat(ids)) {
          const tab = find(tabs, id)
          const oldWindowId = tab.windowId
          const fromIndex = tab.index
          const targetId = windowId ?? oldWindowId
          find(windows, targetId)
          const target = windowTabs(targetId).filter((item) => item.id !== id)
          const toIndex =
            index < 0 ? target.length : Math.min(index, target.length)
          tab.windowId = targetId
          target.splice(toIndex, 0, tab)
          orderTabs(target)
          if (targetId !== oldWindowId) {
            orderTabs(windowTabs(oldWindowId))
            api.tabs.onDetached.emit(id, {
              oldWindowId,
              oldPosition: fromIndex,
            })
            api.tabs.onAttached.emit(id, {
              newWindowId: targetId,
              newPosition: toIndex,
            })
            if (tab.groupId !== -1) await api.tabs.ungroup(id)
          } else {
            api.tabs.onMoved.emit(id, {
              windowId: targetId,
              fromIndex,
              toIndex,
            })
          }
          moved.push(clone(tab))
        }
        return Array.isArray(ids) ? moved : moved[0]
      },
      group: async ({ tabIds, groupId, createProperties = {} }) => {
        const ids = [].concat(tabIds)
        if (groupId === undefined) {
          const group = {
            id: nextGroupId(),
            windowId: createProperties.windowId ?? find(tabs, ids[0]).windowId,
            title: '',
            color: 'grey',
            collapsed: false,
          }
          groups.push(group)
          groupId = group.id
          api.tabGroups.onCreated.emit(clone(group))
        }
        find(groups, groupId)
        for (const id of ids) await api.tabs.update(id, { groupId })
        return groupId
      },
      ungroup: async (ids) => {
        for (const id of [].concat(ids))
          await api.tabs.update(id, { groupId: -1 })
        removeEmptyGroups()
      },
    },
  }
  globalThis.chrome = api

  if (typeof document !== 'undefined') {
    const createFaviconDataUrl = (extensionUrl) => {
      const pageUrl = new URL(extensionUrl).searchParams.get('pageUrl') ?? ''
      let hostname = ''
      try {
        hostname = new URL(pageUrl).hostname.replace(/^www\./, '')
      } catch {}

      const label = hostname[0]?.toUpperCase() ?? '?'
      const hue = Array.from(hostname).reduce(
        (hash, character) => (hash * 31 + character.charCodeAt(0)) % 360,
        0,
      )
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="hsl(${hue} 68% 45%)"/><text x="12" y="16" fill="white" font-family="Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle">${label}</text></svg>`
      return `data:image/svg+xml,${encodeURIComponent(svg)}`
    }

    new MutationObserver(() => {
      document
        .querySelectorAll('img[src^="chrome-extension://preview/_favicon/"]')
        .forEach((img) => (img.src = createFaviconDataUrl(img.src)))
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    })
  }
})()
