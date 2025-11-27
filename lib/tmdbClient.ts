// lib/tmdbClient.ts
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!TMDB_ACCESS_TOKEN) {
  console.warn('Missing NEXT_PUBLIC_TMDB_ACCESS_TOKEN (v4 token). Set it in .env.local.');
}
if (!TMDB_API_KEY) {
  console.warn(
    'Missing NEXT_PUBLIC_TMDB_API_KEY (v3 key). Guest sessions & ratings need this.',
  );
}

const TMDB_HEADERS: HeadersInit = {
  ...(TMDB_ACCESS_TOKEN ? { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } : {}),
  'Content-Type': 'application/json;charset=utf-8',
};

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

// generic fetch using bearer + JSON
async function tmdbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${TMDB_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...TMDB_HEADERS,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Helper for endpoints that require `?api_key=<<v3 key>>`
 * (guest sessions & ratings).
 */
async function tmdbFetchWithApiKey<T>(path: string, options?: RequestInit): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error(
      'TMDB_API_KEY not configured. Set NEXT_PUBLIC_TMDB_API_KEY in your env.',
    );
  }

  const separator = path.includes('?') ? '&' : '?';
  const pathWithKey = `${path}${separator}api_key=${TMDB_API_KEY}`;

  return tmdbFetch<T>(pathWithKey, options);
}

// --------- 1) GUEST SESSION ---------

export async function createGuestSession(): Promise<string> {
  const data = await tmdbFetchWithApiKey<{
    success: boolean;
    guest_session_id: string;
  }>('/authentication/guest_session/new');

  return data.guest_session_id;
}

// --------- 2) GENRES ---------

export async function fetchGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(
    '/genre/movie/list?language=en-US',
  );
  return data.genres;
}

// --------- 3) SEARCH MOVIES ---------

export async function searchMovies(
  query: string,
  page = 1,
): Promise<{ results: TmdbMovie[]; total_pages: number }> {
  if (!query) {
    return { results: [], total_pages: 1 };
  }

  const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
    `/search/movie?include_adult=false&language=en-US&page=${page}&query=${encodeURIComponent(
      query,
    )}`,
  );

  return data;
}

// POPULAR MOVIES (default list) ---------
export async function fetchPopularMovies(
  page = 1,
): Promise<{ results: TmdbMovie[]; total_pages: number }> {
  const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
    `/movie/popular?language=en-US&page=${page}`,
  );
  return data;
}

// --------- 4) GUEST RATED MOVIES ---------

export async function fetchGuestRatedMovies(
  guestSessionId: string,
  page = 1,
): Promise<{ results: TmdbMovie[]; total_pages: number }> {
  if (!guestSessionId) {
    return { results: [], total_pages: 0 };
  }

  const path = `/guest_session/${guestSessionId}/rated/movies?page=${page}&sort_by=created_at.asc`;

  try {
    const data = await tmdbFetchWithApiKey<{
      results: TmdbMovie[];
      total_pages: number;
    }>(path);

    return data;
  } catch {
    // silently ignore when no rated movies exist
    return { results: [], total_pages: 0 };
  }
}

// --------- 5) RATE A MOVIE ---------

export async function rateMovie(
  movieId: number,
  rating: number,
  guestSessionId: string,
): Promise<void> {
  if (!guestSessionId) return;

  const path = `/movie/${movieId}/rating?guest_session_id=${guestSessionId}`;

  await tmdbFetchWithApiKey(path, {
    method: 'POST',
    body: JSON.stringify({ value: rating }), // 0.5–10.0
  });
}
