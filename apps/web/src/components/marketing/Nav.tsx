"use client";

export function Nav() {
  return (
    <nav className="nav-sticky">
      <div
        className="flex w-full items-center justify-between"
        style={{ maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* Left: Logo */}
        <div className="flex items-center" style={{ flex: '0 0 auto' }}>
          <a href="/" className="flex items-baseline gap-[10px]" style={{ textDecoration: 'none', color: 'inherit' }}>
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
          </a>
        </div>

        {/* Center: Nav links */}
        <div className="hidden gap-8 lg:flex" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <a href="/product" className="text-ink-2 text-sm font-medium hover:text-accent">Product</a>
          <a href="/customers" className="text-ink-2 text-sm font-medium hover:text-accent">Customers</a>
          <a href="/pricing" className="text-ink-2 text-sm font-medium hover:text-accent">Pricing</a>
          <a href="/changelog" className="text-ink-2 text-sm font-medium hover:text-accent">Changelog</a>
          <a href="/docs" className="text-ink-2 text-sm font-medium hover:text-accent">Docs</a>
          <a href="/blog" className="text-ink-2 text-sm font-medium hover:text-accent">Blog</a>
        </div>

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-[10px]" style={{ flex: '0 0 auto' }}>
          <a href="/signin" className="btn btn-ghost">Sign in</a>
          <a href="/signup" className="btn btn-accent">Start free trial →</a>
        </div>
      </div>
    </nav>
  );
}
