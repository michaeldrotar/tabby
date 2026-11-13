export const windowControlClass =
  'text-muted flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm hover:bg-[var(--manager-control-hover)] hover:text-foreground data-[hover=true]:bg-[var(--manager-control-hover)] data-[hover=true]:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
export const editorRowEntry = (row: Element) =>
  row.querySelector<HTMLElement>('[data-editor-done]') ??
  row.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
  row.querySelector<HTMLElement>(
    'button[aria-pressed="true"]:not(:disabled)',
  ) ??
  row.querySelector<HTMLElement>(
    'input:not([type="file"]),button:not(:disabled)',
  )
export const windowEditorInputClass =
  'mt-2 block min-h-9 w-full rounded-md border border-border bg-input px-3 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-focus'
