export function ChatLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="shrink-0"
      aria-label="Cookie the Cat"
    >
      <defs>
        <linearGradient id="cat-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <linearGradient id="cat-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#FFECB3" />
        </linearGradient>
        <linearGradient id="cat-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E65100" />
          <stop offset="100%" stopColor="#BF360C" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="50" cy="50" r="50" fill="#FFB300" opacity="0.1" />

      {/* Ears */}
      <polygon points="20,38 10,10 38,30" fill="url(#cat-body)" />
      <polygon points="22,34 16,18 34,30" fill="#FFCC80" />
      <polygon points="80,38 90,10 62,30" fill="url(#cat-body)" />
      <polygon points="78,34 84,18 66,30" fill="#FFCC80" />

      {/* Head */}
      <circle cx="50" cy="52" r="34" fill="url(#cat-body)" />

      {/* Forehead stripes */}
      <path d="M 42 28 Q 50 22 58 28" fill="none" stroke="url(#cat-stripe)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 36 33 Q 50 25 64 33" fill="none" stroke="url(#cat-stripe)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Face/muzzle */}
      <ellipse cx="50" cy="60" rx="20" ry="16" fill="url(#cat-belly)" />

      {/* Eyes - big and cute */}
      <ellipse cx="35" cy="48" rx="9" ry="10" fill="#FFFFFF" />
      <ellipse cx="65" cy="48" rx="9" ry="10" fill="#FFFFFF" />
      <ellipse cx="35" cy="48" rx="6" ry="7" fill="#43A047" />
      <ellipse cx="65" cy="48" rx="6" ry="7" fill="#43A047" />
      <ellipse cx="35" cy="46" rx="3" ry="4" fill="#212121" />
      <ellipse cx="65" cy="46" rx="3" ry="4" fill="#212121" />
      <circle cx="33" cy="44" r="1.5" fill="#FFFFFF" />
      <circle cx="63" cy="44" r="1.5" fill="#FFFFFF" />

      {/* Glasses — for the knowledgeable look */}
      <rect x="26" y="41" width="18" height="14" rx="4" fill="none" stroke="#E65100" strokeWidth="1.8" />
      <rect x="56" y="41" width="18" height="14" rx="4" fill="none" stroke="#E65100" strokeWidth="1.8" />
      <line x1="44" y1="48" x2="56" y2="48" stroke="#E65100" strokeWidth="1.8" />

      {/* Nose */}
      <polygon points="47,56 53,56 50,59" fill="#F48FB1" />

      {/* Mouth */}
      <path d="M 50 59 Q 46 63 43 61" fill="none" stroke="#212121" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 50 59 Q 54 63 57 61" fill="none" stroke="#212121" strokeWidth="1.2" strokeLinecap="round" />

      {/* Whiskers */}
      <line x1="22" y1="56" x2="38" y2="58" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="20" y1="62" x2="38" y2="61" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="68" x2="38" y2="64" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="78" y1="56" x2="62" y2="58" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="80" y1="62" x2="62" y2="61" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="76" y1="68" x2="62" y2="64" stroke="#212121" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* Body */}
      <path d="M 30 84 C 30 72 40 68 50 68 C 60 68 70 72 70 84 Z" fill="url(#cat-body)" />

      {/* Paws */}
      <ellipse cx="38" cy="86" rx="8" ry="5" fill="url(#cat-belly)" />
      <ellipse cx="62" cy="86" rx="8" ry="5" fill="url(#cat-belly)" />

      {/* Tail */}
      <path d="M 70 82 Q 90 78 88 60 Q 86 50 92 46" fill="none" stroke="url(#cat-stripe)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
