/**
 * ASO Glossary seed data.
 *
 * Each entry becomes a `posts` row with type='guide', status='published'.
 * `slug` is chosen to target long-tail intent queries (e.g. "what is keyword
 * density ASO"). `content` is clean HTML rendered by glossary/[term]/page.tsx.
 *
 * Used by seed-glossary.ts. Safe to re-run — the seeder upserts on slug.
 */

export type GlossaryTerm = {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
}

const p = (...paras: string[]) => paras.map((t) => `<p>${t}</p>`).join('\n')

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    title: 'App Store Optimization (ASO)',
    slug: 'what-is-app-store-optimization',
    excerpt:
      'App Store Optimization (ASO) is the practice of improving an app’s visibility and conversion in app store search and browse, plus emerging AI surfaces.',
    content: p(
      'App Store Optimization (ASO) is the ongoing process of improving how an app ranks and converts across discovery surfaces — primarily Apple’s App Store and Google Play, and increasingly AI assistants like ChatGPT, Claude, and Gemini.',
      'ASO has two halves. <strong>Visibility</strong> covers everything that affects whether your app appears in a search or browse result: keyword targeting, ratings, install velocity, and relevance signals. <strong>Conversion</strong> covers everything that turns an impression into an install: icon, screenshots, title, subtitle, and reviews.',
      'Unlike paid user acquisition, ASO compounds. A well-optimized listing keeps earning organic installs long after the work is done, which makes it the highest-leverage growth channel for most apps.',
    ),
    tags: ['aso-basics', 'fundamentals'],
  },
  {
    title: 'Keyword Density',
    slug: 'what-is-keyword-density',
    excerpt:
      'Keyword density in ASO is how often a keyword appears across your indexable metadata fields — enough to signal relevance, without wasteful repetition.',
    content: p(
      'Keyword density is the frequency with which a target keyword appears across an app’s indexable metadata: the title, subtitle, and keyword field on iOS, or the title, short description, and long description on Google Play.',
      'On the App Store, repeating a keyword does <em>not</em> increase ranking — a term only needs to appear once to be indexed. The optimal strategy is breadth: cover as many distinct relevant terms as possible rather than repeating one. On Google Play, moderate repetition in the long description can reinforce relevance, but stuffing triggers quality penalties and hurts readability.',
      'The practical rule: index each important keyword once, prioritize the highest-value terms in the title, and never sacrifice conversion-driving copy to cram in repeats.',
    ),
    tags: ['keywords', 'metadata'],
  },
  {
    title: 'App Store Conversion Rate Optimization (CRO)',
    slug: 'app-store-conversion-rate-optimization',
    excerpt:
      'Conversion rate optimization (CRO) is the practice of increasing the share of store-listing visitors who install your app, mainly through creative testing.',
    content: p(
      'Conversion Rate Optimization (CRO) for app stores is the discipline of lifting the percentage of people who, after seeing or visiting your product page, actually install the app. A higher conversion rate not only wins more installs from the same traffic — it also feeds the store algorithm a positive relevance signal that improves rankings.',
      'The biggest levers are creative: the icon, the first two or three screenshots, and the app preview video. Secondary levers include the title and subtitle, ratings, and the “what’s new” text.',
      'Mature CRO is experimental. Tools like Apple’s Product Page Optimization and Google Play’s Store Listing Experiments let you A/B test variants and roll out the winner with statistical confidence.',
    ),
    tags: ['conversion', 'creative'],
  },
  {
    title: 'Apple Search Tags',
    slug: 'apple-search-tags',
    excerpt:
      'Apple Search Tags are structured keyword tags Apple uses to categorize apps and surface them for relevant searches and browse collections.',
    content: p(
      'Apple Search Tags are descriptive labels Apple associates with an app to help its search and browse systems understand what the app is about. Some are derived automatically from your metadata and category; others come from editorial curation and structured inputs in App Store Connect.',
      'Tags influence which collections, “you might also like” rows, and search refinements your app appears in. While developers don’t control every tag directly, you influence them through precise category selection, a focused keyword field, and a clear, consistent value proposition across your metadata.',
      'Treat tags as a signal of how Apple <em>classifies</em> your app: the cleaner and more specific your positioning, the more accurately you get tagged — and the more relevant your impressions become.',
    ),
    tags: ['keywords', 'apple', 'metadata'],
  },
  {
    title: 'Keyword Ranking',
    slug: 'what-is-keyword-ranking-aso',
    excerpt:
      'A keyword ranking is your app’s position in the app store search results for a specific search term — the core ASO performance metric.',
    content: p(
      'A keyword ranking is the position at which your app appears when a user searches a given term in the App Store or Google Play. Ranking #1 for a high-volume keyword can drive a large share of a category’s organic installs, because the top three results capture the overwhelming majority of taps.',
      'Rankings are determined by relevance (does your metadata match the query?) and authority signals (install velocity, retention, ratings, and engagement). They fluctuate daily and vary by country, so ASO teams track rankings per keyword, per storefront, over time.',
      'The goal is not to rank for everything, but to rank highly for terms that are both relevant to your app and have enough search volume to matter.',
    ),
    tags: ['keywords', 'metrics'],
  },
  {
    title: 'Impressions',
    slug: 'what-are-app-store-impressions',
    excerpt:
      'An impression is counted each time your app appears to a user in search or browse — the top of the ASO funnel before taps and installs.',
    content: p(
      'An impression is recorded each time your app’s icon or listing is shown to a user, whether in search results, a category chart, a featured collection, or a “you might also like” row. Impressions sit at the very top of the ASO funnel.',
      'More impressions mean more visibility, but they’re only valuable if they convert. The two ratios that turn impressions into growth are tap-through rate (impressions → product page views) and conversion rate (views → installs).',
      'Watching impressions alongside conversion helps diagnose problems: falling impressions usually point to a visibility/ranking issue, while high impressions with low taps point to a weak icon or unappealing first screenshot.',
    ),
    tags: ['metrics', 'funnel'],
  },
  {
    title: 'Product Page Optimization (PPO)',
    slug: 'what-is-product-page-optimization',
    excerpt:
      'Product Page Optimization is Apple’s native A/B testing feature that lets you test up to three alternate versions of your icon, screenshots, and preview.',
    content: p(
      'Product Page Optimization (PPO) is Apple’s built-in experimentation tool inside App Store Connect. It lets you test up to three treatment variations of your product page — different icons, screenshots, or app preview videos — against your current page, splitting live traffic and measuring which converts best.',
      'Because the test runs on real App Store traffic with Apple’s own conversion data, results are trustworthy and free of attribution noise. Each treatment can target specific localizations, and you can roll the winner out directly.',
      'PPO is the safest way to make creative changes: instead of guessing, you ship the variant that statistically beats the control.',
    ),
    tags: ['conversion', 'apple', 'testing'],
  },
  {
    title: 'Custom Product Pages (CPP)',
    slug: 'what-are-custom-product-pages',
    excerpt:
      'Custom Product Pages let you create up to 35 alternate App Store pages, each with its own URL, screenshots, and messaging for specific audiences.',
    content: p(
      'Custom Product Pages (CPP) are alternate versions of your App Store listing — up to 35 per app — each with a unique URL and its own screenshots, preview video, and promotional text. Unlike PPO (which tests creatives for all visitors), CPPs are designed to match specific traffic sources or audiences.',
      'For example, you might send a “meditation for sleep” ad to a CPP whose screenshots lead with sleep features, while your default page emphasizes general wellness. This message-match between ad and landing page lifts conversion significantly.',
      'CPPs are a paid-acquisition multiplier and a powerful tool for tailoring your story to different intents without changing your main listing.',
    ),
    tags: ['conversion', 'apple', 'paid'],
  },
  {
    title: 'App Icon',
    slug: 'app-icon-aso',
    excerpt:
      'The app icon is the single most important conversion asset — the first thing users see in search, charts, and on the home screen.',
    content: p(
      'The app icon is the small square image that represents your app everywhere it appears: search results, charts, featured rows, and the home screen after install. Because it shows at every stage of discovery, it is the highest-impact single creative asset for both tap-through and conversion.',
      'Effective icons are simple, legible at small sizes, visually distinct from competitors, and consistent with your brand. Overly detailed icons turn to mush at 60 pixels; generic icons blend into the category.',
      'Icon changes can meaningfully move conversion, which is exactly why they should be tested through PPO or Store Listing Experiments rather than swapped on a hunch.',
    ),
    tags: ['creative', 'conversion'],
  },
  {
    title: 'Screenshots',
    slug: 'app-store-screenshots-aso',
    excerpt:
      'App store screenshots are the visual pitch for your app; the first two or three drive the majority of the conversion decision.',
    content: p(
      'Screenshots are the gallery of images on your product page that show what the app does and why it matters. On both the App Store and Google Play, the first two or three screenshots are visible without scrolling and carry most of the conversion weight.',
      'High-performing screenshots lead with the strongest benefit, use short caption text to frame each value proposition, and present a coherent visual narrative rather than a random tour of UI. Many teams use “portrait panorama” designs that flow across panels.',
      'Because screenshots so directly influence installs, they are the most common subject of A/B tests in PPO and Store Listing Experiments.',
    ),
    tags: ['creative', 'conversion'],
  },
  {
    title: 'App Preview Video',
    slug: 'what-is-an-app-preview-video',
    excerpt:
      'An app preview video is a short autoplaying clip on your product page that demonstrates the app in action and can lift conversion when done well.',
    content: p(
      'An app preview video is a 15–30 second clip that autoplays (muted) at the top of your product page, showing the actual app experience. On the App Store you can include up to three; on Google Play, a single promo video.',
      'Because it autoplays, the first few seconds must communicate the core value instantly — captured screen recordings of the real product convert better than abstract brand montages. A weak or slow video can actually depress conversion versus screenshots alone, so it should always be tested.',
      'Used well, video is most effective for apps whose value is motion-based or hard to convey in a still: games, editing tools, and interactive experiences.',
    ),
    tags: ['creative', 'conversion'],
  },
  {
    title: 'App Title',
    slug: 'app-store-title-optimization',
    excerpt:
      'The app title is the most heavily weighted ASO field; including a high-value keyword in it can dramatically improve ranking for that term.',
    content: p(
      'The app title (or app name) is the bold text under your icon, limited to 30 characters on the App Store. It is the single most influential field for keyword ranking — a term placed in the title ranks far more strongly than the same term in the subtitle or keyword field.',
      'The art is balancing brand and keyword. A pure brand name (“Headspace”) wastes ranking potential; a keyword-stuffed title (“Sleep – Meditation – Calm – Relax”) looks spammy and hurts trust. The strongest pattern is “Brand: primary keyword phrase”.',
      'Because it drives both ranking and first impressions, the title deserves more deliberation than any other metadata field.',
    ),
    tags: ['keywords', 'metadata'],
  },
  {
    title: 'App Subtitle',
    slug: 'what-is-the-app-store-subtitle',
    excerpt:
      'The App Store subtitle is a 30-character line under your title that supports both keyword ranking and conversion messaging.',
    content: p(
      'The subtitle is a 30-character field that appears directly below your app title on the App Store. It serves double duty: every word is indexed for keyword ranking, and it’s prominent enough to shape a user’s first impression.',
      'The best subtitles weave secondary keywords into a benefit-led phrase a human actually wants to read — for example, “Habit tracker & daily planner.” Avoid repeating words already in your title, since duplication wastes indexing space.',
      'Google Play has no exact equivalent; its closest counterpart is the short description, which is weighted for both ranking and conversion.',
    ),
    tags: ['keywords', 'metadata', 'apple'],
  },
  {
    title: 'Keyword Field',
    slug: 'app-store-keyword-field',
    excerpt:
      'The App Store keyword field is a hidden 100-character list of comma-separated terms used only for indexing, never shown to users.',
    content: p(
      'The keyword field is a private, 100-character field in App Store Connect where you list comma-separated terms you want to rank for. Users never see it; it exists purely to tell Apple which queries your app is relevant to.',
      'To maximize it: don’t use spaces after commas (they waste characters), never repeat words already in your title or subtitle, skip your own brand and category name (Apple indexes those automatically), and avoid plurals when Apple already matches them. Apple also auto-combines your single words into phrases, so list components rather than full phrases.',
      'Google Play has no keyword field; it derives keywords from your visible descriptions instead.',
    ),
    tags: ['keywords', 'metadata', 'apple'],
  },
  {
    title: 'Long Description',
    slug: 'google-play-long-description',
    excerpt:
      'On Google Play, the long description is indexed for keywords, making it the primary place to influence search ranking through copy.',
    content: p(
      'The long description is the up-to-4,000-character body text on a Google Play listing. Unlike the App Store — which uses a hidden keyword field — Google indexes this visible copy, so the words you use here directly affect which searches surface your app.',
      'Effective long descriptions feature your most important keywords naturally in the first few lines and headings, repeat key terms a handful of times without stuffing, and remain genuinely readable, since the same text must also convert visitors.',
      'Aim for relevance and clarity over density: Google’s quality systems penalize keyword spam, and a wall of repeated phrases erodes the trust that drives installs.',
    ),
    tags: ['keywords', 'metadata', 'google-play'],
  },
  {
    title: 'Short Description',
    slug: 'google-play-short-description',
    excerpt:
      'The Google Play short description is an 80-character line that is both keyword-indexed and the first copy most users read.',
    content: p(
      'The short description is the 80-character summary that appears near the top of a Google Play listing, above the fold and before the “read more” fold. It is indexed for keyword ranking and highly visible, so it must satisfy the algorithm and the user at once.',
      'The strongest short descriptions lead with the single clearest benefit and naturally include one or two priority keywords. Because it’s often the only description text a user reads before deciding, clarity beats cleverness.',
      'It is the Google Play field most analogous to the App Store subtitle in both length and strategic importance.',
    ),
    tags: ['keywords', 'metadata', 'google-play'],
  },
  {
    title: 'Localization',
    slug: 'what-is-app-store-localization',
    excerpt:
      'Localization is adapting your app’s metadata and creatives for different languages and regions to rank and convert in each market.',
    content: p(
      'Localization is the practice of translating and culturally adapting your store listing — title, subtitle, keywords, descriptions, and screenshots — for each market you target. Done well, it unlocks ranking for local-language queries and lifts conversion among users who prefer their own language.',
      'A powerful ASO tactic exploits Apple’s localization structure: additional locales (like English (UK) or Spanish (Mexico)) provide extra keyword fields that index in the same storefront, effectively expanding your keyword capacity even for a single-language market.',
      'Localization is not mere translation — search behavior, idioms, and competitive terms differ by country, so keyword research should be redone per locale.',
    ),
    tags: ['localization', 'keywords', 'international'],
  },
  {
    title: 'Keyword Difficulty',
    slug: 'what-is-keyword-difficulty-aso',
    excerpt:
      'Keyword difficulty estimates how hard it is to rank highly for a term, based on the strength and number of competing apps.',
    content: p(
      'Keyword difficulty is a score — usually 0–100 — that estimates how competitive a search term is. It factors in how many apps target the keyword and how strong they are (ratings, install velocity, age, and authority).',
      'High-difficulty keywords like “games” or “photo editor” may have huge volume but are dominated by entrenched incumbents, making them nearly impossible for a new app to crack. Low-difficulty, long-tail terms offer a realistic path to page one.',
      'Smart ASO balances difficulty against volume: target a portfolio that includes a few aspirational high-volume terms and many winnable specific ones.',
    ),
    tags: ['keywords', 'research', 'metrics'],
  },
  {
    title: 'Search Volume',
    slug: 'what-is-keyword-search-volume',
    excerpt:
      'Search volume (or popularity score) estimates how often users search a given keyword — the demand side of keyword research.',
    content: p(
      'Search volume estimates how many people search a particular term in an app store over a period. Apple expresses this as a popularity score (roughly 5–100), while ASO tools model absolute volumes from observed data.',
      'Volume tells you the size of the prize: ranking #1 for a term nobody searches yields nothing, no matter how easy it is. The right targets sit at the intersection of meaningful volume, manageable difficulty, and genuine relevance to your app.',
      'Because volume shifts with seasonality and trends, leading ASO teams re-evaluate their keyword set regularly rather than setting it once.',
    ),
    tags: ['keywords', 'research', 'metrics'],
  },
  {
    title: 'Branded Keywords',
    slug: 'branded-vs-non-branded-keywords',
    excerpt:
      'Branded keywords contain a company or app name; non-branded keywords describe a need. Each plays a distinct role in app discovery.',
    content: p(
      'Branded keywords include a specific brand or app name — “Spotify,” “Netflix download.” They signal high intent (the user already wants that app) and usually convert extremely well, but volume is capped by brand awareness.',
      'Non-branded keywords describe a need or category — “music streaming,” “movie app.” They capture users who haven’t chosen a solution yet, offering far more reach and the chance to win new customers from competitors.',
      'A healthy ASO strategy defends your own branded terms (so competitors can’t intercept your demand) while aggressively pursuing non-branded terms for growth.',
    ),
    tags: ['keywords', 'strategy'],
  },
  {
    title: 'Long-tail Keywords',
    slug: 'what-are-long-tail-keywords-aso',
    excerpt:
      'Long-tail keywords are longer, more specific multi-word search phrases that are easier to rank for and often convert better.',
    content: p(
      'Long-tail keywords are specific phrases of three or more words — “interval running timer for beginners” rather than “running.” Individually they have low volume, but collectively they make up the majority of all searches and carry higher intent.',
      'They are the backbone of new-app ASO: competition is thin, so ranking is achievable quickly, and because the searcher describes exactly what they want, conversion tends to be strong.',
      'The winning approach is to accumulate many long-tail rankings while gradually building the authority needed to compete for the broader head terms.',
    ),
    tags: ['keywords', 'strategy', 'research'],
  },
  {
    title: 'Tap-Through Rate (TTR)',
    slug: 'what-is-tap-through-rate-aso',
    excerpt:
      'Tap-through rate is the share of impressions that result in a tap to your product page — a key signal of icon and title appeal.',
    content: p(
      'Tap-through rate (TTR) is the percentage of impressions that turn into product page views — i.e., how often people who see your app in search or browse actually tap it. It isolates the appeal of the assets visible <em>before</em> the page: primarily the icon, app name, and, in search, the first screenshots.',
      'A low TTR with healthy impressions means your app is being seen but not clicked — usually an icon or positioning problem. Improving TTR also tends to improve rankings, because stores interpret taps as a relevance vote.',
      'TTR and conversion rate together decompose the funnel: TTR governs impressions → views, conversion governs views → installs.',
    ),
    tags: ['metrics', 'conversion', 'funnel'],
  },
  {
    title: 'Install Conversion Rate',
    slug: 'what-is-install-conversion-rate',
    excerpt:
      'Install conversion rate is the percentage of product page visitors who install your app — the central CRO metric.',
    content: p(
      'Install conversion rate is the share of people who visit your product page and go on to install the app. It is the headline metric of conversion rate optimization and a direct multiplier on every install channel: doubling conversion doubles installs from the same traffic.',
      'It is driven by on-page assets — screenshots, video, ratings, description — and by message-match with whatever brought the user there. Benchmarks vary widely by category, so the useful comparison is your own trend over time and your performance versus close competitors.',
      'Because the stores reward listings that convert well with better rankings, conversion improvements compound into additional organic visibility.',
    ),
    tags: ['metrics', 'conversion'],
  },
  {
    title: 'Category Ranking',
    slug: 'what-is-app-category-ranking',
    excerpt:
      'Category ranking is your app’s position within a store category’s top charts, driven largely by recent download and engagement velocity.',
    content: p(
      'Category ranking is where your app sits on the top-charts for its category (e.g., Top Free in Health & Fitness). Unlike keyword rankings, charts are driven heavily by short-term velocity — recent downloads, revenue, and engagement — rather than metadata.',
      'Charting highly creates a virtuous cycle: chart placement is itself a major source of impressions, so climbing brings more installs, which sustains the rank. This is why launches and burst campaigns aim to spike velocity.',
      'Choosing the most relevant (and sometimes less saturated) category can make charting — and the visibility that comes with it — substantially easier.',
    ),
    tags: ['metrics', 'charts'],
  },
  {
    title: 'Apple Featuring',
    slug: 'what-is-apple-app-store-featuring',
    excerpt:
      'Featuring is when Apple’s editorial team showcases your app in a Today, Apps, or Games story — a major, if temporary, visibility boost.',
    content: p(
      'Featuring is editorial promotion by Apple’s App Store team — a Today tab story, an “Apps We Love” collection, or a themed list. Unlike algorithmic ranking, featuring is curated by humans and can drive a large spike in impressions and installs while it runs.',
      'You can’t buy a feature, but you can earn one: ship a polished app, support the latest OS features and devices, maintain a strong design, localize broadly, and pitch Apple through the official “feature nomination” form ahead of launches or major updates.',
      'Because the lift is temporary, the lasting value of a feature comes from the ratings, retention, and ranking momentum it leaves behind.',
    ),
    tags: ['apple', 'visibility', 'editorial'],
  },
  {
    title: 'Ratings and Reviews',
    slug: 'app-store-ratings-and-reviews-aso',
    excerpt:
      'Ratings and reviews influence both ranking and conversion; the average star rating is one of the strongest conversion levers on any listing.',
    content: p(
      'Ratings (the star score) and reviews (written feedback) are among the most powerful ASO signals. The average rating affects conversion directly — the gap between 4.7 and 3.9 stars can move install rates dramatically — and it feeds the store’s ranking algorithms as a quality indicator.',
      'Volume and recency matter too: a high rating backed by thousands of recent reviews conveys trust and momentum, while a stale or sparse rating raises doubt. Responding to reviews (especially on Google Play) can recover unhappy users and lift scores.',
      'Sustained ASO treats ratings as a managed asset: prompt happy users at the right moment, fix the issues that generate one-star reviews, and never buy fake reviews, which risk removal.',
    ),
    tags: ['reviews', 'conversion', 'trust'],
  },
  {
    title: 'Review Velocity',
    slug: 'what-is-review-velocity',
    excerpt:
      'Review velocity is the rate at which an app accumulates new ratings and reviews over time — a freshness and momentum signal.',
    content: p(
      'Review velocity measures how quickly your app gains new ratings and reviews. A steady or accelerating flow of recent, positive reviews signals to both users and store algorithms that the app is actively used and well-maintained.',
      'Velocity matters because recency is weighted: a burst of fresh five-star reviews can lift your displayed average and reassure prospective users far more than old reviews. Conversely, a sudden spike of negative reviews — after a buggy update, say — is an early warning that conversion and rank are about to suffer.',
      'Healthy velocity comes from well-timed in-app rating prompts shown after positive moments, not from incentivized or purchased reviews.',
    ),
    tags: ['reviews', 'metrics'],
  },
  {
    title: 'In-App Rating Prompt',
    slug: 'what-is-an-in-app-rating-prompt',
    excerpt:
      'A rating prompt is the native dialog that asks users to rate your app; timing it well is one of the cheapest ways to raise your score.',
    content: p(
      'A rating prompt is the system-provided dialog (via Apple’s SKStoreReviewController or Google’s In-App Review API) that asks a user to rate your app without leaving it. Because it’s native, it converts far better than sending users to the store manually.',
      'The key is timing: trigger the prompt right after a positive moment — completing a workout, winning a level, finishing a successful task — when satisfaction is highest. Prompting at a frustrating moment, or too early, invites low scores.',
      'Both platforms cap how often the prompt can appear, so each impression is precious; show it to users you have good reason to believe are happy.',
    ),
    tags: ['reviews', 'conversion'],
  },
  {
    title: 'Keyword Cannibalization',
    slug: 'what-is-keyword-cannibalization-aso',
    excerpt:
      'Keyword cannibalization is wasting metadata space by repeating the same term across fields, reducing the breadth of keywords you index.',
    content: p(
      'Keyword cannibalization in ASO happens when you repeat the same word across multiple metadata fields — for instance, putting “fitness” in your title, subtitle, and keyword field. On the App Store, a term only needs to appear once to be fully indexed, so each repeat is a wasted slot that could have covered a different keyword.',
      'The cost is opportunity: every duplicated word is a keyword you’re <em>not</em> ranking for. With only ~100 characters in the keyword field plus the title and subtitle, breadth is precious.',
      'Audit your metadata as a single combined keyword set, eliminate duplicates, and spend the recovered space on additional relevant terms.',
    ),
    tags: ['keywords', 'metadata'],
  },
  {
    title: 'App Store Indexation',
    slug: 'what-is-app-store-indexation',
    excerpt:
      'Indexation is whether and how a keyword is registered as relevant to your app, determining which searches you can possibly appear in.',
    content: p(
      'Indexation is the process by which an app store associates keywords with your app, making it eligible to appear for those searches. If a term isn’t indexed to your app, you cannot rank for it at all — indexation is the precondition for ranking.',
      'On the App Store, terms are indexed from your title, subtitle, keyword field, and developer/in-app-purchase names. On Google Play, they come from your visible title and descriptions. Both stores also auto-generate phrase combinations from your individual words.',
      'A practical ASO check is to confirm your priority keywords are actually indexed (your app shows up somewhere for them) before trying to improve their position.',
    ),
    tags: ['keywords', 'metadata', 'fundamentals'],
  },
  {
    title: 'Apple Search Ads',
    slug: 'what-is-apple-search-ads',
    excerpt:
      'Apple Search Ads is Apple’s paid platform for placing your app at the top of relevant App Store search results.',
    content: p(
      'Apple Search Ads (ASA) is Apple’s advertising product that lets you bid to appear in a promoted slot above the organic results for chosen keywords. It’s a high-intent channel — you reach users actively searching for what your app does — and it integrates tightly with ASO.',
      'ASA and organic ASO reinforce each other: search-term reports from ASA reveal real queries and conversion rates that sharpen your keyword field, while strong organic relevance can lower your ad costs. Custom Product Pages let you tailor the landing experience per campaign.',
      'Run together, paid and organic search form a single strategy rather than competing channels.',
    ),
    tags: ['paid', 'apple', 'keywords'],
  },
  {
    title: 'Organic vs Paid Installs',
    slug: 'organic-vs-paid-installs',
    excerpt:
      'Organic installs come from unpaid discovery; paid installs come from advertising. The mix shapes your unit economics and ASO strategy.',
    content: p(
      'Organic installs are downloads earned without direct ad spend — through search, charts, featuring, word of mouth, and referrals. Paid installs come from advertising channels like Apple Search Ads, social, or networks. The distinction matters because organic installs have near-zero marginal cost and tend to retain better.',
      'The two interact. Paid campaigns that spike installs can lift chart and keyword rankings, which in turn generate additional <em>organic</em> installs — a phenomenon called organic uplift. Strong ASO, meanwhile, raises the conversion rate of paid traffic.',
      'A durable growth model uses paid to seed velocity and ASO to compound it into a growing base of free, high-quality organic installs.',
    ),
    tags: ['strategy', 'paid', 'metrics'],
  },
  {
    title: 'Organic Uplift',
    slug: 'what-is-organic-uplift',
    excerpt:
      'Organic uplift is the additional organic installs generated as a side effect of paid campaigns improving your rankings and visibility.',
    content: p(
      'Organic uplift (or organic multiplier) is the boost in unpaid installs that results from running paid user-acquisition campaigns. When paid spend drives a burst of downloads, your keyword and chart rankings improve, and that higher visibility produces extra organic installs you didn’t pay for directly.',
      'Measuring uplift is essential for honest paid ROI: if every 100 paid installs generate 30 organic ones, your true cost per install is lower than the ad platform reports. Teams estimate it by comparing organic volume during and outside campaign bursts.',
      'Maximizing uplift is an argument for concentrating spend to push past ranking thresholds rather than spreading it thinly.',
    ),
    tags: ['paid', 'metrics', 'strategy'],
  },
  {
    title: 'Retention Rate',
    slug: 'what-is-app-retention-rate',
    excerpt:
      'Retention rate is the share of users who keep using your app after installing; stores increasingly use it as a quality and ranking signal.',
    content: p(
      'Retention rate measures the percentage of users still active some number of days after install — commonly Day 1, Day 7, and Day 30. It is the clearest indicator of whether an app delivers lasting value.',
      'Beyond product health, retention has become an ASO signal: both Apple and Google increasingly favor apps that users keep and engage with, since promoting sticky apps improves the store experience. Apps with strong retention tend to sustain rankings and featuring more easily.',
      'This blurs the line between product and marketing — improving onboarding and core value doesn’t just reduce churn, it can directly improve discovery.',
    ),
    tags: ['metrics', 'retention', 'engagement'],
  },
  {
    title: 'Uninstall Rate',
    slug: 'what-is-app-uninstall-rate',
    excerpt:
      'Uninstall rate is the share of installs that are later removed; a high rate signals weak value and can drag down rankings.',
    content: p(
      'Uninstall rate is the percentage of users who delete your app after installing it. It is the mirror image of retention and a strong negative quality signal: a flood of quick uninstalls tells the store that an app failed to meet the expectations its listing set.',
      'High uninstall rates often trace back to a mismatch between marketing and reality — misleading screenshots, over-promised features, aggressive paywalls, or poor onboarding. Google Play in particular exposes uninstall data and factors retention into its systems.',
      'Lowering uninstalls is both a product fix and an ASO fix: honest creatives attract better-fit users, and a smoother first session keeps them.',
    ),
    tags: ['metrics', 'retention'],
  },
  {
    title: 'Metadata',
    slug: 'what-is-app-store-metadata',
    excerpt:
      'Metadata is the set of text and asset fields in your store listing that the algorithm reads and users see — the raw material of ASO.',
    content: p(
      'Metadata is everything you submit to describe your app: title, subtitle, keyword field, descriptions, category, icon, screenshots, and preview video. It is the raw material of ASO because it simultaneously feeds the ranking algorithm and forms the user’s impression.',
      'Metadata splits into two types. <strong>Textual metadata</strong> (titles, descriptions, keywords) primarily drives keyword indexing and ranking. <strong>Visual metadata</strong> (icon, screenshots, video) primarily drives conversion. Strong ASO optimizes both in tandem rather than trading one off against the other.',
      'Because changes to metadata can shift rankings and conversion, updates should be deliberate, measured, and — for creatives — ideally tested.',
    ),
    tags: ['metadata', 'fundamentals'],
  },
  {
    title: 'Deep Linking',
    slug: 'what-is-deep-linking',
    excerpt:
      'Deep linking sends users to a specific screen inside an app rather than its home page, improving conversion and re-engagement.',
    content: p(
      'A deep link is a URL that opens a specific location inside an app — a product, an article, a saved playlist — rather than just launching it to the default screen. Deferred deep links extend this to users who don’t yet have the app: they install first, then land directly on the intended content.',
      'For growth, deep linking sharpens message-match (an ad for a specific product opens that product), which lifts conversion and retention. It also powers re-engagement campaigns, referrals, and shared content.',
      'On the discovery side, well-structured links and app indexing help search engines and AI assistants surface in-app content, expanding where your app can be found.',
    ),
    tags: ['engagement', 'links', 'technical'],
  },
  {
    title: 'App Indexing',
    slug: 'what-is-app-indexing',
    excerpt:
      'App indexing exposes in-app content to search engines so it can appear in web results and deep-link directly into the app.',
    content: p(
      'App indexing is the practice of making your in-app content discoverable by search engines (and increasingly AI assistants) so that individual screens appear in results and link straight into the app. It bridges web SEO and ASO.',
      'Implemented through standards like Android App Links, Apple Universal Links, and structured data, indexing lets a user who searches the web find your app’s content and open it in place if the app is installed — or be guided to install it if not.',
      'As discovery shifts toward answer engines, indexed, well-structured content also makes your app more likely to be cited by LLMs.',
    ),
    tags: ['links', 'seo', 'technical'],
  },
  {
    title: 'Answer Engine Optimization (AEO)',
    slug: 'what-is-answer-engine-optimization',
    excerpt:
      'Answer Engine Optimization is optimizing content so AI assistants like ChatGPT and Gemini surface and recommend your app or brand.',
    content: p(
      'Answer Engine Optimization (AEO) is the emerging discipline of getting recommended by AI answer engines — ChatGPT, Claude, Gemini, Perplexity, and Copilot — when users ask them for solutions. Instead of ranking in a list of blue links, the goal is to be the app the assistant names in its answer.',
      'AEO draws on signals these models rely on: authoritative third-party content, structured data, consistent brand descriptions across the web, reviews, and reputable mentions. Because models synthesize from many sources, AEO is as much digital PR and content as it is technical.',
      'For app marketers, AEO is the natural extension of ASO into a world where a growing share of “which app should I use?” questions are answered by an AI rather than a store search.',
    ),
    tags: ['aeo', 'llm', 'ai-discovery'],
  },
  {
    title: 'Generative Engine Optimization (GEO)',
    slug: 'what-is-generative-engine-optimization',
    excerpt:
      'Generative Engine Optimization tunes your content and presence to influence how generative AI models describe and recommend you.',
    content: p(
      'Generative Engine Optimization (GEO) is the practice of shaping how generative AI systems represent your brand or app in the text they produce. Closely related to AEO, GEO focuses specifically on influencing the <em>generated narrative</em> — the wording, framing, and recommendations a model outputs.',
      'Tactics include publishing clear, factual, well-structured content that models can quote; earning mentions on the high-authority sources models trust; maintaining consistent descriptions of what you do; and monitoring how models currently describe you so you can correct misconceptions.',
      'GEO matters because LLM answers increasingly stand between users and your store listing, and a model that misdescribes your app costs you installs before a user ever reaches the App Store.',
    ),
    tags: ['geo', 'llm', 'ai-discovery'],
  },
  {
    title: 'LLM Citations',
    slug: 'what-are-llm-citations',
    excerpt:
      'LLM citations are the sources an AI assistant references or links to when answering, and being among them drives AI-era discovery.',
    content: p(
      'LLM citations are the references an AI assistant surfaces to support its answer — the links Perplexity lists, the sources ChatGPT cites with browsing, the pages a model draws on through retrieval. Being cited puts your brand directly in front of a user at their moment of decision.',
      'Citations are won much like search authority: clear, accurate, well-structured content on reputable domains; strong third-party coverage; and consistency across the sources a model retrieves. Tracking which sources get cited for your key prompts reveals where to invest.',
      'For app discovery, earning citations on “best app for X” queries is becoming as valuable as ranking for that keyword in the store.',
    ),
    tags: ['llm', 'ai-discovery', 'citations'],
  },
  {
    title: 'LLM Visibility',
    slug: 'what-is-llm-visibility',
    excerpt:
      'LLM visibility is how often and how favorably AI assistants mention your app across the prompts your potential users ask.',
    content: p(
      'LLM visibility measures your presence inside AI assistant answers — whether ChatGPT, Claude, Gemini, Perplexity, or Copilot mention your app when users ask questions in your category, and how positively. It is the AI-era counterpart to keyword rankings in the App Store.',
      'Because each model draws on different training data and live sources, visibility varies by engine and by prompt. Measuring it means polling representative prompts across models over time and tracking whether you appear, where, and with what framing.',
      'As more discovery journeys begin with “ask the AI,” LLM visibility is becoming a core marketing metric — one that platforms like Top Viso are built to track across every engine and surface.',
    ),
    tags: ['llm', 'ai-discovery', 'metrics'],
  },
  {
    title: 'Prompt Share of Voice',
    slug: 'what-is-prompt-share-of-voice',
    excerpt:
      'Prompt share of voice is the percentage of relevant AI prompts in which your app is mentioned versus competitors.',
    content: p(
      'Prompt share of voice (SOV) is an AI-discovery metric: across a defined set of user prompts in your category, what share of the answers mention your app relative to competitors? If users ask ten variations of “best budgeting app” and you appear in four answers, your prompt SOV is roughly 40%.',
      'It generalizes the classic share-of-voice idea to answer engines, letting you benchmark your AI presence against rivals and spot prompts where competitors dominate. Tracking it over time shows whether your AEO/GEO efforts are working.',
      'Because answers differ by model, prompt SOV is most meaningful when measured per engine and aggregated across a stable, representative prompt set.',
    ),
    tags: ['llm', 'ai-discovery', 'metrics'],
  },
  {
    title: 'Retrieval-Augmented Generation (RAG)',
    slug: 'what-is-retrieval-augmented-generation',
    excerpt:
      'RAG is the technique where an AI retrieves external documents at query time to ground its answer — a key route to being cited.',
    content: p(
      'Retrieval-Augmented Generation (RAG) is an AI architecture in which the model fetches relevant external documents at the moment of a query and uses them to ground its response, rather than relying solely on what it memorized during training. It’s why assistants can answer about recent events and cite live sources.',
      'RAG matters for discovery because it creates a real-time competition for retrieval: if your content is indexed, well-structured, and authoritative, it’s more likely to be pulled in and reflected (and cited) in the answer.',
      'Optimizing for RAG-based assistants means treating your public content like a knowledge base the model can quote — clear, factual, and easy to extract.',
    ),
    tags: ['llm', 'ai-discovery', 'technical'],
  },
  {
    title: 'App Store Algorithm',
    slug: 'how-the-app-store-algorithm-works',
    excerpt:
      'The app store algorithm ranks apps in search and browse by combining relevance signals with authority and behavioral signals.',
    content: p(
      'The app store algorithm is the ranking system Apple and Google use to order results in search and browse. While the exact formulas are undisclosed, both blend two broad signal families: <strong>relevance</strong> (how well your metadata matches the query and category) and <strong>authority/behavior</strong> (install velocity, conversion rate, ratings, retention, and engagement).',
      'In practice this means metadata gets you eligible to rank, but behavioral performance determines how high. An app with perfect keywords but weak conversion and retention will be outranked by a slightly less optimized app users clearly prefer.',
      'Effective ASO therefore works both levers at once: precise, broad keyword coverage and a listing that genuinely converts and retains.',
    ),
    tags: ['fundamentals', 'algorithm'],
  },
  {
    title: 'Search Relevance',
    slug: 'what-is-search-relevance-aso',
    excerpt:
      'Search relevance is how closely the store judges your app to match a query, the gate that decides which terms you can rank for.',
    content: p(
      'Search relevance is the store’s assessment of how well your app matches a given search query. It is determined chiefly by your metadata — whether the query’s terms are indexed to your app and how prominently (a title match counts more than a keyword-field match).',
      'Relevance is the gate before competition: you can only rank for terms the algorithm considers relevant to you, and you rank highest for the terms where your relevance is strongest and your authority signals back it up.',
      'Improving relevance means aligning your metadata tightly with the language your target users actually search, then letting conversion and velocity lift you within that relevant set.',
    ),
    tags: ['keywords', 'algorithm', 'fundamentals'],
  },
  {
    title: 'Click-Through Rate (CTR)',
    slug: 'what-is-click-through-rate-aso',
    excerpt:
      'Click-through rate is the share of people who click your listing after seeing it — in app stores, closely related to tap-through rate.',
    content: p(
      'Click-through rate (CTR) is the percentage of viewers who click on your app or listing after seeing it. In an app store context it is essentially the tap-through rate from an impression to your product page; in web search and ad contexts, the click from a result to your destination.',
      'CTR isolates the appeal of what’s visible before the click — the icon, title, and any preview snippet. A strong CTR means your first impression resonates with searchers; a weak one means you’re being seen but not chosen.',
      'Because stores and search engines treat clicks as a relevance vote, improving CTR often improves ranking as well as raw traffic.',
    ),
    tags: ['metrics', 'conversion', 'funnel'],
  },
  {
    title: 'Store Listing Experiments',
    slug: 'what-are-store-listing-experiments',
    excerpt:
      'Store Listing Experiments are Google Play’s native A/B testing tool for icons, screenshots, descriptions, and other listing assets.',
    content: p(
      'Store Listing Experiments are Google Play’s built-in A/B testing feature, accessed through the Play Console. They let you run controlled tests of your icon, screenshots, feature graphic, video, and descriptions, splitting live traffic and reporting which variant lifts installs with statistical confidence.',
      'You can run a global experiment or localized ones, and test a default listing against multiple variants at once. Because results come from real Play Store visitors and Google’s own install data, they’re reliable inputs for conversion decisions.',
      'They are the Google Play counterpart to Apple’s Product Page Optimization, and the recommended way to validate any creative change before rolling it out.',
    ),
    tags: ['conversion', 'google-play', 'testing'],
  },
  {
    title: 'Seasonality',
    slug: 'what-is-aso-seasonality',
    excerpt:
      'Seasonality is the predictable rise and fall in search demand and installs tied to times of year, holidays, and recurring events.',
    content: p(
      'Seasonality in ASO refers to predictable swings in search volume, install intent, and competition driven by the calendar — New Year resolutions lifting fitness and finance apps, December gifting for games, back-to-school for education, tax season for finance tools.',
      'Capitalizing on it means preparing in advance: research seasonal keywords, refresh screenshots and promotional text to match the moment, and time updates or featuring pitches to ride the demand wave. Apple’s promotional text and Google’s custom store listings make seasonal swaps easy without a full release.',
      'Ignoring seasonality leaves installs on the table during peaks and wastes spend competing during troughs.',
    ),
    tags: ['strategy', 'keywords'],
  },
  {
    title: 'Competitor Analysis',
    slug: 'aso-competitor-analysis',
    excerpt:
      'ASO competitor analysis studies rival apps’ keywords, creatives, and ratings to find opportunities and benchmark your own listing.',
    content: p(
      'ASO competitor analysis is the systematic study of the apps you compete with for visibility — not just obvious rivals, but any app ranking for your target keywords. It reveals which terms competitors own, how they position their creatives, what their ratings and review themes are, and where gaps exist.',
      'Done regularly, it informs your keyword targeting (find terms competitors rank for that you don’t), your creative strategy (spot conventions to match and clichés to break), and your roadmap (recurring complaints in their reviews are your feature opportunities).',
      'The aim is not to copy but to find under-served angles where you can differentiate and win impressions.',
    ),
    tags: ['strategy', 'research', 'keywords'],
  },
  {
    title: 'Share of Voice (SOV)',
    slug: 'what-is-share-of-voice-aso',
    excerpt:
      'Share of voice measures how much of the visibility for a keyword set your app captures relative to all competitors.',
    content: p(
      'Share of voice (SOV) in ASO quantifies how much of the available visibility across a set of keywords your app captures versus competitors. It weights your rankings by the search volume of each term, so ranking #1 for a popular keyword contributes far more SOV than ranking #1 for an obscure one.',
      'SOV turns a scattered list of individual rankings into a single competitive scoreboard, making it easy to see whether you’re gaining or losing ground in your category overall. It’s especially useful for tracking the impact of an ASO campaign over time.',
      'The AI-era analog, prompt share of voice, applies the same idea to mentions inside LLM answers.',
    ),
    tags: ['metrics', 'strategy', 'keywords'],
  },
]
