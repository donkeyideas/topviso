export function FinalCta() {
  return (
    <section className="final-cta-section">
      <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
        <h2 className="final-cta-h2">
          Be <em>everywhere</em> users
          <br />
          are searching.
        </h2>
        <p
          className="mx-auto mb-11"
          style={{
            fontSize: "22px",
            color: "var(--color-paper-3)",
            maxWidth: "700px",
            lineHeight: "1.4",
          }}
        >
          Stop guessing and start measuring the full picture. 14-day free trial.
          No credit card. Full access to all 7 surfaces.
        </p>
        <div className="flex flex-wrap justify-center gap-[14px]">
          <a href="/signup" className="btn btn-accent btn-xl">
            Start free trial →
          </a>
          <a
            href="https://calendar.app.google/QE2nZAujsJm88HUs6"
            className="btn btn-ghost btn-xl"
            style={{
              color: "var(--color-paper)",
              border: "1px solid #3a3a36",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </a>
        </div>
        <div
          className="mt-9 font-mono"
          style={{
            fontSize: "12px",
            letterSpacing: "0.1em",
            color: "var(--color-ink-4)",
          }}
        >
          SOC 2 · GDPR · CCPA · NO CREDIT CARD REQUIRED · CANCEL ANYTIME
        </div>
      </div>
    </section>
  );
}
