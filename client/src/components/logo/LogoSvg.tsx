export function LogoSvg({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue rounded square background */}
      <rect width="32" height="32" rx="7" fill="#2563EB" />
      {/* Stylized white "T" */}
      <path
        d="M8 10h16M16 10v14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TaoLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ""}`}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 10h16M16 10v14"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {/* Text */}
      <div>
        <h1 className="text-sm font-bold leading-tight tracking-tight">TAO</h1>
        <p className="text-[10px] leading-tight text-blue-200">TE ACCOUNTING OFFICE</p>
      </div>
    </div>
  );
}
