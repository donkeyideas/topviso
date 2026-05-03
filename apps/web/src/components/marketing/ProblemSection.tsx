export function ProblemSection() {
  return (
    <section className="border-b border-line" style={{ padding: "100px 32px" }}>
      <div
        className="mx-auto grid items-center gap-10"
        style={{ maxWidth: "1100px", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Left: stat card */}
        <div className="problem-stat-card">
          <span className="problem-pct">
            <em>40%</em>
          </span>
          <h3
            className="mb-3 font-bold leading-[1.15]"
            style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
          >
            of users now ask an AI before they ever open a store.
          </h3>
          <p className="text-paper-3" style={{ fontSize: "16px", lineHeight: "1.5" }}>
            Your next user is asking Claude or ChatGPT for the best budgeting app{" "}
            <em style={{ color: "#6dd48e" }}>right now</em>. Are you the answer?
          </p>
        </div>

        {/* Right: text */}
        <div>
          <h3
            className="mb-5 font-extrabold leading-[1.05]"
            style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
          >
            Every other tool stopped at{" "}
            <em
              className="text-accent"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              App Store
            </em>
            .
          </h3>
          <p
            className="mb-[18px] text-ink-2"
            style={{ fontSize: "17px", lineHeight: "1.55" }}
          >
            AppTweak, Sensor Tower, AppFollow — they track keywords on Apple and
            Google. That was enough in 2022.
          </p>
          <p
            className="mb-[18px] text-ink-2"
            style={{ fontSize: "17px", lineHeight: "1.55" }}
          >
            <strong className="text-ink">
              But the share of discovery happening inside LLMs has gone from 0% to
              40% in 18 months.
            </strong>{" "}
            If you&apos;re not tracking it, you don&apos;t know you&apos;re losing.
          </p>
          <p className="text-ink-2" style={{ fontSize: "17px", lineHeight: "1.55" }}>
            Top Viso is the first — and only — platform that maps every surface. All
            seven. One dashboard. Real metrics.
          </p>
        </div>
      </div>
    </section>
  );
}
