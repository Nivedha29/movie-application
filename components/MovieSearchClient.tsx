'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Input, Button, Spin, Alert, Typography, Space, Tag, Pagination } from 'antd';
import debounce from 'lodash/debounce';
import styles from './MovieSearchClient.module.css';

const { Title } = Typography;

type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  genre_ids?: number[];
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';
const TMDB_PAGE_SIZE = 20; // TMDB default

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
  const [genresMap, setGenresMap] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  const isOnline = useOnlineStatus();

  // 🔹 Fetch movies (popular or search) for a given query + page
  const fetchMovies = useCallback(
    async (searchValue: string, page: number) => {
      if (isOnline === false) {
        setError(
          'You appear to be offline. Please check your internet connection and try again.',
        );
        return;
      }

      const trimmed = searchValue.trim();

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          language: 'en-US',
          page: String(page),
        });

        let endpoint = '/movie/popular';

        if (trimmed) {
          endpoint = '/search/movie';
          params.set('query', trimmed);
          params.set('include_adult', 'false');
        }

        const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${params.toString()}`, {
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
        setTotalResults(data.total_results ?? data.results?.length ?? 0);
        setCurrentPage(page);
      } catch (err: any) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setError('Network connection lost. Please reconnect and try again.');
        } else {
          setError(err?.message || 'Something went wrong while fetching movies.');
        }
      } finally {
        setLoading(false);
      }
    },
    [isOnline],
  );

  // 🔹 Load list of genres once
  const loadGenres = useCallback(async () => {
    try {
      const res = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en-US`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN ?? ''}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const map: Record<number, string> = {};
      (data.genres ?? []).forEach((g: { id: number; name: string }) => {
        map[g.id] = g.name;
      });
      setGenresMap(map);
    } catch (err) {
      console.error('Failed to load genres', err);
    }
  }, []);

  // 🔹 Initial load: popular movies + genres
  useEffect(() => {
    if (isOnline !== false) {
      loadGenres();
      fetchMovies('', 1);
    }
  }, [isOnline, loadGenres, fetchMovies]);

  // 🔹 Debounced search when user types
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        // Always reset to page 1 when query changes
        fetchMovies(value, 1);
      }, 500),
    [fetchMovies],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 🔹 Handle text input change → auto search (no button required)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // 🔹 Optional: still support pressing Enter or button click

  // 🔹 Pagination change (server-side pagination)
  const handlePageChange = (page: number) => {
    fetchMovies(query, page);
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

      {/* 🔍 Auto-search input with optional button */}
      <div className={styles.searchBar}>
        <Input
          placeholder="Search for a movie"
          value={query}
          onChange={handleInputChange} // ✅ THIS enables auto search
          onPressEnter={() => {
            debouncedSearch.cancel(); // optional immediate search
            fetchMovies(query, 1);
          }}
        />
      </div>

      {/* 🌀 Loading spinner */}
      {loading && (
        <div className={styles.loader}>
          <Spin size="large" />
          <div className={styles.loaderText}>Loading movies...</div>
        </div>
      )}

      {/* 🎬 Results grid */}
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

                {/* 🎭 Genre tags */}
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

      {/* ℹ️ No results message (for search only) */}
      {!loading && !error && movies.length === 0 && query.trim() && (
        <Alert
          type="info"
          showIcon
          message="No results"
          description="No movies matched your search term. Please try another title."
          className={styles.noResults}
        />
      )}

      {/* 📄 Pagination (server-side) */}
      {!loading && totalResults > 0 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            total={totalResults}
            pageSize={TMDB_PAGE_SIZE}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
