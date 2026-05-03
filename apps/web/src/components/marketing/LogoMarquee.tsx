"use client";

const surfaces = [
  { name: "App Store", italic: true },
  { name: "Play Store", italic: false },
  { name: "ChatGPT", italic: false },
  { name: "Claude", italic: true },
  { name: "Gemini", italic: false },
  { name: "Perplexity", italic: true },
  { name: "Copilot", italic: false },
];

export function LogoMarquee() {
  // Duplicate the list for seamless infinite scroll
  const doubled = [...surfaces, ...surfaces];

  return (
    <section
      className="overflow-hidden border-b border-line bg-paper"
      style={{ padding: "40px 0" }}
    >
      <div
        className="mb-7 text-center font-mono uppercase text-ink-3"
        style={{ fontSize: "11px", letterSpacing: "0.2em" }}
      >
        Track your app across{" "}
        <em
          className="text-ink"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "16px",
            letterSpacing: "0",
            textTransform: "none",
          }}
        >
          every surface
        </em>
      </div>
      <div className="marquee-track">
        {doubled.map((surface, i) => (
          <div key={`${surface.name}-${i}`} className="marquee-logo">
            {surface.italic ? <em>{surface.name}</em> : surface.name}
          </div>
        ))}
      </div>
    </section>
  );
}
