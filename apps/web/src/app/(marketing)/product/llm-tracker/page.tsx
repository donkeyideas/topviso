import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const engines = [
  { name: "ChatGPT", model: "GPT-4o", color: "#10a37f" },
  { name: "Claude", model: "Opus / Sonnet", color: "#d4a574" },
  { name: "Gemini", model: "1.5 Pro", color: "#4285f4" },
  { name: "Perplexity", model: "Sonar", color: "#20b2aa" },
  { name: "Copilot", model: "GPT-4 Turbo", color: "#0078d4" },
];

const features = [
  {
    title: "Daily prompt polling",
    description:
      "Every day, we send hundreds of natural-language prompts to all 5 engines and record which apps get recommended, in what order, and with what reasoning.",
  },
  {
    title: "Source citation tracking",
    description:
      "When an AI cites a blog post, a review site, or your App Store listing as a source, we capture it. See exactly which content drives AI recommendations.",
  },
  {
    title: "Prompt rank history",
    description:
      "Track your position for specific prompts over time. See if changes to your listing, content strategy, or reviews move your LLM ranking up or down.",
  },
  {
    title: "Competitor visibility",
    description:
      "See which competitors appear for the same prompts. Identify prompt gaps where competitors rank and you don\u2019t \u2014 then close them.",
  },
  {
    title: "Surface-level breakdown",
    description:
      "Results are broken down across all 7 discovery surfaces: App Store, Play Store, ChatGPT, Claude, Gemini, Perplexity, and Copilot.",
  },
  {
    title: "Alert triggers",
    description:
      "Get notified when you lose a position, when a competitor appears for your key prompts, or when a new source citation is detected.",
  },
];

export default function LlmTrackerPage() {
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
          <div className="sec-kicker">FLAGSHIP MODULE</div>
          <h2 className="sec-h2">
            Track your app across <em>every AI</em>.
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
            40% of users now ask an AI before they open the App Store. LLM
            Tracker polls ChatGPT, Claude, Gemini, Perplexity, and Copilot
            daily so you know exactly where you stand.
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
            <em>5</em>
          </div>
          <div className="stat-l">LLM ENGINES TRACKED</div>
        </div>
        <div className="stat">
          <div className="stat-n">7</div>
          <div className="stat-l">DISCOVERY SURFACES</div>
        </div>
        <div className="stat">
          <div className="stat-n">
            <em>Daily</em>
          </div>
          <div className="stat-l">POLLING FREQUENCY</div>
        </div>
        <div className="stat">
          <div className="stat-n">100%</div>
          <div className="stat-l">PROMPT COVERAGE</div>
        </div>
      </div>

      {/* Engine cards */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">5 ENGINES</div>
          <h2 className="sec-h2">
            We poll them <em>all</em>. Every day.
          </h2>
          <p
            className="mx-auto text-ink-3"
            style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
          >
            Each engine recommends different apps for the same prompt. If you
            only track one, you&apos;re blind to the rest.
          </p>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(5, 1fr)",
          }}
        >
          {engines.map((engine) => (
            <div
              key={engine.name}
              className="feature-card"
              style={{ minHeight: "auto", textAlign: "center" }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: engine.color,
                  margin: "0 auto 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "20px",
                }}
              >
                {engine.name.charAt(0)}
              </div>
              <h3
                className="mb-1 font-bold text-ink"
                style={{ fontSize: "20px", letterSpacing: "-0.02em" }}
              >
                {engine.name}
              </h3>
              <div
                className="font-mono text-ink-3"
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                }}
              >
                {engine.model}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
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
            <div className="sec-kicker">HOW IT WORKS</div>
            <h2
              className="mb-5 font-extrabold leading-[1.05]"
              style={{ fontSize: "44px", letterSpacing: "-0.03em" }}
            >
              Prompts in.{" "}
              <em
                className="text-accent"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                Rankings out
              </em>
              .
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              You define the prompts that matter to your category. &ldquo;Best
              budgeting app,&rdquo; &ldquo;meditation app for beginners,&rdquo;
              &ldquo;photo editor with AI features&rdquo; &mdash; whatever your
              users are asking.
            </p>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              <strong className="text-ink">
                Every day, we send those prompts to all 5 engines
              </strong>{" "}
              and record the results. Which app was recommended first? Second?
              Not at all? What sources did the AI cite?
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.55" }}
            >
              You get a daily scorecard of your LLM visibility &mdash; and a
              clear roadmap for improving it.
            </p>
          </div>

          {/* Sample output card */}
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
              SAMPLE · PROMPT RANKING
            </div>
            <div
              className="mb-4 font-bold"
              style={{
                fontSize: "16px",
                color: "var(--color-paper)",
              }}
            >
              &ldquo;Best budgeting app for couples&rdquo;
            </div>
            {[
              { rank: 1, engine: "ChatGPT", app: "Your App", you: true },
              { rank: 2, engine: "Claude", app: "Your App", you: true },
              { rank: 1, engine: "Gemini", app: "Competitor A", you: false },
              { rank: 3, engine: "Perplexity", app: "Your App", you: true },
              { rank: "-", engine: "Copilot", app: "Not ranked", you: false },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #2a2a28",
                  fontSize: "14px",
                }}
              >
                <span
                  className="font-mono font-bold"
                  style={{
                    width: "28px",
                    color: row.you ? "#6dd48e" : "var(--color-ink-4)",
                  }}
                >
                  #{row.rank}
                </span>
                <span
                  style={{
                    color: "var(--color-paper-3)",
                    width: "100px",
                  }}
                >
                  {row.engine}
                </span>
                <span
                  className="font-medium"
                  style={{
                    color: row.you ? "#6dd48e" : "var(--color-ink-4)",
                  }}
                >
                  {row.app}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto mb-16 text-center"
          style={{ maxWidth: "900px" }}
        >
          <div className="sec-kicker">CAPABILITIES</div>
          <h2 className="sec-h2">
            Built for <em>serious</em> LLM visibility.
          </h2>
        </div>

        <div
          className="mx-auto grid gap-5"
          style={{
            maxWidth: "1100px",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card"
              style={{ minHeight: "auto" }}
            >
              <h3
                className="mb-3 font-bold text-ink"
                style={{ fontSize: "20px", letterSpacing: "-0.02em" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-ink-3"
                style={{ fontSize: "15px", lineHeight: "1.5" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "1000px" }}>
          <h2 className="final-cta-h2">
            Stop being <em>invisible</em>
            <br />
            to AI.
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
            Start tracking your LLM visibility today. 14-day free trial. No
            credit card. All 5 engines included on every plan.
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
