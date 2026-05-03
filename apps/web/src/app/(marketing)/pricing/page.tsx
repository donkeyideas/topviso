import { Nav } from "@/components/marketing/Nav";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";
import { getPlanConfig } from "@/lib/plan-config";

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes, 14 days. No credit card required. Full access to all surfaces.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes, upgrade or downgrade anytime. Changes take effect immediately.",
  },
  {
    q: "What happens after the trial?",
    a: "You'll be asked to pick a plan. No surprise charges.",
  },
  {
    q: "Do you offer discounts for startups?",
    a: "Yes. Contact us at info@donkeyideas.com for startup pricing.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards, and annual invoicing for Enterprise.",
  },
];

export default async function PricingPage() {
  const plans = await getPlanConfig();

  return (
    <>
      <Nav />
      <Pricing plans={plans} />

      {/* FAQ */}
      <section
        className="border-b border-line bg-paper"
        style={{ padding: "100px 32px" }}
      >
        <div className="mx-auto" style={{ maxWidth: "800px" }}>
          <div className="mb-16 text-center">
            <div className="sec-kicker">FAQ</div>
            <h2 className="sec-h2">
              Common <em>questions</em>
            </h2>
          </div>

          <div className="flex flex-col">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="border-b border-line"
                style={{ padding: "28px 0" }}
              >
                <h3
                  className="mb-2 font-bold text-ink"
                  style={{ fontSize: "17px", letterSpacing: "-0.01em" }}
                >
                  {faq.q}
                </h3>
                <p
                  className="text-ink-2"
                  style={{ fontSize: "15px", lineHeight: "1.55" }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-12 text-center font-mono text-ink-3"
            style={{ fontSize: "12px", letterSpacing: "0.1em" }}
          >
            MORE QUESTIONS?{" "}
            <a
              href="mailto:info@donkeyideas.com"
              className="text-accent hover:underline"
            >
              info@donkeyideas.com
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
