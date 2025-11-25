'use server';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
}

interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

const TMDB_API_URL = 'https://api.themoviedb.org/3';

export async function fetchMoviesByQuery(query: string): Promise<TmdbMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set in environment variables.');
  }

  const url = `${TMDB_API_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
    query,
  )}&include_adult=false&language=en-US&page=1`;

  const res = await fetch(url, {
    // Cache on the server for 1 hour; adjust as you like
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch movies from TMDB: ${res.statusText}`);
  }

  const data: TmdbResponse = await res.json();
  return data.results ?? [];
}
