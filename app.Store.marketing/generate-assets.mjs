import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve('C:/Users/beltr/ASO/app.Store.marketing');
const LOGO_SRC = resolve('C:/Users/beltr/Downloads/ChatGPT Image May 10, 2026, 03_50_51 PM.png');

// Create output directories
const dirs = ['Google Play', 'Apple App Store', 'App Icon'];
dirs.forEach(d => mkdirSync(join(ROOT, d), { recursive: true }));

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });

  // ========== APP ICON (512x512) ==========
  console.log('Creating App Icon...');
  // Create an HTML page that renders the logo as a 512x512 icon with rounded corners
  const iconHtml = `<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0; }
    body { width:512px; height:512px; overflow:hidden; }
    .icon { width:512px; height:512px; border-radius:112px; overflow:hidden; }
    .icon img { width:100%; height:100%; object-fit:cover; }
  </style></head><body>
    <div class="icon"><img src="file:///${LOGO_SRC.replace(/\\/g, '/')}" /></div>
  </body></html>`;
  const iconHtmlPath = join(ROOT, '_icon.html');
  writeFileSync(iconHtmlPath, iconHtml);

  const iconPage = await context.newPage();
  await iconPage.setViewportSize({ width: 512, height: 512 });
  await iconPage.goto(`file:///${iconHtmlPath.replace(/\\/g, '/')}`);
  await iconPage.waitForTimeout(1000);

  // 512x512 (Google Play & general use)
  await iconPage.screenshot({ path: join(ROOT, 'App Icon', 'icon-512.png'), clip: { x: 0, y: 0, width: 512, height: 512 } });
  console.log('  -> icon-512.png');

  // 1024x1024 (Apple App Store)
  await iconPage.close();
  const iconPage2 = await context.newPage();
  await iconPage2.setViewportSize({ width: 1024, height: 1024 });
  const iconHtml2 = iconHtml.replace(/512px/g, '1024px').replace(/112px/g, '224px');
  const iconHtmlPath2 = join(ROOT, '_icon2.html');
  writeFileSync(iconHtmlPath2, iconHtml2);
  await iconPage2.goto(`file:///${iconHtmlPath2.replace(/\\/g, '/')}`);
  await iconPage2.waitForTimeout(1000);
  await iconPage2.screenshot({ path: join(ROOT, 'App Icon', 'icon-1024.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  console.log('  -> icon-1024.png');
  await iconPage2.close();

  // ========== GOOGLE PLAY SCREENSHOTS (1080x1920) ==========
  console.log('\nGenerating Google Play screenshots...');
  const googlePage = await context.newPage();
  await googlePage.setViewportSize({ width: 1080, height: 1920 });
  await googlePage.goto(`file:///${join(ROOT, 'screenshots-google.html').replace(/\\/g, '/')}`);
  await googlePage.waitForTimeout(2000);

  // Reset zoom to 100% and hide UI chrome
  await googlePage.evaluate(() => {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.querySelectorAll('.screenshot-slide, #feature-graphic').forEach(el => {
      el.style.transform = 'none';
      el.style.margin = '0';
    });
    document.querySelectorAll('.zoom-controls, .page-title, .page-subtitle, .page-spec, .instructions, .slide-label').forEach(el => el.remove());
  });
  await googlePage.waitForTimeout(500);

  for (let i = 1; i <= 7; i++) {
    const el = await googlePage.$(`#slide-${i}`);
    if (el) {
      await el.screenshot({ path: join(ROOT, 'Google Play', `screenshot-${i}.png`) });
      console.log(`  -> screenshot-${i}.png`);
    }
  }

  // Feature Graphic (1024x500)
  const fg = await googlePage.$('#feature-graphic');
  if (fg) {
    await fg.screenshot({ path: join(ROOT, 'Google Play', 'feature-graphic.png') });
    console.log('  -> feature-graphic.png');
  }
  await googlePage.close();

  // ========== APPLE APP STORE SCREENSHOTS - iPhone (1284x2778) ==========
  console.log('\nGenerating Apple App Store iPhone screenshots...');
  const applePage = await context.newPage();
  await applePage.setViewportSize({ width: 1284, height: 2778 });
  await applePage.goto(`file:///${join(ROOT, 'screenshots-apple.html').replace(/\\/g, '/')}`);
  await applePage.waitForTimeout(2000);

  await applePage.evaluate(() => {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.querySelectorAll('.screenshot-slide').forEach(el => {
      el.style.transform = 'none';
      el.style.margin = '0';
    });
    document.querySelectorAll('.zoom-controls, .page-title, .page-subtitle, .page-spec, .instructions, .slide-label').forEach(el => el.remove());
  });
  await applePage.waitForTimeout(500);

  for (let i = 1; i <= 5; i++) {
    const el = await applePage.$(`#slide-${i}`);
    if (el) {
      await applePage.evaluate(e => window.scrollTo(0, e.offsetTop), el);
      await applePage.waitForTimeout(200);
      await applePage.screenshot({ path: join(ROOT, 'Apple App Store', `screenshot-${i}.png`) });
      console.log(`  -> screenshot-${i}.png`);
    }
  }
  await applePage.close();

  // ========== APPLE APP STORE SCREENSHOTS - iPad (2048x2732) ==========
  console.log('\nGenerating Apple App Store iPad screenshots...');
  mkdirSync(join(ROOT, 'Apple App Store', 'iPad'), { recursive: true });
  const ipadPage = await context.newPage();
  await ipadPage.setViewportSize({ width: 2048, height: 2732 });
  await ipadPage.goto(`file:///${join(ROOT, 'screenshots-apple-ipad.html').replace(/\\/g, '/')}`);
  await ipadPage.waitForTimeout(2000);

  await ipadPage.evaluate(() => {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.querySelectorAll('.screenshot-slide').forEach(el => {
      el.style.transform = 'none';
      el.style.margin = '0';
    });
    document.querySelectorAll('.zoom-controls, .page-title, .page-subtitle, .page-spec, .instructions, .slide-label').forEach(el => el.remove());
  });
  await ipadPage.waitForTimeout(500);

  for (let i = 1; i <= 5; i++) {
    const el = await ipadPage.$(`#slide-${i}`);
    if (el) {
      await ipadPage.evaluate(e => window.scrollTo(0, e.offsetTop), el);
      await ipadPage.waitForTimeout(200);
      await ipadPage.screenshot({ path: join(ROOT, 'Apple App Store', 'iPad', `screenshot-${i}.png`) });
      console.log(`  -> iPad/screenshot-${i}.png`);
    }
  }
  await ipadPage.close();

  await browser.close();

  // Copy icon to mobile assets
  const mobileIconDest = resolve('C:/Users/beltr/ASO/apps/mobile/assets/icon.png');
  copyFileSync(join(ROOT, 'App Icon', 'icon-512.png'), mobileIconDest);
  console.log('\n  -> Copied icon-512.png to apps/mobile/assets/icon.png');

  // Cleanup temp files
  try {
    const { unlinkSync } = await import('fs');
    unlinkSync(iconHtmlPath);
    unlinkSync(iconHtmlPath2);
  } catch(e) {}

  console.log('\nDone! All assets generated in:', ROOT);
}

main().catch(e => { console.error(e); process.exit(1); });
