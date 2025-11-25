'use client';

import React from 'react';
import Image from 'next/image';
import { Card, Tag, Typography } from 'antd';
import { format } from 'date-fns';

import type { TmdbMovie } from '@/lib/tmdb';
import { truncateText } from '@/lib/truncateText';

import Title from 'antd/es/typography/Title';
import Text from 'antd/es/typography/Text';
import Paragraph from 'antd/es/typography/Paragraph';

interface MovieGridProps {
  movies: TmdbMovie[];
}

const PLACEHOLDER_GENRES = ['Kids', 'Family'];
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';

const MovieGrid: React.FC<MovieGridProps> = ({ movies }) => {
  return (
    <div className="movie-grid">
      {movies.map((movie) => {
        const posterUrl = movie.poster_path
          ? `${POSTER_BASE_URL}${movie.poster_path}`
          : '/no-poster.png'; // ✅ local fallback

        let formattedDate = 'Unknown date';
        if (movie.release_date) {
          try {
            formattedDate = format(new Date(movie.release_date), 'MMMM d, yyyy');
          } catch {
            formattedDate = movie.release_date;
          }
        }

        return (
          <Card
            key={movie.id}
            className="movie-card"
            hoverable
            variant="outlined"
            styles={{ body: { padding: 16 } }}
          >
            <div className="movie-card-inner">
              <div className="movie-card-poster">
                <Image src={posterUrl} alt={movie.title} width={140} height={210} />
              </div>

              <div className="movie-card-content">
                <Title level={4} style={{ marginBottom: 4 }}>
                  {movie.title}
                </Title>

                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formattedDate}
                </Text>

                <div className="movie-card-tags">
                  {PLACEHOLDER_GENRES.map((genre) => (
                    <Tag key={genre}>{genre}</Tag>
                  ))}
                </div>

                <Paragraph
                  className="movie-card-overview"
                  type="secondary"
                  style={{ fontSize: 13, marginBottom: 0 }}
                >
                  {truncateText(movie.overview || '', 260)}
                </Paragraph>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MovieGrid;
