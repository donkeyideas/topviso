const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const APP_SLUG = '5ffe01b9-a7ad-4685-8084-abec01c15ecb';
const EMAIL = 'info@donkeyideas.com';
const PASSWORD = 'Test1234!';
const SCREENSHOT_DIR = 'C:/Users/beltr/ASO/uat-screenshots';

const PAGES = [
  { name: 'Overview', path: '/app/' + APP_SLUG + '/overview' },
  { name: 'Discovery Map', path: '/app/' + APP_SLUG + '/discovery-map' },
  { name: 'Visibility', path: '/app/' + APP_SLUG + '/visibility' },
  { name: 'Keywords', path: '/app/' + APP_SLUG + '/keywords' },
  { name: 'Competitors', path: '/app/' + APP_SLUG + '/competitors' },
  { name: 'Reviews', path: '/app/' + APP_SLUG + '/reviews' },
  { name: 'Optimizer', path: '/app/' + APP_SLUG + '/optimizer' },
  { name: 'Store Intel', path: '/app/' + APP_SLUG + '/store-intel' },
  { name: 'Localization', path: '/app/' + APP_SLUG + '/localization' },
  { name: 'Update Impact', path: '/app/' + APP_SLUG + '/update-impact' },
  { name: 'Recommendations', path: '/app/' + APP_SLUG + '/recommendations' },
  { name: 'Strategy', path: '/app/' + APP_SLUG + '/strategy' },
  { name: 'LLM Tracker', path: '/app/' + APP_SLUG + '/llm-tracker' },
  { name: 'Intent Map', path: '/app/' + APP_SLUG + '/intent-map' },
  { name: 'Ad Intel', path: '/app/' + APP_SLUG + '/ad-intel' },
  { name: 'Creative Lab', path: '/app/' + APP_SLUG + '/creative-lab' },
  { name: 'CPPs', path: '/app/' + APP_SLUG + '/cpps' },
  { name: 'Attribution', path: '/app/' + APP_SLUG + '/attribution' },
  { name: 'Reviews Plus', path: '/app/' + APP_SLUG + '/reviews-plus' },
  { name: 'Market Intel', path: '/app/' + APP_SLUG + '/market-intel' },
  { name: 'Agent Ready', path: '/app/' + APP_SLUG + '/agent-ready' },
  { name: 'API Data', path: '/app/' + APP_SLUG + '/api-data' },
];

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const allErrors = {};

  page.on('console', function(msg) {
    if (msg.type() === 'error') {
      var url = page.url();
      if (!allErrors[url]) allErrors[url] = [];
      allErrors[url].push(msg.text());
    }
  });

  page.on('pageerror', function(err) {
    var url = page.url();
    if (!allErrors[url]) allErrors[url] = [];
    allErrors[url].push('PAGE ERROR: ' + err.message);
  });

  // Step 1: Login
  console.log('=== STEP 1: LOGIN ===');
  try {
    await page.goto(TARGET_URL + '/signin', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: SCREENSHOT_DIR + '/00-signin.png', fullPage: true });

    var emailInput = page.locator('input[type="email"]');
    var passwordInput = page.locator('input[type="password"]');

    if (await emailInput.count() > 0) {
      await emailInput.fill(EMAIL);
      await passwordInput.fill(PASSWORD);

      var submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      try {
        await page.waitForURL('**/app**', { timeout: 10000 });
        console.log('  LOGIN SUCCESS - redirected to: ' + page.url());
      } catch (e2) {
        console.log('  LOGIN - current URL after submit: ' + page.url());
        var errorText = await page.locator('.error, [role="alert"]').allTextContents();
        if (errorText.length > 0) {
          console.log('  LOGIN ERROR: ' + errorText.join('; '));
        }
      }
    } else {
      console.log('  No login form found, checking if already logged in');
      console.log('  Current URL: ' + page.url());
    }

    await page.screenshot({ path: SCREENSHOT_DIR + '/00-after-login.png', fullPage: true });
  } catch (e) {
    console.log('  LOGIN FAILED: ' + e.message);
  }

  // Step 2: Visit every page
  console.log('');
  console.log('=== STEP 2: TESTING ALL PAGES ===');
  console.log('');

  var results = [];

  for (var i = 0; i < PAGES.length; i++) {
    var pg = PAGES[i];
    var num = String(i + 1).padStart(2, '0');
    var url = TARGET_URL + pg.path;
    console.log('--- [' + num + '] ' + pg.name + ' ---');
    console.log('  URL: ' + url);

    var result = {
      name: pg.name,
      path: pg.path,
      url: url,
      status: 'ok',
      issues: [],
      hasData: false,
      screenshot: SCREENSHOT_DIR + '/' + num + '-' + pg.name.toLowerCase().replace(/ /g, '-') + '.png',
      tableRows: 0,
      kpiValues: 0,
      cardBodies: 0,
      emptyStates: 0,
      numBigValues: 0,
      pills: 0,
    };

    try {
      var response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

      if (!response) {
        result.issues.push('No response received');
        result.status = 'error';
      } else if (response.status() >= 400) {
        result.issues.push('HTTP ' + response.status());
        result.status = 'error';
      }

      await page.waitForTimeout(2000);

      var currentUrl = page.url();
      if (currentUrl.indexOf('signin') >= 0) {
        result.status = 'auth_error';
        result.issues.push('Redirected to signin - not authenticated');
      }

      // Check for visible errors
      var errorElements = await page.locator('.gen-modal-error').allTextContents();
      if (errorElements.length > 0) {
        result.issues.push('Error on page: ' + errorElements.join('; '));
      }

      // Count data elements
      result.tableRows = await page.locator('.data-table tbody tr').count();
      result.kpiValues = await page.locator('.kpi .value').count();
      result.cardBodies = await page.locator('.card-body').count();
      result.numBigValues = await page.locator('.num-big').count();
      result.pills = await page.locator('.pill').count();

      // Check for empty colspan cells (empty table state)
      result.emptyStates = await page.locator('td[colspan]').count();

      if (result.tableRows > 0 || result.kpiValues > 0 || result.numBigValues > 0) {
        result.hasData = true;
      }

      // Check for generate buttons suggesting no data
      var genBtns = await page.locator('button:has-text("Generate")').count();
      var autoDiscBtns = await page.locator('button:has-text("Auto-discover")').count();
      if (genBtns > 0 && result.tableRows === 0 && result.kpiValues === 0) {
        result.issues.push('Shows empty state with Generate button');
        result.hasData = false;
      }

      // Check for broken images
      var brokenImages = await page.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        var broken = 0;
        imgs.forEach(function(img) {
          if (!img.complete || img.naturalWidth === 0) broken++;
        });
        return broken;
      });
      if (brokenImages > 0) {
        result.issues.push(brokenImages + ' broken image(s)');
      }

      // Check for overflow
      var hasOverflow = await page.evaluate(function() {
        return document.body.scrollWidth > document.body.clientWidth + 20;
      });
      if (hasOverflow) {
        result.issues.push('Horizontal overflow detected');
      }

      // Check for NaN, undefined, or [object Object] displayed as text
      var badTextContent = await page.evaluate(function() {
        var body = document.body.innerText;
        var issues = [];
        if (body.indexOf('NaN') >= 0) issues.push('NaN found in page text');
        if (body.indexOf('undefined') >= 0) issues.push('undefined found in page text');
        if (body.indexOf('[object Object]') >= 0) issues.push('[object Object] found in page text');
        return issues;
      });
      for (var bi = 0; bi < badTextContent.length; bi++) {
        result.issues.push(badTextContent[bi]);
      }

      await page.screenshot({ path: result.screenshot, fullPage: true });

      console.log('  Status: ' + result.status);
      console.log('  Data: tables=' + result.tableRows + ', kpis=' + result.kpiValues + ', numBig=' + result.numBigValues + ', pills=' + result.pills + ', cards=' + result.cardBodies);
      if (result.issues.length > 0) {
        console.log('  Issues: ' + result.issues.join(' | '));
      }

    } catch (e) {
      result.status = 'crash';
      result.issues.push('Page error: ' + e.message);
      console.log('  CRASH: ' + e.message);
      try {
        await page.screenshot({ path: result.screenshot, fullPage: true });
      } catch (e3) {}
    }

    results.push(result);
    console.log('');
  }

  // Step 3: Console errors summary
  console.log('=== CONSOLE ERRORS SUMMARY ===');
  console.log('');
  var errorKeys = Object.keys(allErrors);
  if (errorKeys.length === 0) {
    console.log('  No console errors detected across all pages.');
  } else {
    for (var ei = 0; ei < errorKeys.length; ei++) {
      var eurl = errorKeys[ei];
      var filtered = allErrors[eurl].filter(function(e) {
        return e.indexOf('favicon') < 0 &&
          e.indexOf('next-router-prefetch') < 0 &&
          e.indexOf('Download the React DevTools') < 0 &&
          e.indexOf('Hydration') < 0;
      });
      if (filtered.length > 0) {
        var shortUrl = eurl.replace(TARGET_URL, '');
        console.log('  ' + shortUrl + ':');
        for (var fi = 0; fi < Math.min(filtered.length, 5); fi++) {
          console.log('    - ' + filtered[fi].substring(0, 250));
        }
      }
    }
  }

  // Step 4: Final report
  console.log('');
  console.log('=== FINAL UAT REPORT ===');
  console.log('');

  var okCount = 0;
  var warnCount = 0;
  var errCount = 0;
  for (var ri = 0; ri < results.length; ri++) {
    if (results[ri].status === 'ok' && results[ri].issues.length === 0) okCount++;
    else if (results[ri].status === 'ok') warnCount++;
    else errCount++;
  }

  console.log('Total pages tested: ' + results.length);
  console.log('  CLEAN (no issues): ' + okCount);
  console.log('  WARNINGS: ' + warnCount);
  console.log('  ERRORS/CRASHES: ' + errCount);

  console.log('');
  console.log('--- Pages with Issues ---');
  for (var pi = 0; pi < results.length; pi++) {
    var r = results[pi];
    if (r.issues.length > 0) {
      var icon = r.status === 'ok' ? 'WARN' : 'ERROR';
      console.log('');
      console.log('  [' + icon + '] ' + r.name + ' (' + r.path + ')');
      for (var ii = 0; ii < r.issues.length; ii++) {
        console.log('      - ' + r.issues[ii]);
      }
      console.log('      Data: tables=' + r.tableRows + ', kpis=' + r.kpiValues + ', numBig=' + r.numBigValues + ', pills=' + r.pills);
    }
  }

  console.log('');
  console.log('--- Data Presence Summary ---');
  for (var di = 0; di < results.length; di++) {
    var d = results[di];
    var dataIcon = d.hasData ? 'HAS_DATA' : 'NO_DATA';
    console.log('  [' + dataIcon + '] ' + d.name + ': tables=' + d.tableRows + ', kpis=' + d.kpiValues + ', numBig=' + d.numBigValues + ', pills=' + d.pills);
  }

  await browser.close();
  console.log('');
  console.log('Done. Screenshots saved to ' + SCREENSHOT_DIR);
})();
