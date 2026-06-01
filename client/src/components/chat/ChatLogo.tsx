export function ChatLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="shrink-0"
      aria-label="AI Assistant"
    >
      <defs>
        <filter id="cl-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
        <linearGradient id="cl-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#212121" />
          <stop offset="100%" stopColor="#424242" />
        </linearGradient>
        <linearGradient id="cl-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F5F5" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill="#80CBC4" opacity="0.15" />

      <path d="M 15 100 C 15 75 30 65 50 65 C 70 65 85 75 85 100 Z" fill="url(#cl-body)" />
      <path d="M 38 100 L 50 75 L 62 100 Z" fill="#FF8A80" />

      <g filter="url(#cl-shadow)">
        <polygon points="22,35 12,8 42,22" fill="#212121" />
        <polygon points="25,32 16,14 38,23" fill="#FF8A80" />
        <polygon points="78,35 88,8 58,22" fill="#212121" />
        <polygon points="75,32 84,14 62,23" fill="#FF8A80" />
      </g>

      <ellipse cx="50" cy="48" rx="40" ry="36" fill="url(#cl-body)" />
      <path d="M 50 48 C 35 55 25 65 28 75 C 32 85 42 85 50 85 C 58 85 68 85 72 75 C 75 65 65 55 50 48 Z" fill="url(#cl-belly)" />

      <circle cx="34" cy="42" r="8" fill="#FFD54F" />
      <ellipse cx="34" cy="42" rx="2.5" ry="5.5" fill="#212121" />
      <circle cx="31" cy="39" r="2" fill="#FFFFFF" />
      <circle cx="66" cy="42" r="8" fill="#FFD54F" />
      <ellipse cx="66" cy="42" rx="2.5" ry="5.5" fill="#212121" />
      <circle cx="63" cy="39" r="2" fill="#FFFFFF" />

      <polygon points="46,58 54,58 50,63" fill="#FF8A80" />
      <line x1="50" y1="63" x2="50" y2="68" stroke="#212121" strokeWidth="1.5" />
      <path d="M 42 68 Q 50 74 50 68 Q 50 74 58 68" fill="none" stroke="#212121" strokeWidth="1.5" strokeLinecap="round" />

      <line x1="33" y1="62" x2="8" y2="57" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="69" x2="6" y2="67" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="67" y1="62" x2="92" y2="57" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="69" y1="69" x2="94" y2="67" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

      <path d="M 50 83 L 32 73 L 32 93 Z" fill="#E53935" />
      <path d="M 50 83 L 68 73 L 68 93 Z" fill="#E53935" />
      <circle cx="50" cy="83" r="5" fill="#C62828" />
    </svg>
  );
}
