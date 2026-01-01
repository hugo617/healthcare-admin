'use client';

import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { navList } from '@/constants/router';
import { NavItem } from '@/types/nav';
import { HomeIcon } from 'lucide-react';

// 命令项类型
interface CommandAction {
  id: string;
  name: string;
  keywords?: string;
  shortcut?: string[];
  section: string;
  url: string;
  icon: React.ReactNode;
  subtitle?: string;
}

// 从路由配置生成命令动作
function generateCommandActions(): CommandAction[] {
  const actionsWithPriority: (CommandAction & { priority?: number })[] = [];

  const processNavItem = (item: NavItem, parentSection?: string) => {
    if (item.items && item.items.length > 0) {
      item.items.forEach((subItem) => {
        processNavItem(subItem, item.title);
      });
    } else if (item.url && item.url !== '#') {
      const actionId = item.url.replace(/\//g, '-').replace(/^-/, '');
      const searchConfig = item.searchConfig;

      actionsWithPriority.push({
        id: actionId,
        name: item.title,
        shortcut: searchConfig?.searchShortcut || [],
        keywords: searchConfig?.keywords || item.title,
        section: searchConfig?.searchSection || parentSection || '导航',
        priority: searchConfig?.searchPriority || 100,
        url: item.url,
        icon: item.icon ? (
          <item.icon className='h-4 w-4' />
        ) : (
          <HomeIcon className='h-4 w-4' />
        ),
        subtitle: item.description
      });
    }
  };

  navList.forEach((item) => processNavItem(item));

  actionsWithPriority.sort((a, b) => (a.priority || 100) - (b.priority || 100));

  return actionsWithPriority.map(({ priority, ...action }) => action);
}

// 默认命令动作
const defaultCommandActions = generateCommandActions();

// Context 类型
interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  actions: CommandAction[];
}

const CommandPaletteContext =
  React.createContext<CommandPaletteContextType | null>(null);

// Provider 组件
interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export function CommandPaletteProvider({
  children
}: CommandPaletteProviderProps) {
  const [open, setOpen] = React.useState(false);

  // 全局键盘快捷键监听 (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === 'Escape') {
        if (e.key === 'k') {
          e.preventDefault();
          setOpen((open) => !open);
        } else if (e.key === 'Escape' && open) {
          setOpen(false);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  const toggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      actions: defaultCommandActions
    }),
    [open, toggle]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder='搜索页面、功能... (支持拼音首字母)'
          className='placeholder:text-muted-foreground'
        />
        <CommandList>
          <CommandEmpty>没有找到结果</CommandEmpty>
          {renderCommandGroups(defaultCommandActions, setOpen)}
        </CommandList>
        <div className='text-muted-foreground border-t px-4 py-3 text-xs'>
          <div className='flex items-center justify-between'>
            <span>使用 ↑↓ 选择，Enter 确认</span>
            <span>Esc 关闭</span>
          </div>
        </div>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}

// 按分组渲染命令项
function renderCommandGroups(
  actions: CommandAction[],
  setOpen: (open: boolean) => void
) {
  const groupedActions = actions.reduce(
    (acc, action) => {
      if (!acc[action.section]) {
        acc[action.section] = [];
      }
      acc[action.section].push(action);
      return acc;
    },
    {} as Record<string, CommandAction[]>
  );

  return Object.entries(groupedActions).map(([section, sectionActions]) => (
    <CommandGroup
      key={section}
      heading={section}
      className='text-muted-foreground [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase'
    >
      {sectionActions.map((action) => (
        <CommandItem
          key={action.id}
          onSelect={() => {
            if (action.url.startsWith('http')) {
              window.open(action.url, '_blank');
            } else {
              window.location.pathname = action.url;
            }
            setOpen(false);
          }}
          className='px-4 py-3'
        >
          <div className='flex w-full items-center gap-3'>
            {action.icon && (
              <div className='text-muted-foreground flex-shrink-0'>
                {action.icon}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium'>{action.name}</div>
              {action.subtitle && (
                <div className='text-muted-foreground mt-1 text-xs'>
                  {action.subtitle}
                </div>
              )}
            </div>
            {action.shortcut && action.shortcut.length > 0 && (
              <div className='flex gap-1'>
                {action.shortcut.map((key) => (
                  <kbd
                    key={key}
                    className='bg-muted rounded border px-2 py-1 font-mono text-xs'
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            )}
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  ));
}

// Hook 用于访问命令面板
export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider'
    );
  }
  return context;
}

// 导出命令动作，供其他组件使用
export { defaultCommandActions as commandActions };
