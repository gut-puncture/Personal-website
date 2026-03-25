type IconProps = {
  className?: string;
};

function BaseIcon({
  children,
  className
}: IconProps & {
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SkillGlyph({
  id,
  className
}: {
  id: string;
  className?: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    roadmap: (
      <>
        <path d="M4 18h4l3-5h5l4-7" />
        <circle cx="4" cy="18" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
        <circle cx="20" cy="6" r="1.5" />
      </>
    ),
    brackets: (
      <>
        <path d="M8 4H5v16h3" />
        <path d="M16 4h3v16h-3" />
        <path d="M10 12h4" />
      </>
    ),
    milestones: (
      <>
        <path d="M4 18V6" />
        <path d="M4 8h7l2 3h7" />
        <circle cx="4" cy="8" r="1.4" />
        <circle cx="13" cy="11" r="1.4" />
        <circle cx="20" cy="11" r="1.4" />
      </>
    ),
    warehouse: (
      <>
        <path d="M4 8h16v10H4z" />
        <path d="M8 8v10M16 8v10M4 12h16" />
      </>
    ),
    orbits: (
      <>
        <circle cx="12" cy="12" r="2" />
        <circle cx="6" cy="8" r="1.4" />
        <circle cx="18" cy="8" r="1.4" />
        <circle cx="12" cy="18" r="1.4" />
        <path d="M7 8.7 10.5 11M17 8.7 13.5 11M12 16.6v-2.6" />
      </>
    ),
    magnet: (
      <>
        <path d="M8 6v5a4 4 0 1 0 8 0V6" />
        <path d="M8 6H5M8 9H5M16 6h3M16 9h3" />
      </>
    ),
    vectors: (
      <>
        <path d="M5 17l4-4 3 2 6-8" />
        <path d="m15 7 3 0 0 3" />
        <circle cx="5" cy="17" r="1.2" />
        <circle cx="9" cy="13" r="1.2" />
        <circle cx="12" cy="15" r="1.2" />
      </>
    ),
    cursor: (
      <>
        <path d="M6 4h8" />
        <path d="M10 4v8" />
        <path d="m14 13 4 7-3 .8-1.2-3L11 19z" />
      </>
    ),
    analytics: (
      <>
        <path d="M5 18V9M11 18V6M17 18v-4" />
        <path d="M4 18h16" />
        <path d="m5 10 6-3 6 2" />
      </>
    ),
    sheets: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="1.5" />
        <path d="M5 9h14M10 9v11M14 9v11" />
      </>
    ),
    python: (
      <>
        <path d="M9 6c0-1.1.9-2 2-2h2a3 3 0 0 1 3 3v2H9z" />
        <path d="M15 18c0 1.1-.9 2-2 2h-2a3 3 0 0 1-3-3v-2h7z" />
        <circle cx="13.5" cy="6.8" r=".8" />
        <circle cx="10.5" cy="17.2" r=".8" />
      </>
    ),
    jira: (
      <>
        <path d="M8 6h5l3 3-5 0z" />
        <path d="M11 9h5l-3 3h-5z" />
        <path d="M8 12h5l-3 3H5z" />
      </>
    ),
    confluence: (
      <>
        <path d="m7 7 4 4-4 4" />
        <path d="m17 7-4 4 4 4" />
        <path d="M10 6h4M10 18h4" />
      </>
    ),
    github: (
      <>
        <path d="M6 18V8l5-3 7 4v9" />
        <path d="M6 12h5M11 9v8" />
      </>
    ),
    aperture: (
      <>
        <path d="m12 4 3.6 2.1v4.2L12 12.4 8.4 10.3V6.1z" />
        <path d="m12 12.4 3.6 2.1v3.4L12 20l-3.6-2.1v-3.4z" />
      </>
    ),
    star: (
      <>
        <path d="m12 4 1.8 4.2L18 10l-4.2 1.8L12 16l-1.8-4.2L6 10l4.2-1.8z" />
      </>
    ),
    slides: (
      <>
        <rect x="4" y="5" width="16" height="12" rx="1.5" />
        <path d="M8 10h8M8 13h5" />
        <path d="M10 17v2M14 17v2" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="6.5" rx="6" ry="2.5" />
        <path d="M6 6.5v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-8" />
        <path d="M6 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
      </>
    ),
    tableau: (
      <>
        <circle cx="8" cy="8" r="1.2" />
        <circle cx="12" cy="8" r="1.2" />
        <circle cx="16" cy="8" r="1.2" />
        <circle cx="10" cy="12" r="1.2" />
        <circle cx="14" cy="12" r="1.2" />
        <circle cx="8" cy="16" r="1.2" />
        <circle cx="12" cy="16" r="1.2" />
        <circle cx="16" cy="16" r="1.2" />
      </>
    ),
    bars: (
      <>
        <path d="M5 18V11M10 18V8M15 18V5M20 18v-9" />
        <path d="M4 18h17" />
      </>
    ),
    rings: (
      <>
        <circle cx="8" cy="12" r="3" />
        <circle cx="15" cy="12" r="3" />
        <circle cx="11.5" cy="7.2" r="3" />
      </>
    ),
    quotes: (
      <>
        <path d="M8 8c-1.5 1-2.3 2.5-2.3 4.2V16h4.6v-4H8.8c0-1 .5-1.8 1.5-2.5z" />
        <path d="M16 8c-1.5 1-2.3 2.5-2.3 4.2V16h4.6v-4h-1.5c0-1 .5-1.8 1.5-2.5z" />
      </>
    ),
    headline: (
      <>
        <path d="M5 8h14" />
        <path d="M7 8v8M11 8v5M16 8v8M7 13h4M12 16h4" />
      </>
    ),
    arcbar: (
      <>
        <path d="M5 8h14" />
        <path d="M7 8v7M12 8c0 5 5 3 5 8M12 12h5" />
      </>
    ),
    generic: (
      <>
        <circle cx="12" cy="12" r="6" />
        <path d="M12 8v8M8 12h8" />
      </>
    )
  };

  return <BaseIcon className={className}>{icons[id] ?? icons.generic}</BaseIcon>;
}
