const APP_STORE_URL = "https://apps.apple.com/us/app/top-viso/id6768122962";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.topviso.mobile";

interface StoreBadgesProps {
  size?: "default" | "compact";
  align?: "center" | "left";
  label?: string;
}

export function StoreBadges({ size = "default", align = "center", label }: StoreBadgesProps) {
  const compact = size === "compact";
  const height = compact ? 44 : 56;
  const padX = compact ? 14 : 18;
  const subFont = compact ? 9 : 11;
  const mainFont = compact ? 14 : 18;
  const iconSize = compact ? 22 : 28;
  const gap = compact ? 8 : 10;

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap,
    height,
    padding: `0 ${padX}px`,
    background: "#000",
    color: "#fff",
    borderRadius: 8,
    border: "1px solid #1a1a1a",
    textDecoration: "none",
    transition: "transform 0.15s, border-color 0.15s",
    whiteSpace: "nowrap",
  };

  const subStyle: React.CSSProperties = {
    fontSize: subFont,
    letterSpacing: "0.04em",
    lineHeight: 1,
    color: "rgba(255,255,255,0.85)",
    fontWeight: 400,
  };

  const mainStyle: React.CSSProperties = {
    fontSize: mainFont,
    lineHeight: 1.05,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    marginTop: 2,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 10,
      }}
    >
      {label && (
        <div
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-ink-3)",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          aria-label="Download Top Viso on the App Store"
        >
          {/* Apple logo */}
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.05 12.04c-.03-2.86 2.34-4.24 2.45-4.31-1.34-1.96-3.42-2.22-4.16-2.25-1.77-.18-3.45 1.04-4.35 1.04-.9 0-2.28-1.02-3.75-.99-1.93.03-3.71 1.12-4.7 2.85-2 3.47-.51 8.6 1.44 11.42.95 1.38 2.08 2.93 3.56 2.87 1.43-.06 1.97-.92 3.7-.92 1.72 0 2.21.92 3.72.89 1.54-.03 2.51-1.4 3.45-2.79 1.08-1.6 1.53-3.15 1.56-3.23-.03-.01-2.98-1.14-3.01-4.53zm-2.85-8.32c.79-.96 1.32-2.28 1.18-3.6-1.13.05-2.5.75-3.32 1.69-.73.84-1.37 2.2-1.2 3.49 1.27.1 2.55-.64 3.34-1.58z" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={subStyle}>Download on the</span>
            <span style={mainStyle}>App Store</span>
          </div>
        </a>

        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          aria-label="Get Top Viso on Google Play"
        >
          {/* Google Play triangle */}
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="gp-blue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00C3FF" />
                <stop offset="100%" stopColor="#1A73E8" />
              </linearGradient>
              <linearGradient id="gp-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F076" />
                <stop offset="100%" stopColor="#00BD42" />
              </linearGradient>
              <linearGradient id="gp-yellow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFE000" />
                <stop offset="100%" stopColor="#FFBD00" />
              </linearGradient>
              <linearGradient id="gp-red" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF3A44" />
                <stop offset="100%" stopColor="#C31162" />
              </linearGradient>
            </defs>
            <path d="M3.6 1.4c-.4.3-.6.8-.6 1.4v18.4c0 .6.2 1.1.6 1.4l10.4-10.6L3.6 1.4z" fill="url(#gp-blue)" />
            <path d="M17.6 8.8L14 12l3.6 3.2 4.5-2.6c1.2-.7 1.2-2.5 0-3.2l-4.5-2.6z" fill="url(#gp-yellow)" />
            <path d="M3.6 22.6c.5.4 1.2.4 2 0L17.6 15.2 14 12 3.6 22.6z" fill="url(#gp-red)" />
            <path d="M5.6 1.4c-.8-.4-1.5-.4-2 0L14 12l3.6-3.2L5.6 1.4z" fill="url(#gp-green)" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={subStyle}>GET IT ON</span>
            <span style={mainStyle}>Google Play</span>
          </div>
        </a>
      </div>
    </div>
  );
}
