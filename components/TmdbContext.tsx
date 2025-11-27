'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from 'react';
import {
  createGuestSession,
  fetchGenres,
  fetchGuestRatedMovies,
  rateMovie as tmdbRateMovie,
  TmdbGenre,
} from '@/lib/tmdbClient';

type RatedMap = Record<number, number>; // movieId -> rating

interface TmdbContextValue {
  guestSessionId: string | null;
  genres: TmdbGenre[];
  ratedMap: RatedMap;
  isReady: boolean;
  rateMovie: (movieId: number, rating: number) => Promise<void>;
}

const TmdbContext = createContext<TmdbContextValue | undefined>(undefined);

export const useTmdb = (): TmdbContextValue => {
  const ctx = useContext(TmdbContext);
  if (!ctx) throw new Error('useTmdb must be used within <TmdbProvider>');
  return ctx;
};

export const TmdbProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [genres, setGenres] = useState<TmdbGenre[]>([]);
  const [ratedMap, setRatedMap] = useState<RatedMap>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // OPTIONAL: clear any old stored session ids so we always start fresh
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tmdb_guest_session_id');
        }

        // 1) ALWAYS create a fresh guest session on app start
        const session = await createGuestSession();
        setGuestSessionId(session);

        // 2) Fetch genres
        const genresResult = await fetchGenres();
        setGenres(genresResult);

        // 3) Fetch rated movies for this new guest session
        const { results } = await fetchGuestRatedMovies(session);
        const newRatedMap: RatedMap = {};

        results.forEach((m: any) => {
          const ratedValue = m.rating ?? m.vote_average ?? 0;
          newRatedMap[m.id] = ratedValue;
        });

        setRatedMap(newRatedMap);
      } catch (e) {
        console.error('Failed to init TMDB context', e);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  const handleRateMovie = async (movieId: number, rating: number) => {
    if (!guestSessionId) return;
    await tmdbRateMovie(movieId, rating, guestSessionId);

    // optimistic update
    setRatedMap((prev) => ({
      ...prev,
      [movieId]: rating,
    }));
  };

  const value = useMemo(
    () => ({
      guestSessionId,
      genres,
      ratedMap,
      isReady,
      rateMovie: handleRateMovie,
    }),
    [guestSessionId, genres, ratedMap, isReady],
  );

  return <TmdbContext.Provider value={value}>{children}</TmdbContext.Provider>;
};
