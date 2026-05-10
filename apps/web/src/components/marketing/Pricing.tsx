import type { PlanTierConfig } from '@/lib/plan-config'

interface PricingProps {
  plans?: Record<'solo' | 'team' | 'enterprise', PlanTierConfig>
}

const DEFAULTS = {
  solo: { name: 'Solo', priceMonthly: 0, apps: 1, keywords: 50, seats: 1 },
  team: { name: 'Team', priceMonthly: 49, apps: 5, keywords: 500, seats: 5 },
  enterprise: { name: 'Enterprise', priceMonthly: 199, apps: 50, keywords: 5000, seats: 25 },
}

export function Pricing({ plans }: PricingProps) {
  const solo = plans?.solo ?? DEFAULTS.solo
  const team = plans?.team ?? DEFAULTS.team
  const enterprise = plans?.enterprise ?? DEFAULTS.enterprise

  const teamAnnual = team.priceMonthly * 10
  const entAnnual = enterprise.priceMonthly * 10

  return (
    <section className="mkt-section border-b border-line" style={{ padding: "100px 32px" }}>
      {/* Section header */}
      <div className="mx-auto mb-16 text-center" style={{ maxWidth: "900px" }}>
        <div className="sec-kicker">TRANSPARENT PRICING</div>
        <h2 className="sec-h2">
          Pay for <em>scale</em>, not for features.
        </h2>
        <p
          className="mkt-text-lg mx-auto text-ink-3"
          style={{ fontSize: "19px", maxWidth: "640px", lineHeight: "1.45" }}
        >
          Every plan includes all 10 modules. Every plan includes LLM tracking.
          No gatekeeping on the important stuff.
        </p>
      </div>

      {/* Pricing grid */}
      <div
        className="mkt-grid-3 mx-auto grid items-start gap-5"
        style={{ maxWidth: "1200px", gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {/* Solo */}
        <div className="price-card">
          <h3
            className="mb-2 font-bold text-ink"
            style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
          >
            {solo.name}
          </h3>
          <div className="mb-7 text-sm text-ink-3">
            For indie devs and side-projects
          </div>
          <div className="price-amt">
            {solo.priceMonthly === 0 ? 'Free' : `$${solo.priceMonthly}`}
          </div>
          <div
            className="mb-8 font-mono text-ink-3"
            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
          >
            ${solo.priceMonthly}/MO · NO CREDIT CARD
          </div>
          <ul
            className="mb-7 flex-1 list-none border-t border-line-soft pt-6"
          >
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">{solo.apps} app{solo.apps !== 1 ? 's' : ''}</strong> tracked
                across 7 surfaces
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">{solo.keywords.toLocaleString()} keywords</strong> +
                intent clusters
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">All 10 modules</strong>{" "}
                included
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                LLM tracking across 5 engines
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>{solo.seats} seat{solo.seats !== 1 ? 's' : ''}</span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>Community support</span>
            </li>
          </ul>
          <a
            href="/signup"
            className="btn btn-ink"
            style={{ justifyContent: "center" }}
          >
            Get started free
          </a>
        </div>

        {/* Team (highlighted) */}
        <div className="price-card price-card-hl">
          <div className="price-bs">RECOMMENDED</div>
          <h3
            className="mb-2 font-bold"
            style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
          >
            {team.name}
          </h3>
          <div className="mb-7 text-sm" style={{ color: "var(--color-ink-4)" }}>
            For growth teams and startups
          </div>
          <div className="price-amt">
            <em>${team.priceMonthly}</em>
            <small style={{ color: "var(--color-ink-4)" }}>/mo</small>
          </div>
          <div
            className="mb-8 font-mono"
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "var(--color-ink-4)",
            }}
          >
            OR ${teamAnnual.toLocaleString()}/YR · SAVE 17%
          </div>
          <ul
            className="mb-7 flex-1 list-none pt-6"
            style={{ borderTop: "1px solid #2a2a28" }}
          >
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>
                <strong style={{ color: "var(--color-paper)" }}>
                  Up to {team.apps} apps
                </strong>{" "}
                tracked
              </span>
            </li>
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>
                <strong style={{ color: "var(--color-paper)" }}>
                  {team.keywords.toLocaleString()} keywords
                </strong>{" "}
                + intent clusters
              </span>
            </li>
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>
                <strong style={{ color: "var(--color-paper)" }}>
                  All 10 modules
                </strong>{" "}
                included
              </span>
            </li>
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>
                <strong style={{ color: "var(--color-paper)" }}>
                  {team.seats} seats
                </strong>{" "}
                with role-based access
              </span>
            </li>
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>LLM tracking across all engines</span>
            </li>
            <li
              className="flex items-start gap-[10px]"
              style={{
                padding: "9px 0",
                fontSize: "14.5px",
                color: "var(--color-paper-3)",
              }}
            >
              <span
                className="flex-shrink-0 font-extrabold"
                style={{ color: "#6dd48e" }}
              >
                ✓
              </span>
              <span>Priority email support</span>
            </li>
          </ul>
          <a
            href="/signup"
            className="btn btn-accent"
            style={{ justifyContent: "center" }}
          >
            Start free trial →
          </a>
        </div>

        {/* Enterprise */}
        <div className="price-card">
          <h3
            className="mb-2 font-bold text-ink"
            style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
          >
            {enterprise.name}
          </h3>
          <div className="mb-7 text-sm text-ink-3">
            For agencies and large orgs
          </div>
          <div className="price-amt">
            ${enterprise.priceMonthly}<small>/mo</small>
          </div>
          <div
            className="mb-8 font-mono text-ink-3"
            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
          >
            OR ${entAnnual.toLocaleString()}/YR · SAVE 17%
          </div>
          <ul
            className="mb-7 flex-1 list-none border-t border-line-soft pt-6"
          >
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">Up to {enterprise.apps} apps</strong>{" "}
                and portfolios
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">{enterprise.keywords.toLocaleString()} keywords</strong>{" "}
                + intent clusters
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                All 10 modules{" "}
                <strong className="font-bold text-ink">
                  + priority AI generation
                </strong>
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>
                <strong className="font-bold text-ink">{enterprise.seats} seats</strong>{" "}
                with SSO + SCIM
              </span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>Dedicated CSM · priority support</span>
            </li>
            <li
              className="flex items-start gap-[10px] text-ink-2"
              style={{ padding: "9px 0", fontSize: "14.5px" }}
            >
              <span className="flex-shrink-0 font-extrabold text-accent">✓</span>
              <span>Onboarding + training included</span>
            </li>
          </ul>
          <a
            href="/signup"
            className="btn btn-ink"
            style={{ justifyContent: "center" }}
          >
            Start free trial
          </a>
        </div>
      </div>
    </section>
  );
}
