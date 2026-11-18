import React from 'react';

export const YouTubeLogoMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 28 20" className={className} aria-hidden="true">
    <rect x="0" y="0" width="28" height="20" rx="5.5" fill="#FF0000" />
    <polygon points="11.2,5.6 19.6,10 11.2,14.4" fill="#FFFFFF" />
  </svg>
);

export const YouTubeShortsBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M17.77 10.32l-1.2-.5L17.6 9.3c1.66-.78 2.38-2.75 1.6-4.4-.77-1.66-2.75-2.38-4.4-1.6L6.23 7.31C4.57 8.08 3.85 10.05 4.62 11.7c.4.85 1.1 1.48 1.93 1.8l1.2.5-1.03.52c-1.66.77-2.38 2.75-1.6 4.4.77 1.66 2.74 2.38 4.4 1.6l8.57-4.01c1.66-.78 2.38-2.75 1.6-4.4-.4-.85-1.09-1.48-1.92-1.79z"
      fill="#FF0000"
    />
    <polygon points="10,9 15.5,12 10,15" fill="#FFFFFF" />
  </svg>
);

export const YouTubeShortsNavIcon: React.FC<{ active?: boolean; className?: string }> = ({
  active,
  className = 'w-[22px] h-[22px]',
}) =>
  active ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.77 10.32l-1.2-.5L17.6 9.3c1.66-.78 2.38-2.75 1.6-4.4-.77-1.66-2.75-2.38-4.4-1.6L6.23 7.31C4.57 8.08 3.85 10.05 4.62 11.7c.4.85 1.1 1.48 1.93 1.8l1.2.5-1.03.52c-1.66.77-2.38 2.75-1.6 4.4.77 1.66 2.74 2.38 4.4 1.6l8.57-4.01c1.66-.78 2.38-2.75 1.6-4.4-.4-.85-1.09-1.48-1.92-1.79zM10 15V9l5.5 3-5.5 3z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25z" />
    </svg>
  );

export const YouTubeHomeNavIcon: React.FC<{ active?: boolean; className?: string }> = ({
  active,
  className = 'w-[22px] h-[22px]',
}) =>
  active ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4 10.5V20a1 1 0 0 0 1 1h5v-6h4v6h5a1 1 0 0 0 1-1v-9.5L12 3.2 4 10.5z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.5L12 3.5l8 7V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  );

export const YouTubeCastIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
    <line x1="2" y1="20" x2="2.01" y2="20" />
  </svg>
);
