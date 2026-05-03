import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { ScoreBar } from '../../src/components/ScoreBar'
import { Pill } from '../../src/components/Pill'

export default function OverviewScreen() {
  const { colors } = useTheme()
  const { app, loading: appLoading } = useAppData()
  const { data, loading: l1, refetch: r1 } = useAnalysis<Record<string, unknown>>(app?.id, 'overview')
  const { data: visData, loading: l2, refetch: r2 } = useAnalysis<Record<string, unknown>>(app?.id, 'visibility')
  const { data: kwData, loading: l3, refetch: r3 } = useAnalysis<Array<Record<string, unknown>> | Record<string, unknown>>(app?.id, 'keywords')
  const { data: reviewsData, loading: l4, refetch: r4 } = useAnalysis<Record<string, unknown>>(app?.id, 'reviews-analysis')
  const { data: recsData, refetch: r5 } = useAnalysis<Array<Record<string, unknown>>>(app?.id, 'recommendations')
  const { data: llmData, refetch: r6 } = useAnalysis<Record<string, unknown>>(app?.id, 'llm-track')
  const { data: compRaw, refetch: r7 } = useAnalysis<Record<string, unknown> | Array<Record<string, unknown>>>(app?.id, 'competitors')
  const [refreshing, setRefreshing] = useState(false)

  const loading = l1 || l2 || l3 || l4

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([r1(), r2(), r3(), r4(), r5(), r6(), r7()])
    setRefreshing(false)
  }, [r1, r2, r3, r4, r5, r6, r7])

  // Combine data from multiple analysis sources (like the web does)
  const asoScore = Number(data?.asoScore ?? 0)
  const visScore = Number(visData?.overallScore ?? 0)

  // Keywords can be array directly or { keywords: [...] }
  const keywords = Array.isArray(kwData) ? kwData : (Array.isArray((kwData as Record<string, unknown>)?.keywords) ? (kwData as Record<string, unknown>).keywords as Array<Record<string, unknown>> : [])
  const kwCount = keywords.length
  const avgRating = Number(reviewsData?.averageRating ?? data?.storeRating ?? 0)

  // Top keywords sorted by volume
  const topKw = [...keywords].sort((a, b) => Number(b.volume ?? 0) - Number(a.volume ?? 0)).slice(0, 8)

  // LLM data
  const llmResults = Array.isArray(llmData?.results) ? llmData.results as Array<Record<string, unknown>> : []
  const llmMentioned = llmResults.filter(r => r.mentioned === true || r.mentioned === 'true')
  const llmSov = llmResults.length > 0 ? Math.round((llmMentioned.length / llmResults.length) * 100) : 0
  const posMap: Record<string, number> = { '1st': 100, '2nd': 75, '3rd': 50, 'not listed': 0 }

  // Competitors
  const competitors = Array.isArray(compRaw)
    ? compRaw
    : (Array.isArray((compRaw as Record<string, unknown>)?.competitors)
      ? (compRaw as Record<string, unknown>).competitors as Array<Record<string, unknown>>
      : [])
  const compAlerts = !Array.isArray(compRaw) && compRaw ? (Array.isArray((compRaw as Record<string, unknown>).alerts) ? (compRaw as Record<string, unknown>).alerts as Array<Record<string, unknown>> : []) : []
  const highThreats = competitors.filter(c => String(c.threatLevel ?? '').toLowerCase() === 'high').length

  // Visibility details
  const catRank = String(visData?.categoryRank ?? '--')
  const shareOfSearch = String(visData?.shareOfSearch ?? '--')
  const top10Kw = keywords.filter(k => Number(k.rank ?? 999) <= 10).length

  // Recommendations from dedicated analysis or overview priorities
  const recs = Array.isArray(recsData) ? recsData : (Array.isArray(data?.priorities) ? data.priorities as Array<Record<string, unknown>> : [])

  // Summary
  const summary = String(data?.summary ?? '')

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Every signal, one{' '}
        <Text style={[styles.titleAccent, { color: colors.accent }]}>command center</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>
        {app?.name ? `${app.name} — real-time health check` : 'Loading your app...'}
      </Text>

      {(loading || appLoading) && !data && !visData && !kwData ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching analysis data...</Text></Card>
      ) : !data && !visData && !kwData ? (
        <Card title="No data yet">
          <Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run a sync from the web dashboard to generate your overview analysis.</Text>
        </Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'ASO SCORE', value: String(asoScore), deltaType: asoScore > 60 ? 'up' : 'down' },
            { label: 'VISIBILITY', value: String(visScore) },
            { label: 'KEYWORDS', value: kwCount.toLocaleString() },
            { label: 'LLM SOV', value: llmSov > 0 ? `${llmSov}%` : '--' },
            { label: 'AVG RATING', value: avgRating > 0 ? avgRating.toFixed(1) : '--', deltaType: avgRating >= 4 ? 'up' : 'down' },
          ]} />

          {/* ASO Score Display */}
          <Card title="ASO Health" tag="OVERALL">
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreBig, { color: colors.ink }]}>{asoScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.ink3 }]}>ASO SCORE</Text>
              <View style={styles.scoreMinis}>
                <View style={styles.scoreMini}>
                  <Text style={[styles.miniVal, { color: colors.ink }]}>{visScore}</Text>
                  <Text style={[styles.miniLabel, { color: colors.ink3 }]}>Visibility</Text>
                </View>
                <View style={styles.scoreMini}>
                  <Text style={[styles.miniVal, { color: colors.ink }]}>{avgRating > 0 ? avgRating.toFixed(1) : '--'}</Text>
                  <Text style={[styles.miniLabel, { color: colors.ink3 }]}>Rating</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Keyword Snapshot */}
          {topKw.length > 0 && (
            <>
              <SectionHead num="01" title="Keyword" accent="snapshot" />
              {/* Visibility card */}
              <Card>
                <View style={styles.visRow}>
                  <View style={styles.visItem}>
                    <Text style={[styles.visVal, { color: colors.ink }]}>{catRank}</Text>
                    <Text style={[styles.visLabel, { color: colors.ink3 }]}>Category Rank</Text>
                  </View>
                  <View style={styles.visItem}>
                    <Text style={[styles.visVal, { color: colors.ink }]}>{shareOfSearch}</Text>
                    <Text style={[styles.visLabel, { color: colors.ink3 }]}>Share of Search</Text>
                  </View>
                  <View style={styles.visItem}>
                    <Text style={[styles.visVal, { color: colors.ink }]}>{top10Kw}</Text>
                    <Text style={[styles.visLabel, { color: colors.ink3 }]}>Top 10 KW</Text>
                  </View>
                </View>
              </Card>
              {/* Top Keywords table */}
              <Card noPadding>
                <View style={[styles.tableHeader, { backgroundColor: colors.paper2 }]}>
                  <Text style={[styles.th, { color: colors.ink3, flex: 1 }]}>KEYWORD</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 50, textAlign: 'right' }]}>RANK</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 50, textAlign: 'right' }]}>VOL</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 40, textAlign: 'right' }]}>Δ 7D</Text>
                </View>
                {topKw.slice(0, 5).map((kw, i) => {
                  const change = Number(kw.delta7d ?? 0)
                  return (
                    <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                      <Text style={[styles.td, { color: colors.ink2, flex: 1 }]} numberOfLines={1}>{String(kw.keyword ?? kw.term ?? '')}</Text>
                      <Text style={[styles.tdNum, { color: colors.ink, width: 50 }]}>{String(kw.rank ?? kw.position ?? '--')}</Text>
                      <Text style={[styles.td, { color: colors.ink2, width: 50, textAlign: 'right' }]}>{formatNum(Number(kw.volume ?? 0))}</Text>
                      <View style={{ width: 40, alignItems: 'flex-end' }}>
                        {change !== 0 ? (
                          <Pill text={change > 0 ? `+${change}` : String(change)} variant={change > 0 ? 'ok' : 'warn'} />
                        ) : (
                          <Text style={[styles.td, { color: colors.ink4, textAlign: 'right' }]}>--</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* Competitor Threats */}
          {competitors.length > 0 && (
            <>
              <SectionHead num="02" title="Competitor" accent="threats" />
              <Card>
                {competitors.slice(0, 5).map((comp, i) => {
                  const threat = String(comp.threatLevel ?? 'medium').toLowerCase()
                  const shared = Number(comp.sharedKeywords ?? comp.overlapCount ?? 0)
                  const gaps = Number(comp.keywordGaps ?? 0)
                  return (
                    <View key={i} style={[styles.compRow, i < Math.min(competitors.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <View style={styles.compInfo}>
                        <Text style={[styles.compName, { color: colors.ink }]}>{String(comp.name ?? '')}</Text>
                        <Text style={[styles.compMeta, { color: colors.ink3 }]}>
                          {shared > 0 ? `${shared} shared KW` : ''}{gaps > 0 ? ` · ${gaps} gaps` : ''}
                        </Text>
                      </View>
                      <Pill text={threat} variant={threat === 'high' ? 'warn' : threat === 'low' ? 'muted' : 'accent'} />
                    </View>
                  )
                })}
                {highThreats > 0 && (
                  <View style={[styles.callout, { backgroundColor: colors.warnWash, borderLeftColor: colors.warn }]}>
                    <Text style={[styles.calloutText, { color: colors.warn }]}>{highThreats} high-threat competitor{highThreats > 1 ? 's' : ''} detected</Text>
                  </View>
                )}
              </Card>
            </>
          )}

          {/* LLM Share of Voice */}
          {llmResults.length > 0 && (
            <>
              <SectionHead num="03" title="LLM Share of" accent="Voice" />
              <Card>
                {llmResults.map((r, i) => {
                  const pct = r.mentioned ? (posMap[String(r.position ?? '')] ?? 25) : 0
                  return (
                    <View key={i} style={styles.barRow}>
                      <Text style={[styles.barLabel, { color: colors.ink2 }]}>{String(r.surface ?? '')}</Text>
                      <View style={[styles.barTrack, { backgroundColor: colors.paper3 }]}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: r.mentioned ? colors.accent : colors.warn }]} />
                      </View>
                      <Text style={[styles.barVal, { color: r.mentioned ? colors.ink : colors.ink4 }]}>
                        {r.mentioned ? String(r.position ?? '') : 'N/A'}
                      </Text>
                    </View>
                  )
                })}
                <View style={styles.llmFooter}>
                  <Text style={[styles.llmFooterText, { color: colors.ink3 }]}>Share of Voice: {llmSov}% · Cited in: {llmMentioned.length}/{llmResults.length}</Text>
                </View>
              </Card>
            </>
          )}

          {/* Top Recommendations */}
          {recs.length > 0 && (
            <>
              <SectionHead num="04" title="Top" accent="recommendations" />
              <Card>
                {recs.slice(0, 5).map((rec, i) => {
                  const impact = String(rec.priority ?? rec.impact ?? 'medium').toLowerCase()
                  return (
                    <View key={i} style={[styles.recRow, i < Math.min(recs.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <View style={[styles.recNum, { backgroundColor: impact === 'high' ? colors.warnWash : colors.paper2 }]}>
                        <Text style={[styles.recNumText, { color: impact === 'high' ? colors.warn : colors.ink3 }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.recContent}>
                        <Text style={[styles.recTitle, { color: colors.ink }]}>{String(rec.title ?? rec.action ?? '')}</Text>
                        <Text style={[styles.recDesc, { color: colors.ink3 }]}>{String(rec.detail ?? rec.description ?? '')}</Text>
                        <View style={styles.recMeta}>
                          <Pill text={impact.toUpperCase()} variant={impact === 'high' ? 'high' : impact === 'low' ? 'low' : 'medium'} />
                          {rec.effort ? <Pill text={String(rec.effort)} variant="muted" /> : null}
                          {rec.lift ? <Text style={[styles.recLift, { color: colors.accent }]}>↑ {String(rec.lift)}{rec.liftUnit ? ` ${rec.liftUnit}` : ''}</Text> : null}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* Summary */}
          {summary ? (
            <Card>
              <Text style={[styles.summaryText, { color: colors.ink }]}>{summary}</Text>
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  )
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, lineHeight: 33, marginBottom: 6 },
  titleAccent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  scoreCenter: { alignItems: 'center', paddingVertical: 12 },
  scoreBig: { fontSize: 48, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -1 },
  scoreLabel: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium', marginTop: -4 },
  scoreMinis: { flexDirection: 'row', gap: 32, marginTop: 14 },
  scoreMini: { alignItems: 'center' },
  miniVal: { fontSize: 20, fontFamily: 'InstrumentSerif_400Regular' },
  miniLabel: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'InterTight_400Regular' },
  // Visibility metrics
  visRow: { flexDirection: 'row', justifyContent: 'space-around' },
  visItem: { alignItems: 'center' },
  visVal: { fontSize: 18, fontFamily: 'InstrumentSerif_400Regular' },
  visLabel: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'InterTight_400Regular', marginTop: 2 },
  // Table
  tableHeader: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  td: { fontSize: 12, fontFamily: 'InterTight_400Regular' },
  tdNum: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular', textAlign: 'right' },
  // Competitor threats
  compRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  compInfo: { flex: 1 },
  compName: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  compMeta: { fontSize: 10, fontFamily: 'InterTight_400Regular', marginTop: 2 },
  callout: { padding: 10, borderLeftWidth: 3, borderRadius: 6, marginTop: 8 },
  calloutText: { fontSize: 12, fontFamily: 'InterTight_600SemiBold' },
  // LLM bars
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontSize: 12, fontFamily: 'InterTight_400Regular', minWidth: 80 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barVal: { fontSize: 13, fontFamily: 'InstrumentSerif_400Regular', minWidth: 36, textAlign: 'right' },
  llmFooter: { marginTop: 4 },
  llmFooterText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  // Recommendations
  recRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  recNum: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  recNumText: { fontSize: 10, fontFamily: 'InterTight_600SemiBold' },
  recContent: { flex: 1 },
  recTitle: { fontSize: 13, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  recDesc: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
  recMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  recLift: { fontSize: 11, fontFamily: 'InterTight_600SemiBold' },
  summaryText: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 20 },
})
