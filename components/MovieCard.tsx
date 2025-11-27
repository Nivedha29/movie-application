'use client';

import React from 'react';
import Image from 'next/image';
import { Card, Tag, Rate } from 'antd';
import { useTmdb } from './TmdbContext';
import { TmdbMovie } from '@/lib/tmdbClient';

const { Meta } = Card;

interface MovieCardProps {
  movie: TmdbMovie;
}

function getRatingColor(value: number): string {
  if (value <= 3) return '#E90000'; // 0–3
  if (value <= 5) return '#E97E00'; // 3–5
  if (value <= 7) return '#E9D100'; // 5–7
  return '#66E900'; // >7
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { genres, ratedMap, rateMovie } = useTmdb();
  const userRating = ratedMap[movie.id] ?? 0;

  const movieGenres = movie.genre_ids
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[];

  const voteAverage = movie.vote_average ?? 0;
  const ratingColor = getRatingColor(voteAverage);

  const handleChange = async (value: number) => {
    await rateMovie(movie, value);
  };

  return (
    <Card
      hoverable
      style={{ position: 'relative', marginBottom: 16, height: '100%' }}
      styles={{
        body: {
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          padding: 16,
        },
      }}
    >
      {/* Rating circle */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          backgroundColor: ratingColor,
          color: '#fff',
          zIndex: 1,
        }}
      >
        {voteAverage.toFixed(1)}
      </div>

      {/* Poster */}
      <div style={{ width: 100, flexShrink: 0 }}>
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
            alt={movie.title}
            width={100}
            height={150}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 150,
              borderRadius: 4,
              background: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}
          >
            No Image
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + date + overview */}
        <Meta
          title={movie.title}
          description={
            <>
              {movie.release_date && (
                <span
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  {movie.release_date}
                </span>
              )}

              {/* Overview, clipped to a few lines so it stays inside the card */}
              {movie.overview && (
                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 14,
                    color: '#595959',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4, // show up to 4 lines
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {movie.overview}
                </p>
              )}
            </>
          }
        />

        {/* Genres */}
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          {movieGenres.map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </div>

        {/* User rating (stars) */}
        <div style={{ marginTop: 8 }}>
          <span style={{ marginRight: 8 }}>Your rating:</span>
          <Rate count={10} allowHalf value={userRating} onChange={handleChange} />
        </div>
      </div>
    </Card>
  );
};
