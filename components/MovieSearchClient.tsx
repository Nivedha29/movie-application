'use client';

import { useEffect, useState } from 'react';
import { Input, Button, Spin, Alert, Typography, Space, Tag } from 'antd';
import styles from './MovieSearchClient.module.css';

const { Title } = Typography;

type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  genre_ids?: number[]; // 🔹 add genres
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';

// Safe online-status hook (no hydration mismatch)
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return isOnline;
};

export default function MovieSearchClient() {
  const [query, setQuery] = useState<string>('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [genresMap, setGenresMap] = useState<Record<number, string>>({}); // 🔹 id → name map
  const isOnline = useOnlineStatus();

  // 🔹 Load list of genres once
  const loadGenres = async () => {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en-US`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN ?? ''}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      });

      if (!res.ok) return; // silently ignore

      const data = await res.json();
      const map: Record<number, string> = {};
      (data.genres ?? []).forEach((g: { id: number; name: string }) => {
        map[g.id] = g.name;
      });
      setGenresMap(map);
    } catch (err) {
      // we can just log it; tags are optional
      console.error('Failed to load genres', err);
    }
  };

  // 🔹 Load popular movies when the page first loads
  const loadInitialMovies = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${TMDB_BASE_URL}/movie/popular?language=en-US&page=1`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN ?? ''}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      });

      if (!res.ok) {
        throw new Error(`TMDB request failed with status ${res.status}`);
      }

      const data = await res.json();
      setMovies(data.results ?? []);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while loading popular movies.');
    } finally {
      setLoading(false);
    }
  };

  // Call both once when we know we're not offline
  useEffect(() => {
    if (isOnline !== false) {
      loadGenres();
      loadInitialMovies();
    }
  }, [isOnline]);

  const handleSearch = async () => {
    const searchValue = query.trim();
    if (!searchValue) return;

    if (isOnline === false) {
      setError(
        'You appear to be offline. Please check your internet connection and try again.',
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
          searchValue,
        )}&include_adult=false&language=en-US&page=1`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN ?? ''}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );

      if (!res.ok) {
        throw new Error(`TMDB request failed with status ${res.status}`);
      }

      const data = await res.json();
      setMovies(data.results ?? []);
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('Network connection lost. Please reconnect and try again.');
      } else {
        setError(err?.message || 'Something went wrong while fetching movies.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.title}>
        Movie Search
      </Title>

      {isOnline === false && (
        <Alert
          showIcon
          type="warning"
          message="You are offline"
          description="Some features (like search) will not work until you reconnect."
          className={styles.alert}
        />
      )}

      {error && (
        <Alert
          showIcon
          type="error"
          message="Error"
          description={error}
          className={styles.alert}
        />
      )}

      <Space.Compact className={styles.searchBar}>
        <Input
          placeholder="Search for a movie"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button type="primary" onClick={handleSearch} disabled={!query.trim() || loading}>
          Search
        </Button>
      </Space.Compact>

      {loading && (
        <div className={styles.loader}>
          <Spin size="large" />
          <div className={styles.loaderText}>Loading movies...</div>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className={styles.results}>
          {movies.map((movie) => (
            <div key={movie.id} className={styles.movieCard}>
              {movie.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  className={styles.poster}
                />
              ) : (
                <div className={styles.posterPlaceholder}>No image</div>
              )}

              <div className={styles.movieContent}>
                <h3 className={styles.movieTitle}>{movie.title}</h3>
                <p className={styles.movieDate}>{movie.release_date}</p>

                {/* 🔹 Genre tags */}
                <div className={styles.genreTags}>
                  {movie.genre_ids?.map((id) =>
                    genresMap[id] ? (
                      <Tag key={id} className={styles.genreTag}>
                        {genresMap[id]}
                      </Tag>
                    ) : null,
                  )}
                </div>

                <p className={styles.movieOverview}>{movie.overview}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && movies.length === 0 && query && (
        <Alert
          type="info"
          showIcon
          message="No results"
          description="No movies matched your search term. Please try another title."
          className={styles.noResults}
        />
      )}
    </div>
  );
}
