import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Provider } from '../shared/components/ui/app-providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
  },
  title: {
    default: 'PlayLater',
    template: `%s - PlayLater`,
  },
  description: 'PlayLater – Your ultimate game backlog companion',
  openGraph: {
    title: 'PlayLater',
    description: 'PlayLater – Your ultimate game backlog companion',
    siteName: 'PlayLater',
    url: 'https://playlater.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
