import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface MediaThumbProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackGradient?: string;
  fallbackText?: string;
}

export const MediaThumb: React.FC<MediaThumbProps> = ({
  src,
  alt,
  className = '',
  fallbackGradient = 'from-zinc-800 to-zinc-950',
  fallbackText,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br ${fallbackGradient} text-zinc-300 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Film className="w-6 h-6 opacity-60 mb-1" />
        {fallbackText && (
          <span className="text-[11px] font-medium opacity-75 px-2 text-center truncate max-w-full">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
