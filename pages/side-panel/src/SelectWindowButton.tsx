import { Favicon } from './Favicon';
import { useTabs } from '@extension/chrome';
import { cn } from '@extension/ui';
import { memo } from 'react';
import type { BrowserWindow } from '@extension/chrome/lib/BrowserWindow';

type SelectWindowButtonProps = {
  window: chrome.windows.Window;
  isCurrent: boolean;
  isLight: boolean;
  isSelected: boolean;
  onSelect: (browserWindow: BrowserWindow) => void;
};

const SelectWindowButton = ({
  window,
  isCurrent,
  isLight,
  isSelected,
  onSelect,
}: SelectWindowButtonProps) => {
  console.count('SelectWindowButton.render');
  const { data: tabs = [] } = useTabs({ windowId: window.id });
  return (
    <button
      key={window.id}
      type="button"
      onClick={() => onSelect(window)}
      className={cn(
        'mb-2 flex w-full flex-col items-center justify-between gap-2 rounded px-3 py-2 text-left transition hover:scale-[1.01]',
        isLight && 'border border-gray-200 bg-white text-gray-700',
        !isLight && 'border border-gray-800 bg-gray-900 text-gray-200',
        isSelected &&
          isLight &&
          'border border-blue-200 bg-blue-50 text-blue-700',
        isSelected &&
          !isLight &&
          'border border-blue-600 bg-blue-900/30 text-blue-200',
        !isSelected && isCurrent && isLight && 'border border-blue-200',
        !isSelected && isCurrent && !isLight && 'border border-blue-600',
      )}>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('font-medium')}>Window {window.id}</div>
        </div>
        <div className="text-xs text-gray-400">{tabs.length} tabs</div>
      </div>
      <div className="flex h-2 w-full justify-end gap-1 overflow-hidden">
        {tabs.map(tab => (
          <Favicon pageUrl={tab.url} size={8} />
        ))}
      </div>
    </button>
  );
};

const SelectWindowButtonMemo = memo(SelectWindowButton);

export {
  SelectWindowButtonMemo as SelectWindowButton,
  type SelectWindowButtonProps,
};
