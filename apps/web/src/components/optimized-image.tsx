'use client';

import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}

export function OptimizedImage({ src, alt, width, height, className = '', onClick }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 text-xs ${className}`} style={{ width, height }}>
        Нет фото
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        onClick={onClick}
        className={`object-cover w-full h-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      />
    </div>
  );
}
