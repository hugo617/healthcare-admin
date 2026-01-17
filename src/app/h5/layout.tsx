import type { Metadata, Viewport } from 'next';
import { Nunito_Sans, Varela_Round } from 'next/font/google';
import { HideDevToolsBadge } from '@/components/h5/common/HideDevTools';
import './globals.css';

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial', 'sans-serif']
});

const varelaRound = Varela_Round({
  variable: '--font-varela-round',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial', 'sans-serif']
});

export const metadata: Metadata = {
  title: 'N-Admin H5',
  description: 'Mobile version of N-Admin'
};

// Next.js 15 要求分离 viewport 导出
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false
};

export default function H5Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${nunitoSans.variable} ${varelaRound.variable} min-h-screen bg-gray-50 font-sans antialiased`}
    >
      <HideDevToolsBadge />
      {children}
    </div>
  );
}
