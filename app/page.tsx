'use client';

import React, { useEffect, useState } from 'react';
import { Input, Tabs, Row, Col, Spin, Empty, Pagination } from 'antd';
import {
  searchMovies,
  fetchGuestRatedMovies,
  fetchPopularMovies,
  TmdbMovie,
} from '@/lib/tmdbClient';
import { useTmdb } from '@/components/TmdbContext';
import { MovieCard } from '@/components/MovieCard';

export default function HomePage() {
  const { guestSessionId, isReady } = useTmdb();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TmdbMovie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const [ratedMovies, setRatedMovies] = useState<TmdbMovie[]>([]);
  const [ratedLoading, setRatedLoading] = useState(false);
  const [ratedPage, setRatedPage] = useState(1);
  const [ratedTotalPages, setRatedTotalPages] = useState(1);

  // ---- SEARCH / DEFAULT LIST ----

  // generic search helper (works for both empty + non-empty query)
  const performSearch = async (query: string, page = 1) => {
    setSearchLoading(true);
    try {
      if (!query) {
        const { results, total_pages } = await fetchPopularMovies(page);
        setSearchResults(results);
        setSearchTotalPages(total_pages || 1);
      } else {
        const { results, total_pages } = await searchMovies(query, page);
        setSearchResults(results);
        setSearchTotalPages(total_pages || 1);
      }
      setSearchPage(page);
    } finally {
      setSearchLoading(false);
    }
  };

  // 1) Load default list (popular movies) on first render
  useEffect(() => {
    void performSearch('', 1);
  }, []);

  // 2) Auto search when user stops typing (debounced)
  useEffect(() => {
    const trimmed = searchTerm.trim();

    const id = setTimeout(() => {
      void performSearch(trimmed, 1); // reset to page 1 when search term changes
    }, 500);

    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSearchPageChange = (page: number) => {
    void performSearch(searchTerm.trim(), page);
  };

  // ---- RATED TAB ----

  const loadRated = async (page = 1) => {
    if (!guestSessionId) return;
    try {
      setRatedLoading(true);
      const { results, total_pages } = await fetchGuestRatedMovies(guestSessionId, page);
      setRatedMovies(results);
      setRatedTotalPages(total_pages || 1);
      setRatedPage(page);
    } finally {
      setRatedLoading(false);
    }
  };

  useEffect(() => {
    if (!guestSessionId) return;
    void loadRated(1);
  }, [guestSessionId]);

  const handleRatedPageChange = (page: number) => {
    void loadRated(page);
  };

  // ---- LOADING GUARD ----

  if (!isReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'search',
      label: 'Search',
      children: (
        <>
          <Input
            placeholder="Search for movies..."
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 24 }}
          />

          {searchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Spin size="large" />
            </div>
          ) : searchResults.length === 0 ? (
            <Empty description="No movies yet. Try searching for something." />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {searchResults.map((movie) => (
                  <Col xs={24} sm={12} key={movie.id}>
                    <MovieCard movie={movie} />
                  </Col>
                ))}
              </Row>

              {/* Pagination for search/default list */}
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Pagination
                  current={searchPage}
                  total={searchTotalPages * 20} // TMDB returns 20 items per page
                  pageSize={20}
                  showSizeChanger={false}
                  onChange={handleSearchPageChange}
                />
              </div>
            </>
          )}
        </>
      ),
    },
    {
      key: 'rated',
      label: 'Rated',
      children: (
        <>
          {ratedLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Spin size="large" />
            </div>
          ) : ratedMovies.length === 0 ? (
            <Empty description="You haven't rated any movies yet." />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {ratedMovies.map((movie) => (
                  <Col xs={24} sm={12} key={movie.id}>
                    <MovieCard movie={movie} />
                  </Col>
                ))}
              </Row>

              {/* Pagination for rated movies */}
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Pagination
                  current={ratedPage}
                  total={ratedTotalPages * 20}
                  pageSize={20}
                  showSizeChanger={false}
                  onChange={handleRatedPageChange}
                />
              </div>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Tabs defaultActiveKey="search" items={tabItems} />
    </div>
  );
}
