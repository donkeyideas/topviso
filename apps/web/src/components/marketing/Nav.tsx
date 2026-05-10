"use client";

import { useState } from "react";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Center: Nav links (desktop) */}
        <div className="hidden gap-8 lg:flex" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <a href="/product" className="text-ink-2 text-sm font-medium hover:text-accent">Product</a>
          <a href="/customers" className="text-ink-2 text-sm font-medium hover:text-accent">Customers</a>
          <a href="/pricing" className="text-ink-2 text-sm font-medium hover:text-accent">Pricing</a>
          <a href="/changelog" className="text-ink-2 text-sm font-medium hover:text-accent">Changelog</a>
          <a href="/docs" className="text-ink-2 text-sm font-medium hover:text-accent">Docs</a>
          <a href="/blog" className="text-ink-2 text-sm font-medium hover:text-accent">Blog</a>
        </div>

        {/* Right: Auth buttons (desktop) */}
        <div className="hidden items-center gap-[10px] lg:flex" style={{ flex: '0 0 auto' }}>
          <a href="/signin" className="btn btn-ghost">Sign in</a>
          <a href="/signup" className="btn btn-accent">Start free trial →</a>
        </div>

        {/* Right: CTA + Hamburger (mobile) */}
        <div className="flex items-center gap-2 lg:hidden" style={{ flex: '0 0 auto' }}>
          <a href="/signup" className="btn btn-accent" style={{ fontSize: 13, padding: '8px 14px' }}>Start free →</a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              background: 'none', border: '1px solid var(--color-line)', borderRadius: 6,
              padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className="mobile-menu lg:hidden"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--color-paper)', borderBottom: '1px solid var(--color-line)',
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 49,
          }}
        >
          {[
            { label: 'Product', href: '/product' },
            { label: 'Customers', href: '/customers' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Changelog', href: '/changelog' },
            { label: 'Docs', href: '/docs' },
            { label: 'Blog', href: '/blog' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '12px 0', fontSize: 15, fontWeight: 500, color: 'var(--color-ink-2)',
                textDecoration: 'none', borderBottom: '1px solid var(--color-line)',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <a href="/signin" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Sign in</a>
            <a href="/signup" className="btn btn-accent" style={{ flex: 1, justifyContent: 'center' }}>Start free trial →</a>
          </div>
        </div>
      )}
    </nav>
  );
}
