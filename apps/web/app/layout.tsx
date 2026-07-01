import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'theFOX',
  description: 'Production marketplace for fresh local goods'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
