const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;

if (!TMDB_ACCESS_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn(
    '[TMDB] Missing NEXT_PUBLIC_TMDB_ACCESS_TOKEN (v4 token). Set it in .env.local.',
  );
}

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

// --- single fetch helper (Bearer auth) --------------------------------------

async function tmdbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${TMDB_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN ?? ''}`,
      'Content-Type': 'application/json;charset=utf-8',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[TMDB] ${res.status} ${res.statusText}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// --- 1) (Optional) guest session, if you still want it ----------------------

export async function createGuestSession(): Promise<string> {
  const data = await tmdbFetch<{
    success: boolean;
    guest_session_id: string;
  }>('/authentication/guest_session/new');

  if (!data.success || !data.guest_session_id) {
    throw new Error('[TMDB] Failed to create guest session');
  }

  return data.guest_session_id;
}

// --- 2) Genres --------------------------------------------------------------

export async function fetchGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(
    '/genre/movie/list?language=en-US',
  );
  return data.genres ?? [];
}

// --- 3) Search & popular ----------------------------------------------------

export async function searchMovies(
  query: string,
  page = 1,
): Promise<{ results: TmdbMovie[]; total_pages: number }> {
  if (!query.trim()) {
    return { results: [], total_pages: 1 };
  }

  const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
    `/search/movie?include_adult=false&language=en-US&page=${page}&query=${encodeURIComponent(
      query,
    )}`,
  );

  return {
    results: data.results ?? [],
    total_pages: data.total_pages ?? 1,
  };
}

export async function fetchPopularMovies(
  page = 1,
): Promise<{ results: TmdbMovie[]; total_pages: number }> {
  const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
    `/movie/popular?language=en-US&page=${page}`,
  );

  return {
    results: data.results ?? [],
    total_pages: data.total_pages ?? 1,
  };
}

// --- 4) Rate a movie (best-effort send to TMDB) -----------------------------

export async function rateMovieOnTmdb(
  movieId: number,
  rating: number,
  guestSessionId?: string | null,
): Promise<void> {
  try {
    const query = guestSessionId ? `?guest_session_id=${guestSessionId}` : '';

    await tmdbFetch(`/movie/${movieId}/rating${query}`, {
      method: 'POST',
      body: JSON.stringify({ value: rating }),
    });
  } catch (err) {
    // Don’t break the UI if TMDB rejects it; just log
    // eslint-disable-next-line no-console
    console.error('[TMDB] rateMovieOnTmdb failed', err);
  }
}
