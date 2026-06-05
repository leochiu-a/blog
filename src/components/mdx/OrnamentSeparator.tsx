export function OrnamentSeparator() {
  return (
    <div className="flex items-center justify-center my-12 not-prose">
      <svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        className="animate-rotate-gentle text-bronze opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="10" />
          <line x1="60" y1="50" x2="90" y2="50" />
          <line x1="57.07" y1="57.07" x2="78.28" y2="78.28" />
          <line x1="50" y1="60" x2="50" y2="90" />
          <line x1="42.93" y1="57.07" x2="21.72" y2="78.28" />
          <line x1="40" y1="50" x2="10" y2="50" />
          <line x1="42.93" y1="42.93" x2="21.72" y2="21.72" />
          <line x1="50" y1="40" x2="50" y2="10" />
          <line x1="57.07" y1="42.93" x2="78.28" y2="21.72" />
        </g>
        <circle cx="50" cy="50" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
