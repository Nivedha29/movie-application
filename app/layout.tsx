import type { Metadata } from 'next';
import './globals.css';
import { TmdbProvider } from '@/components/TmdbContext';

export const metadata: Metadata = {
  title: 'Movie Application',
  description: 'TMDB Movie Search',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TmdbProvider>{children}</TmdbProvider>
      </body>
    </html>
  );
}
