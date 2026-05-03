import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const phases = [
  {
    step: "01",
    title: "Pre-launch testing",
    description:
      "Test icon variants, screenshot sets, and descriptions on synthetic user panels before anything goes live. Get statistically significant results in hours, not weeks.",
    metric: "Synthetic",
    metricLabel: "USER PANELS",
  },
  {
    step: "02",
    title: "Native store experiments",
    description:
      "Run A/B tests directly through Apple\u2019s and Google\u2019s native experimentation APIs. No SDK required. No client-side code. Pure server-side testing.",
    metric: "Native",
    metricLabel: "STORE A/B TESTS",
  },
  {
    step: "03",
    title: "Auto-rollout",
    description:
      "When a variant wins with statistical significance, Creative Lab automatically rolls it out. No manual intervention. No forgetting to check results.",
    metric: "Auto",
    metricLabel: "WINNER DEPLOYMENT",
  },
];

const testTypes = [
  {
    title: "Icon testing",
    description:
      "Test multiple icon variants against your current one. Measure tap-through rate from search results and category browsing. Find the icon that converts.",
  },
  {
    title: "Screenshot testing",
    description:
      "Test screenshot order, copy, and visual design. See which screenshot set drives the most installs from listing views. Test up to 8 variants simultaneously.",
  },
  {
    title: "Description testing",
    description:
      "Test short descriptions, feature callouts, and promotional text. Measure the impact of copy changes on conversion rate with full statistical rigour.",
  },
  {
    title: "Video preview testing",
    description:
      "Test app preview videos against static screenshots. Measure autoplay engagement and install conversion lift from video content.",
  },
  {
    title: "Localisation testing",
    description:
      "Test creative variants across different locales. What works in the US market may not work in Japan \u2014 test each locale independently.",
  },
  {
    title: "Seasonal creative",
    description:
      "Schedule creative swaps for holidays, events, or feature launches. Auto-revert to your control variant when the promotion ends.",
  },
];

export default function CreativeLabPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-line"
        style={{
          padding: "80px 32px 64px",
          textAlign: "center",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[-100px]"
          style={{
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(29,63,217,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="relative mx-auto px-8"
          style={{ maxWidth: "1100px" }}
        >
          <div className="sec-kicker">CREATIVE LAB</div>
          <h2 className="sec-h2">
            Test before you <em>ship</em>.
            <br />
            Auto-roll when you win.
          </h2>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "720px",
              lineHeight: "1.45",
              marginBottom: "40px",
            }}
          >
            Pre-launch testing on synthetic users. Native store A/B experiments.
            Automatic rollout of winning variants. Stop guessing which
            screenshot converts better.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a href="/signup" className="btn btn-accent btn-xl">
              Start free trial →
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
      </section>

      {/* Stat strip */}
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-n">
            <em>3</em>
          </div>
          <div className="stat-l">TESTING PHASES</div>
        </div>
        <div className="stat">
          <div className="stat-n">8</div>
          <div className="stat-l">SIMULTANEOUS VARIANTS</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>Auto</em>
          </div>
          <div className="stat-l">WINNER ROLLOUT</div>
        </div>
        <div className="stat">
          <div className="stat-n">0</div>
          <div className="stat-l">SDK REQUIRED</div>
        </div>
      </div>

      {/* Three-phase process */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">THE PROCESS</div>
          <h2 className="sec-h2">
            Three phases to <em>better</em> creatives.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Validate with synthetic panels, confirm with native store
            experiments, then auto-deploy the winner. Zero manual uploads.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {phases.map((phase) => (
            <div key={phase.step} className="feature-card feature-card-hl">
              <div
                className="font-mono"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  color: "var(--color-ink-4)",
                  marginBottom: "16px",
                }}
              >
                PHASE {phase.step}
              </div>
              <h3
                className="mb-3 font-bold leading-[1.15]"
                style={{ fontSize: "26px", letterSpacing: "-0.02em" }}
              >
                {phase.title}
              </h3>
              <p
                className="mb-5 flex-1 text-paper-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {phase.description}
              </p>
              <div className="feat-metric feat-metric-hl">{phase.metric}</div>
              <div className="feat-metric-label feat-metric-label-hl">
                {phase.metricLabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How synthetic testing works */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto grid items-center gap-16"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div>
            <div className="sec-kicker">SYNTHETIC TESTING</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Results in{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                hours
              </em>
              , not weeks.
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              Traditional store experiments take 7&ndash;14 days to reach
              significance. By then, you&apos;ve lost installs to a
              poorly-performing variant.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Synthetic testing uses AI-powered user panels
              </strong>{" "}
              that evaluate your creative variants in a simulated store
              environment. Get directional results in hours, then confirm with
              native experiments.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              No wasted impressions. No conversion drops during testing. No
              risk to your live listing.
            </p>
          </div>

          {/* Experiment card */}
          <div
            style={{
              background: "var(--color-ink)",
              borderRadius: "16px",
              padding: "36px 32px",
              color: "var(--color-paper)",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: "var(--color-ink-4)",
                marginBottom: "20px",
              }}
            >
              EXPERIMENT · ICON A/B TEST
            </div>
            {[
              {
                variant: "Control (current)",
                ctr: "3.2%",
                confidence: "baseline",
                winner: false,
              },
              {
                variant: "Variant A \u2014 Gradient",
                ctr: "3.8%",
                confidence: "92%",
                winner: false,
              },
              {
                variant: "Variant B \u2014 Minimal",
                ctr: "4.4%",
                confidence: "98%",
                winner: true,
              },
              {
                variant: "Variant C \u2014 Dark",
                ctr: "2.9%",
                confidence: "71%",
                winner: false,
              },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #2a2a28",
                  fontSize: "14px",
                }}
              >
                <span
                  style={{
                    color: row.winner
                      ? "#6dd48e"
                      : "var(--color-paper-3)",
                    fontWeight: row.winner ? 700 : 400,
                  }}
                >
                  {row.variant}
                  {row.winner && (
                    <span
                      className="ml-2 font-mono"
                      style={{
                        fontSize: "10px",
                        background: "#6dd48e",
                        color: "var(--color-ink)",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      WINNER
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-4">
                  <span className="font-mono" style={{ fontSize: "13px" }}>
                    {row.ctr}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "var(--color-ink-4)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {row.confidence}
                  </span>
                </div>
              </div>
            ))}
            <div
              className="mt-4 font-mono"
              style={{
                fontSize: "11px",
                color: "#6dd48e",
                letterSpacing: "0.08em",
              }}
            >
              AUTO-ROLLOUT TRIGGERED · VARIANT B DEPLOYED
            </div>
          </div>
        </div>
      </section>

      {/* Test types grid */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">TEST EVERYTHING</div>
          <h2 className="sec-h2">
            Every asset. <em>Every locale</em>.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Icons, screenshots, descriptions, videos, and localisations. If
            it&apos;s in your store listing, you can test it.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {testTypes.map((type) => (
            <div
              key={type.title}
              className="feature-card"
              style={{ minHeight: "auto" }}
            >
              <h3
                className="mb-3 font-bold text-ink"
                style={{ fontSize: "20px", letterSpacing: "-0.02em" }}
              >
                {type.title}
              </h3>
              <p
                className="text-ink-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            Stop <em>guessing</em>.
            <br />
            Start testing.
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
            Pre-launch synthetic testing. Native store experiments. Auto-rollout.
            Available on Team plans and above. 14-day free trial.
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
            QUESTIONS? EMAIL{" "}
            <a
              href="mailto:info@donkeyideas.com"
              style={{ color: "var(--color-accent)" }}
            >
              INFO@DONKEYIDEAS.COM
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
