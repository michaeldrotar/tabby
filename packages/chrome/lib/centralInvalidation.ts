/*
  Central invalidation module

  Purpose: install chrome.* event listeners once and call invalidateQueries
  on registered QueryClient instances. Hooks should NOT register their own
  chrome listeners; they only call useQuery. The side-panel root registers
  its QueryClient here so there is a single shared set of listeners.
*/

const registeredQueryClients = new Set<unknown>();
let listenersInstalled = false;

const invalidateTabs = () => {
  if (typeof console !== 'undefined' && typeof console.count === 'function') {
    console.count('central.invalidate.tabs');
  }
  for (const qc of registeredQueryClients) {
    // qc is unknown at compile-time; assume it has invalidateQueries
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    qc.invalidateQueries({ queryKey: ['chrome.tabs.query'] });
  }
};

const invalidateWindows = () => {
  if (typeof console !== 'undefined' && typeof console.count === 'function') {
    console.count('central.invalidate.windows');
  }
  for (const qc of registeredQueryClients) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    qc.invalidateQueries({ queryKey: ['chrome.windows.getAll'] });
  }
};

const invalidateTabGroups = () => {
  if (typeof console !== 'undefined' && typeof console.count === 'function') {
    console.count('central.invalidate.tabGroups');
  }
  for (const qc of registeredQueryClients) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    qc.invalidateQueries({ queryKey: ['chrome.tabGroups.query'] });
  }
};

const installListeners = () => {
  if (listenersInstalled) return;
  listenersInstalled = true;

  // Tabs
  chrome.tabs.onCreated.addListener(invalidateTabs);
  chrome.tabs.onRemoved.addListener(invalidateTabs);
  chrome.tabs.onMoved.addListener(invalidateTabs);
  chrome.tabs.onUpdated.addListener(invalidateTabs);
  chrome.tabs.onActivated.addListener(invalidateTabs);

  // Windows
  chrome.windows.onCreated.addListener(invalidateWindows);
  chrome.windows.onRemoved.addListener(invalidateWindows);
  chrome.windows.onFocusChanged.addListener(invalidateWindows);

  // Tab groups
  chrome.tabGroups.onCreated.addListener(invalidateTabGroups);
  chrome.tabGroups.onRemoved.addListener(invalidateTabGroups);
  chrome.tabGroups.onUpdated.addListener(invalidateTabGroups);
};

const removeListeners = () => {
  if (!listenersInstalled) return;
  listenersInstalled = false;

  chrome.tabs.onCreated.removeListener(invalidateTabs);
  chrome.tabs.onRemoved.removeListener(invalidateTabs);
  chrome.tabs.onMoved.removeListener(invalidateTabs);
  chrome.tabs.onUpdated.removeListener(invalidateTabs);
  chrome.tabs.onActivated.removeListener(invalidateTabs);

  chrome.windows.onCreated.removeListener(invalidateWindows);
  chrome.windows.onRemoved.removeListener(invalidateWindows);
  chrome.windows.onFocusChanged.removeListener(invalidateWindows);

  chrome.tabGroups.onCreated.removeListener(invalidateTabGroups);
  chrome.tabGroups.onRemoved.removeListener(invalidateTabGroups);
  chrome.tabGroups.onUpdated.removeListener(invalidateTabGroups);
};

export const registerQueryClient = (qc: unknown) => {
  registeredQueryClients.add(qc);
  if (typeof console !== 'undefined' && typeof console.count === 'function') {
    console.count('central.registerQueryClient');
  }
  installListeners();
};

export const unregisterQueryClient = (qc: unknown) => {
  registeredQueryClients.delete(qc);
  if (typeof console !== 'undefined' && typeof console.count === 'function') {
    console.count('central.unregisterQueryClient');
  }
  if (registeredQueryClients.size === 0) removeListeners();
};

export const hasCentralInvalidation = () => listenersInstalled;
