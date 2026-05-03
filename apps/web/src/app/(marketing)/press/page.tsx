import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const brandAssets = [
  {
    label: "Primary logo",
    description: "Circle mark + wordmark. Use on light backgrounds.",
    format: "SVG / PNG",
  },
  {
    label: "Icon only",
    description: "Circle mark without wordmark. Use at small sizes.",
    format: "SVG / PNG",
  },
  {
    label: "Wordmark only",
    description: "\"Top Viso\" typeset in our display font. Use when the mark is already present.",
    format: "SVG / PNG",
  },
];

export default function PressPage() {
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
          <div className="sec-kicker">PRESS</div>
          <h1 className="sec-h2" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            News &amp; <em>media</em>.
          </h1>
          <p
            className="mx-auto text-ink-2"
            style={{
              fontSize: "20px",
              maxWidth: "620px",
              lineHeight: "1.5",
              marginTop: "20px",
            }}
          >
            Everything you need to write about Top Viso &mdash; brand assets,
            company facts, and contact information.
          </p>
        </div>
      </section>

      {/* Company overview */}
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
              Company overview
            </h4>
            <h2
              className="mb-6 font-bold text-ink"
              style={{
                fontSize: "36px",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              The full map of app discovery.
            </h2>
            <p
              className="mb-5 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              Top Viso is the first app-store optimization platform built for the age
              of AI-driven discovery. We track app visibility across seven
              surfaces &mdash; App Store, Play Store, ChatGPT, Claude, Gemini,
              Perplexity, and Copilot &mdash; giving developers and growth teams
              the complete picture of how their apps get found.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.65" }}
            >
              Founded to bridge the gap between traditional ASO tools and the new
              reality where 40% of users ask AI before opening a store, Top Viso
              provides keyword intelligence, LLM tracking, creative testing,
              attribution, and agent-readiness scoring in a single platform.
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
                Quick facts
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  { label: "Founded", value: "2025" },
                  { label: "Category", value: "App Store Optimization / AI Discovery" },
                  { label: "Surfaces tracked", value: "7" },
                  { label: "Website", value: "topviso.com" },
                  { label: "Press contact", value: "info@donkeyideas.com" },
                ].map((fact) => (
                  <li
                    key={fact.label}
                    className="flex items-baseline justify-between border-b border-line"
                    style={{ padding: "12px 0" }}
                  >
                    <span
                      className="font-mono uppercase text-ink-3"
                      style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                    >
                      {fact.label}
                    </span>
                    <span
                      className="text-right font-semibold text-ink"
                      style={{ fontSize: "14px" }}
                    >
                      {fact.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Brand guidelines */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <div className="mb-14 text-center">
            <div className="sec-kicker">MEDIA KIT</div>
            <h2 className="sec-h2">
              Brand <em>assets</em>.
            </h2>
            <p
              className="mx-auto text-ink-3"
              style={{ fontSize: "18px", maxWidth: "580px", lineHeight: "1.45" }}
            >
              Download our logo, icon, and wordmark. Please follow the usage
              guidelines below.
            </p>
          </div>

          {/* Logo assets */}
          <div
            className="mx-auto mb-12 grid gap-5"
            style={{
              maxWidth: "1000px",
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {brandAssets.map((asset) => (
              <div
                key={asset.label}
                className="flex flex-col items-center rounded-2xl border border-line bg-white"
                style={{ padding: "40px 24px", textAlign: "center" }}
              >
                <div
                  className="mb-5 flex items-center justify-center rounded-xl"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "var(--color-paper-2)",
                    border: "1px solid var(--color-line)",
                  }}
                >
                  <div className="flex items-baseline gap-[6px]">
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        background: "var(--color-ink)",
                        borderRadius: "50%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "2.5px",
                          left: "2.5px",
                          width: "7px",
                          height: "7px",
                          background: "var(--color-accent)",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span
                      className="font-display"
                      style={{ fontSize: "18px", letterSpacing: "-0.02em" }}
                    >
                      Top Viso
                    </span>
                  </div>
                </div>
                <h4
                  className="mb-1 font-bold text-ink"
                  style={{ fontSize: "16px" }}
                >
                  {asset.label}
                </h4>
                <p
                  className="mb-3 text-ink-3"
                  style={{ fontSize: "13px", lineHeight: "1.45" }}
                >
                  {asset.description}
                </p>
                <span
                  className="font-mono text-ink-3"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    padding: "4px 10px",
                    background: "var(--color-paper-2)",
                    borderRadius: "4px",
                  }}
                >
                  {asset.format}
                </span>
              </div>
            ))}
          </div>

          {/* Brand colors */}
          <div
            className="mx-auto rounded-2xl border border-line bg-white"
            style={{ padding: "40px 44px", maxWidth: "1000px" }}
          >
            <h4
              className="mb-6 font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Brand guidelines
            </h4>
            <div
              className="grid items-center gap-8"
              style={{ gridTemplateColumns: "auto 1fr" }}
            >
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: "100px",
                  height: "100px",
                  background: "#1d3fd9",
                  borderRadius: "16px",
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: "13px",
                    color: "white",
                    letterSpacing: "0.06em",
                  }}
                >
                  #1d3fd9
                </span>
              </div>
              <div>
                <h4
                  className="mb-2 font-bold text-ink"
                  style={{ fontSize: "18px" }}
                >
                  Top Viso Blue
                </h4>
                <p
                  className="mb-3 text-ink-2"
                  style={{ fontSize: "15px", lineHeight: "1.5" }}
                >
                  Our primary brand color. Use for accent elements, links, and
                  interactive components. Pair with our warm paper background for
                  optimal contrast.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "HEX", value: "#1d3fd9" },
                    { label: "RGB", value: "29, 63, 217" },
                    { label: "HSL", value: "229, 76%, 48%" },
                  ].map((color) => (
                    <span
                      key={color.label}
                      className="font-mono text-ink-3"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.08em",
                        padding: "4px 12px",
                        background: "var(--color-paper-2)",
                        borderRadius: "4px",
                        border: "1px solid var(--color-line)",
                      }}
                    >
                      {color.label}: {color.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Press releases */}
      <section
        className="border-b border-line"
        style={{ padding: "100px 32px" }}
      >
        <div
          className="mx-auto text-center"
          style={{ maxWidth: "700px" }}
        >
          <div className="sec-kicker">PRESS RELEASES</div>
          <h2 className="sec-h2" style={{ fontSize: "48px" }}>
            No press releases <em>yet</em>.
          </h2>
          <p
            className="mx-auto mb-4 text-ink-3"
            style={{ fontSize: "18px", maxWidth: "520px", lineHeight: "1.5" }}
          >
            We are heads-down building. When we have news to share, you will find
            it here.
          </p>
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: "12px", letterSpacing: "0.08em" }}
          >
            CHECK BACK SOON
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="final-cta-section">
        <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
          <h2
            className="final-cta-h2"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Press <em>inquiries</em>.
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
            For press inquiries, interviews, or media requests, please contact us
            directly. We are happy to help with your story.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <a
              href="mailto:info@donkeyideas.com"
              className="btn btn-accent btn-xl"
            >
              info@donkeyideas.com
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
