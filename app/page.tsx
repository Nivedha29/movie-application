import MovieGrid from '@/components/MovieGrid';
import { fetchMoviesByQuery } from '@/lib/tmdb';

export default async function HomePage() {
  const movies = await fetchMoviesByQuery('return');

  return (
    <main>
      <MovieGrid movies={movies} />
    </main>
  );
}
