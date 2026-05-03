export function Hero() {
  return (
    <section className="hero-section">
      <div className="relative mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="badge-launch">
          <span className="live-dot" />
          <span>NOW LIVE · TRACKING 7 SURFACES IN REAL TIME</span>
        </div>

        <h1 className="hero-h1">
          Get found on <span className="hero-h1-serif">every surface</span>
          <br />
          your users actually search.
        </h1>

        <p className="hero-lede">
          App Store. Play Store. ChatGPT. Claude. Gemini. Perplexity. Copilot.{" "}
          <strong>
            Your users already use all seven — your ASO tool probably covers two.
          </strong>
        </p>

        <div className="mb-10 flex flex-wrap justify-center gap-[14px]">
          <a href="/signup" className="btn btn-accent btn-xl">
            Start 14-day free trial →
          </a>
          <a
            href="https://calendar.app.google/QE2nZAujsJm88HUs6"
            className="btn btn-ghost btn-xl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </a>
        </div>
      </div>

      {/* Stat strip — platform capabilities */}
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-n">7</div>
          <div className="stat-l">DISCOVERY SURFACES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>5</em>
          </div>
          <div className="stat-l">LLM ENGINES TRACKED</div>
        </div>
        <div className="stat">
          <div className="stat-n">10</div>
          <div className="stat-l">BUILT-IN MODULES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>24/7</em>
          </div>
          <div className="stat-l">REAL-TIME MONITORING</div>
        </div>
      </div>
    </section>
  );
}
