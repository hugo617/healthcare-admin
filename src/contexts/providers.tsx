'use client';
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { CommandPaletteProvider } from './command-palette';

export default function Providers({
  session,
  children
}: {
  session: any;
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider session={session}>{children}</SessionProvider>
      </ThemeProvider>
    </CommandPaletteProvider>
  );
}
