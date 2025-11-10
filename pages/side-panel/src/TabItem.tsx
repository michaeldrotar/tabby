import { cn } from '@extension/ui';

type Props = {
  tab: chrome.tabs.Tab & { favIconUrl?: string };
  isActive: boolean;
  isLight: boolean;
  refresh?: () => Promise<void> | void;
};

const TabItem = ({ tab, isActive, isLight, refresh }: Props) => {
  const isDiscarded = tab.discarded;
  const handleClick = async () => {
    if (typeof tab.windowId === 'number') {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    if (typeof tab.id === 'number') {
      await chrome.tabs.update(tab.id, { active: true });
    }

    if (refresh) await refresh();
  };

  const favicon = tab.favIconUrl ?? `chrome://favicon/${tab.url ?? ''}`;

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 truncate rounded-sm px-1 py-0.5 text-left',
        isActive
          ? isLight
            ? 'bg-blue-50 font-semibold text-blue-700'
            : 'bg-blue-900/40 font-semibold text-blue-200'
          : isLight
            ? 'hover:text-blue-600'
            : 'hover:text-blue-300',
        !isActive && isDiscarded && (isLight ? 'text-gray-400 opacity-60' : 'text-gray-500 opacity-60'),
      )}
      title={tab.url}
      onClick={handleClick}>
      <div
        className={cn(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm align-middle',
          isDiscarded && 'rounded-full border-2 border-dotted border-current',
        )}>
        <img
          src={favicon}
          alt={tab.title ?? 'fav'}
          className={cn(isDiscarded && 'h-3 w-3 rounded-full', !isDiscarded && 'h-4 w-4')}
        />
      </div>
      <span className="truncate">{tab.title}</span>
    </button>
  );
};

export default TabItem;
