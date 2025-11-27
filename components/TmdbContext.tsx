'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TmdbGenre, TmdbMovie, fetchGenres, rateMovieOnTmdb } from '@/lib/tmdbClient';

type RatedMap = Record<number, number>;

type TmdbContextValue = {
  isReady: boolean;
  genres: TmdbGenre[];
  ratedMap: RatedMap;
  ratedMovies: TmdbMovie[]; // 👈 for the Rated tab
  rateMovie: (movie: TmdbMovie, rating: number) => Promise<void>;
};

const TmdbContext = createContext<TmdbContextValue | undefined>(undefined);

export const TmdbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [genres, setGenres] = useState<TmdbGenre[]>([]);
  const [ratedMap, setRatedMap] = useState<RatedMap>({});
  const [ratedMovies, setRatedMovies] = useState<TmdbMovie[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const g = await fetchGenres();
        setGenres(g);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[TmdbContext] failed to load genres', err);
      } finally {
        setIsReady(true);
      }
    };

    void init();
  }, []);

  const rateMovie = async (movie: TmdbMovie, rating: number) => {
    // update local state for UI
    setRatedMap((prev) => ({ ...prev, [movie.id]: rating }));
    setRatedMovies((prev) => {
      const existing = prev.find((m) => m.id === movie.id);
      if (existing) {
        return prev.map((m) => (m.id === movie.id ? { ...m } : m));
      }
      return [...prev, movie];
    });

    // best-effort push to TMDB (ignores errors)
    await rateMovieOnTmdb(movie.id, rating);
  };

  return (
    <TmdbContext.Provider value={{ isReady, genres, ratedMap, ratedMovies, rateMovie }}>
      {children}
    </TmdbContext.Provider>
  );
};

export const useTmdb = () => {
  const ctx = useContext(TmdbContext);
  if (!ctx) throw new Error('useTmdb must be used inside a TmdbProvider');
  return ctx;
};
