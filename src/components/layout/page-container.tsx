import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function PageContainer({
  children,
  scrollable = true,
  bentoMode = false
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  bentoMode?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className='h-[calc(100dvh-52px)]'>
          <div
            className={cn('flex flex-1 p-4 md:px-6', bentoMode && 'bento-bg')}
          >
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className={cn('flex flex-1 p-4 md:px-6', bentoMode && 'bento-bg')}>
          {children}
        </div>
      )}
    </>
  );
}
