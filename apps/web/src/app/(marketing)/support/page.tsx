import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata = {
  title: "Support — Top Viso",
  description: "Get help with Top Viso. Contact our support team.",
};

export default function SupportPage() {
  return (
    <>
      <Nav />
      <main className="bg-paper" style={{ padding: "80px 24px 120px" }}>
        <div className="mx-auto" style={{ maxWidth: "800px" }}>
          <div className="mb-12">
            <h1
              className="font-display text-ink"
              style={{ fontSize: "40px", letterSpacing: "-0.025em", lineHeight: "1.1" }}
            >
              Support
            </h1>
            <p
              className="mt-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "12px", letterSpacing: "0.1em" }}
            >
              Help &amp; Contact
            </p>
          </div>

          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              Contact us
            </h2>
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              For any questions, bug reports, or feature requests, reach out to us at{" "}
              <a href="mailto:support@topviso.com" className="text-accent underline">
                support@topviso.com
              </a>
              . We typically respond within 24 hours on business days.
            </p>
          </section>

          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              Common questions
            </h2>
            <div className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              <p className="mb-4">
                <strong className="text-ink">How do I reset my password?</strong><br />
                Go to the sign-in page and tap &quot;Forgot password&quot; to receive a reset link via email.
              </p>
              <p className="mb-4">
                <strong className="text-ink">How do I delete my account?</strong><br />
                Visit{" "}
                <a href="/delete-account" className="text-accent underline">
                  topviso.com/delete-account
                </a>{" "}
                for step-by-step instructions.
              </p>
              <p className="mb-4">
                <strong className="text-ink">Which app stores are supported?</strong><br />
                Top Viso tracks keywords and rankings on both the Apple App Store and Google Play Store.
              </p>
              <p className="mb-4">
                <strong className="text-ink">What LLM engines do you monitor?</strong><br />
                We track recommendations across ChatGPT, Claude, Gemini, Perplexity, and Microsoft Copilot.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              Bug reports
            </h2>
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              If you encounter a bug, please email{" "}
              <a href="mailto:support@topviso.com" className="text-accent underline">
                support@topviso.com
              </a>{" "}
              with a description of the issue, the device and OS version you&apos;re using, and any
              screenshots that might help us reproduce the problem.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
