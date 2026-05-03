'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'

export default function ApiDataPage() {
  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: 'System' },
          { label: 'API & Data', isActive: true },
        ]}
      />

      <PageHero
        title={<>Every data point. <em>Every tier.</em></>}
        subtitle="REST API and webhooks at the $49 Solo tier. Warehouse sync at Enterprise."
      />

      <div className="content">
        {/* § 01 Quick start */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 01</span><h2>Quick start</h2></div></div>
          <div className="code-block">
            <span className="c-comment"># Pull LLM share-of-voice</span>{'\n'}
            {'curl https://api.surface.dev/v1/llm/sov \\'}{'\n'}
            {'  -H '}<span className="c-str">&quot;Authorization: Bearer sk_live_...&quot;</span>{' \\'}{'\n'}
            {'  -G -d '}<span className="c-str">&quot;app_id=lumen_finance&quot;</span>{' -d '}<span className="c-str">&quot;period=30d&quot;</span>{'\n'}
            {'\n'}
            <span className="c-comment"># Response</span>{'\n'}
            {'{'}{'\n'}
            {'  '}<span className="c-key">&quot;sov&quot;</span>: <span className="c-num">0.23</span>,{'\n'}
            {'  '}<span className="c-key">&quot;by_engine&quot;</span>: {'{'} <span className="c-key">&quot;chatgpt&quot;</span>: <span className="c-num">0.38</span>, <span className="c-key">&quot;claude&quot;</span>: <span className="c-num">0.62</span>, <span className="c-key">&quot;gemini&quot;</span>: <span className="c-num">0.14</span> {'}'},
            {'\n'}
            {'  '}<span className="c-key">&quot;samples&quot;</span>: <span className="c-num">5880</span>, <span className="c-key">&quot;confidence&quot;</span>: <span className="c-num">0.942</span>{'\n'}
            {'}'}
          </div>
        </section>

        {/* § 02 Webhooks */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 02</span><h2>Webhooks</h2></div></div>
          <div className="card">
            <table className="data-table">
              <thead><tr><th>Event</th><th>Description</th><th>Tier</th></tr></thead>
              <tbody>
                <tr><td><code>keyword.rank.changed</code></td><td>Position moves +/- 3</td><td><span className="pill ok">Solo+</span></td></tr>
                <tr><td><code>llm.sov.dropped</code></td><td>Share of voice drops 5pt</td><td><span className="pill ok">Solo+</span></td></tr>
                <tr><td><code>review.cluster.spike</code></td><td>New theme cluster detected</td><td><span className="pill test">Team+</span></td></tr>
                <tr><td><code>competitor.feature.shipped</code></td><td>Competitor releases feature</td><td><span className="pill test">Team+</span></td></tr>
                <tr><td><code>creative.test.winner</code></td><td>95% confidence reached</td><td><span className="pill test">Team+</span></td></tr>
                <tr><td><code>agent.manifest.required</code></td><td>New agent spec published</td><td><span className="pill live">Enterprise</span></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
