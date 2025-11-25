export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
}

interface TmdbResponse {
  results: TmdbMovie[];
}

const TMDB_API_URL = 'https://api.themoviedb.org/3';

export async function fetchMoviesByQuery(query: string): Promise<TmdbMovie[]> {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error('TMDB_ACCESS_TOKEN is not set in .env.local');
  }

  const res = await fetch(
    `${TMDB_API_URL}/discover/movie?with_genres=16,12,10751&certification_country=US&certification.lte=G&language=en-US&page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch movies from TMDB: ${res.status} ${res.statusText}`);
  }

  const data: TmdbResponse = await res.json();
  return data.results ?? [];
}
