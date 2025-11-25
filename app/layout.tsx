import type { Metadata } from 'next';
import React from 'react';

import './globals.css';
import 'antd/dist/reset.css';

export const metadata: Metadata = {
  title: 'Movie Search – The Way Back layout',
  description: 'Movie search app using TMDB API and Ant Design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="main-root">
          <div className="main-container">{children}</div>
        </div>
      </body>
    </html>
  );
}
