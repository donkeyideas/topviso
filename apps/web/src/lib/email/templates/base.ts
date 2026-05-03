export function wrapInBaseLayout(
  bodyHtml: string,
  preheader?: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Top Viso</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { padding: 28px 32px; border-bottom: 2px solid #1a1a1a; }
    .header-logo { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; text-decoration: none; }
    .header-tag { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 0.12em; color: #888; margin-left: 8px; vertical-align: middle; }
    .content { padding: 36px 32px; }
    .content h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 16px; color: #1a1a1a; }
    .content h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 700; margin: 24px 0 8px; color: #1a1a1a; }
    .content p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #333; }
    .content a { color: #1d3fd9; text-decoration: underline; }
    .btn { display: inline-block; padding: 12px 28px; background: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.06em; font-weight: 600; }
    .footer { padding: 24px 32px; border-top: 1px solid #e5e5e0; text-align: center; }
    .footer p { font-family: 'Courier New', monospace; font-size: 11px; color: #999; line-height: 1.5; margin: 0; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; color: #f5f5f0; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://topviso.com'}" class="header-logo">
        Top Viso <span class="header-tag">INTELLIGENCE</span>
      </a>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>Top Viso — App Store Optimization Intelligence</p>
      <p style="margin-top: 8px;">You received this email because you have an account with Top Viso.</p>
    </div>
  </div>
</body>
</html>`
}
