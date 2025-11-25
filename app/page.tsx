import React from 'react';
import { Typography } from 'antd';

import { fetchMoviesByQuery } from '@/lib/tmdb';
import MovieGrid from '@/components/MovieGrid';

const { Title } = Typography;

export default async function HomePage() {
  // Server-side data fetching using async Server Component
  const movies = await fetchMoviesByQuery('return');

  return (
    <main>
      <Title level={3} className="page-title">
        Movie search (keyword: &ldquo;return&rdquo;)
      </Title>
      <MovieGrid movies={movies} />
    </main>
  );
}
