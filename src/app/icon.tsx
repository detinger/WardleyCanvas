import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="#5aa7d8" />
          <line x1="7" y1="6" x2="13" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="7" y1="6" x2="23" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="13" y1="15" x2="9" y2="26" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <line x1="13" y1="15" x2="26" y2="26" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          <line x1="23" y1="12" x2="26" y2="26" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <circle cx="7" cy="6" r="3" fill="white" />
          <circle cx="13" cy="15" r="2.2" fill="white" opacity="0.9" />
          <circle cx="23" cy="12" r="2.2" fill="white" opacity="0.85" />
          <circle cx="9" cy="26" r="1.8" fill="white" opacity="0.6" />
          <circle cx="26" cy="26" r="1.8" fill="white" opacity="0.55" />
        </svg>
      </div>
    ),
    { width: 32, height: 32 },
  );
}
