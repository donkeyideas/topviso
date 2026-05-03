import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const values = [
  {
    title: "Ship fast",
    description:
      "We bias toward action. A prototype today beats a perfect spec next month. Ship, measure, iterate.",
    icon: "S",
  },
  {
    title: "Measure everything",
    description:
      "Intuition starts the conversation. Data finishes it. We instrument everything we ship and let the numbers guide us.",
    icon: "M",
  },
  {
    title: "Think in surfaces, not silos",
    description:
      "App stores, LLMs, web search, agents — discovery is fragmented. We think across all of them, not one at a time.",
    icon: "T",
  },
  {
    title: "Default to transparency",
    description:
      "We share context widely, document decisions openly, and trust our teammates with the full picture.",
    icon: "D",
  },
  {
    title: "Own the outcome",
    description:
      "We do not hand off problems. If you see something broken, you fix it — or find the person who can and help them.",
    icon: "O",
  },
  {
    title: "Stay curious",
    description:
      "The landscape changes weekly. New models, new APIs, new surfaces. We treat every shift as an opportunity, not a disruption.",
    icon: "C",
  },
];

export default function CareersPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: "100px 32px 80px",
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "800px",
            background:
              "radial-gradient(circle, rgba(29,63,217,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="relative mx-auto"
          style={{ maxWidth: "900px", textAlign: "center" }}
        >
          <div className="sec-kicker">CAREERS</div>
          <h1 className="sec-h2" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Build the future of app{" "}
            <em>discovery</em>.
          </h1>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "640px",
              lineHeight: "1.5",
              marginTop: "20px",
            }}
          >
            We are a small, fast-moving team solving one of the biggest shifts in
            how software gets found. If that excites you, read on.
          </p>
        </div>
      </section>

      {/* Values */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <div className="mb-14 text-center">
            <div className="sec-kicker">OUR VALUES</div>
            <h2 className="sec-h2">
              How we <em>work</em>.
            </h2>
            <p
              className="mx-auto text-ink-3"
              style={{ fontSize: "18px", maxWidth: "600px", lineHeight: "1.45" }}
            >
              These are the principles that guide every decision we make, from
              product to hiring to how we run a meeting.
            </p>
          </div>

          <div
            className="mx-auto grid gap-5"
            style={{
              maxWidth: "1200px",
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {values.map((value) => (
              <div
                key={value.title}
                className="feature-card"
                style={{ minHeight: "auto" }}
              >
                <div className="feature-icon">{value.icon}</div>
                <h3
                  className="mb-3 font-bold text-ink"
                  style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
                >
                  {value.title}
                </h3>
                <p
                  className="text-ink-3"
                  style={{ fontSize: "15px", lineHeight: "1.55" }}
                >
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll work on */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto grid items-start gap-16"
          style={{ maxWidth: "1200px", gridTemplateColumns: "1fr 1fr" }}
        >
          <div>
            <h4
              className="mb-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              What you&apos;ll work on
            </h4>
            <h2
              className="mb-6 font-bold text-ink"
              style={{
                fontSize: "36px",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              Problems worth solving.
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              We are building infrastructure to track app visibility across
              seven surfaces &mdash; App Store, Play Store, ChatGPT, Claude,
              Gemini, Perplexity, and Copilot. That means polling LLM APIs at
              scale, building semantic intent clustering, designing real-time
              dashboards, and creating attribution models that actually work.
            </p>
          </div>
          <div>
            <div
              className="rounded-2xl border border-line bg-white"
              style={{ padding: "36px 32px" }}
            >
              <h4
                className="mb-6 font-mono uppercase text-ink-3"
                style={{ fontSize: "11px", letterSpacing: "0.14em" }}
              >
                Tech we use
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "TypeScript",
                  "Next.js",
                  "React",
                  "Node.js",
                  "PostgreSQL",
                  "Python",
                  "LLM APIs",
                  "Vercel",
                  "Tailwind",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-ink-2"
                    style={{
                      fontSize: "12px",
                      letterSpacing: "0.06em",
                      padding: "6px 14px",
                      background: "var(--color-paper-2)",
                      borderRadius: "6px",
                      border: "1px solid var(--color-line)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto text-center"
          style={{ maxWidth: "700px" }}
        >
          <div className="sec-kicker">OPEN POSITIONS</div>
          <h2 className="sec-h2" style={{ fontSize: "48px" }}>
            No open positions <em>right&nbsp;now</em>.
          </h2>
          <p
            className="mx-auto mb-8 text-ink-3"
            style={{ fontSize: "18px", maxWidth: "560px", lineHeight: "1.5" }}
          >
            We are not hiring for any specific role at the moment, but we are
            always looking for exceptional people.
          </p>
          <div
            className="mx-auto rounded-2xl border border-line bg-white"
            style={{ padding: "32px", maxWidth: "540px" }}
          >
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "16px", lineHeight: "1.55" }}
            >
              Send us your resume at{" "}
              <a
                href="mailto:info@donkeyideas.com"
                className="font-semibold text-accent"
                style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                info@donkeyideas.com
              </a>{" "}
              &mdash; we are always looking for exceptional people.
            </p>
            <p
              className="font-mono text-ink-3"
              style={{ fontSize: "12px", letterSpacing: "0.08em" }}
            >
              Include a link to something you&apos;ve built, shipped, or written.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
          <h2
            className="final-cta-h2"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Not ready to join? Try the <em>product</em>.
          </h2>
          <p
            className="mx-auto mb-10"
            style={{
              fontSize: "20px",
              color: "var(--color-paper-3)",
              maxWidth: "600px",
              lineHeight: "1.45",
            }}
          >
            See what we are building. 14-day free trial, no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a href="/signup" className="btn btn-accent btn-xl">
              Start free trial &rarr;
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
        </div>
      </section>

      <Footer />
    </>
  );
}
