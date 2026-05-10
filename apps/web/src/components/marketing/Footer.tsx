import Link from "next/link";

const productLinks = [
  { label: "LLM Tracker", href: "/product/llm-tracker" },
  { label: "Keywords", href: "/product/keywords" },
  { label: "Creative Lab", href: "/product/creative-lab" },
  { label: "Attribution", href: "/product/attribution" },
  { label: "Reviews+", href: "/product/reviews-plus" },
  { label: "API", href: "/product/api-docs" },
];

const resourceLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Changelog", href: "/changelog" },
  { label: "Status", href: "/status" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Customers", href: "/customers" },
  { label: "Press", href: "/press" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "DPA", href: "/dpa" },
];

export function Footer() {
  return (
    <footer
      className="mkt-footer border-t border-line bg-paper"
      style={{ padding: "60px 32px 40px" }}
    >
      <div className="mx-auto" style={{ maxWidth: "1400px" }}>
        {/* Footer grid */}
        <div
          className="mkt-footer-grid mb-10 grid gap-12"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Brand column */}
          <div>
            <div className="flex items-baseline gap-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo.png" alt="Top Viso" width={20} height={20} style={{ objectFit: 'contain' }} />
              </div>
              <div
                className="font-display leading-none"
                style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
              >
                Top Viso
              </div>
            </div>
            <p
              className="mt-4 text-ink-3"
              style={{ fontSize: "13px", maxWidth: "360px", lineHeight: "1.5" }}
            >
              The full map of how your app gets found. App Store. Play Store.
              ChatGPT. Claude. Gemini. Perplexity. Copilot.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="mb-[14px] font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Product
            </h4>
            <ul className="list-none">
              {productLinks.map((link) => (
                <li key={link.label} style={{ padding: "4px 0" }}>
                  <Link
                    href={link.href}
                    className="text-ink-2 hover:text-accent"
                    style={{ fontSize: "13px" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="mb-[14px] font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Resources
            </h4>
            <ul className="list-none">
              {resourceLinks.map((link) => (
                <li key={link.label} style={{ padding: "4px 0" }}>
                  <Link
                    href={link.href}
                    className="text-ink-2 hover:text-accent"
                    style={{ fontSize: "13px" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="mb-[14px] font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Company
            </h4>
            <ul className="list-none">
              {companyLinks.map((link) => (
                <li key={link.label} style={{ padding: "4px 0" }}>
                  <Link
                    href={link.href}
                    className="text-ink-2 hover:text-accent"
                    style={{ fontSize: "13px" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="mb-[14px] font-mono uppercase text-ink-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Legal
            </h4>
            <ul className="list-none">
              {legalLinks.map((link) => (
                <li key={link.label} style={{ padding: "4px 0" }}>
                  <Link
                    href={link.href}
                    className="text-ink-2 hover:text-accent"
                    style={{ fontSize: "13px" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div
          className="flex items-center justify-between border-t border-line pt-6 font-mono text-ink-3"
          style={{ fontSize: "11px", letterSpacing: "0.1em" }}
        >
          <div>&copy; TOP VISO INC &middot; MMXXVI</div>
          <div>
            ALL SYSTEMS &middot;{" "}
            <span style={{ color: "var(--color-ok)" }}>NORMAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
