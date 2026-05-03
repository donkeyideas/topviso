const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const APP_SLUG = '5ffe01b9-a7ad-4685-8084-abec01c15ecb';
const EMAIL = 'info@donkeyideas.com';
const PASSWORD = 'Test1234!';
const SCREENSHOT_DIR = 'C:/Users/beltr/ASO/uat-screenshots';

const PAGES = [
  { name: 'LLM Tracker', path: '/app/' + APP_SLUG + '/llm-tracker' },
  { name: 'Intent Map', path: '/app/' + APP_SLUG + '/intent-map' },
  { name: 'Ad Intel', path: '/app/' + APP_SLUG + '/ad-intel' },
  { name: 'Creative Lab', path: '/app/' + APP_SLUG + '/creative-lab' },
  { name: 'CPPs', path: '/app/' + APP_SLUG + '/cpps' },
  { name: 'Attribution', path: '/app/' + APP_SLUG + '/attribution' },
  { name: 'Reviews Plus', path: '/app/' + APP_SLUG + '/reviews-plus' },
  { name: 'Market Intel', path: '/app/' + APP_SLUG + '/market-intel' },
  { name: 'Agent Ready', path: '/app/' + APP_SLUG + '/agent-ready' },
];

(async () => {
  var fs = require('fs');
  var browser = await chromium.launch({ headless: true });
  var context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  var page = await context.newPage();

  var allErrors = {};

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

  // Login
  console.log('=== LOGIN ===');
  await page.goto(TARGET_URL + '/signin', { waitUntil: 'networkidle', timeout: 15000 });
  var emailInput = page.locator('input[type="email"]');
  if (await emailInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL('**/app**', { timeout: 10000 });
      console.log('  LOGIN SUCCESS');
    } catch (e2) {
      console.log('  LOGIN ISSUE: ' + page.url());
    }
  }

  // Test pages
  console.log('');
  console.log('=== TESTING MISSING PAGES ===');
  console.log('');

  var results = [];

  for (var i = 0; i < PAGES.length; i++) {
    var pg = PAGES[i];
    var num = String(i + 13).padStart(2, '0');
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
        result.issues.push('Redirected to signin');
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
      result.emptyStates = await page.locator('td[colspan]').count();

      if (result.tableRows > 0 || result.kpiValues > 0 || result.numBigValues > 0) {
        result.hasData = true;
      }

      // Check for generate buttons
      var genBtns = await page.locator('button:has-text("Generate")').count();
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

      // Check for NaN, undefined, [object Object]
      var badTextContent = await page.evaluate(function() {
        var body = document.body.innerText;
        var issues = [];
        if (body.indexOf('NaN') >= 0) issues.push('NaN found in page text');
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

  // Console errors
  console.log('=== CONSOLE ERRORS ===');
  var errorKeys = Object.keys(allErrors);
  if (errorKeys.length === 0) {
    console.log('  No console errors.');
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

  // Summary
  console.log('');
  console.log('=== SUMMARY ===');
  for (var ri = 0; ri < results.length; ri++) {
    var r = results[ri];
    var icon = r.status === 'ok' && r.issues.length === 0 ? 'OK' : r.status === 'ok' ? 'WARN' : 'ERROR';
    var dataIcon = r.hasData ? 'HAS_DATA' : 'NO_DATA';
    console.log('  [' + icon + '] [' + dataIcon + '] ' + r.name + ': tables=' + r.tableRows + ', kpis=' + r.kpiValues + ', numBig=' + r.numBigValues + ', pills=' + r.pills);
    if (r.issues.length > 0) {
      for (var ii = 0; ii < r.issues.length; ii++) {
        console.log('      - ' + r.issues[ii]);
      }
    }
  }

  await browser.close();
  console.log('');
  console.log('Done.');
})();
