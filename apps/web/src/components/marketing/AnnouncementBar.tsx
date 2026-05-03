export function AnnouncementBar() {
  return (
    <div className="ann-bar">
      <span className="ann-pill">NEW</span>
      <span>
        LLM Tracker now covers <strong style={{ color: "#6dd48e" }}>Copilot</strong> and{" "}
        <strong style={{ color: "#6dd48e" }}>Perplexity Pro</strong> — all 7 surfaces in one place
      </span>
      <a href="/product/llm-tracker" style={{ color: "var(--color-paper)", textDecoration: "underline" }}>
        See it live →
      </a>
    </div>
  );
}
