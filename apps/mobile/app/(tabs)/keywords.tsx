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

export default function KeywordsScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data: rawData, loading: l1, refetch: r1 } = useAnalysis<Array<Record<string, unknown>> | Record<string, unknown>>(app?.id, 'keywords')
  const { data: visData, refetch: r2 } = useAnalysis<Record<string, unknown>>(app?.id, 'visibility')
  const [refreshing, setRefreshing] = useState(false)
  const loading = l1

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([r1(), r2()])
    setRefreshing(false)
  }, [r1, r2])

  // Keywords analysis stores as array directly OR { keywords: [...] }
  const keywords = Array.isArray(rawData) ? rawData : (Array.isArray((rawData as Record<string, unknown>)?.keywords) ? (rawData as Record<string, unknown>).keywords as Array<Record<string, unknown>> : [])
  const data = Array.isArray(rawData) ? null : rawData as Record<string, unknown> | null
  const clusters = Array.isArray(data?.intentClusters) ? data.intentClusters as Array<Record<string, unknown>> : []
  const totalKw = keywords.length
  const ranked = keywords.filter(k => k.rank != null && Number(k.rank) > 0)
  const top10 = ranked.filter(k => Number(k.rank) <= 10).length
  const top3 = ranked.filter(k => Number(k.rank) <= 3).length
  const avgPos = ranked.length > 0 ? Math.round(ranked.reduce((s, k) => s + Number(k.rank ?? 0), 0) / ranked.length) : 0
  const vis = Number(visData?.overallScore ?? 0)
  const avgDiff = keywords.length > 0 ? Math.round(keywords.reduce((s, k) => s + Number(k.difficulty ?? 0), 0) / keywords.length) : 0
  const avgRel = keywords.length > 0 ? Math.round(keywords.reduce((s, k) => s + Number(k.relevance ?? 0), 0) / keywords.length) : 0
  const totalVol = keywords.reduce((s, k) => s + Number(k.volume ?? 0), 0)

  // Visibility details
  const catRank = String(visData?.categoryRank ?? '--')
  const shareOfSearch = String(visData?.shareOfSearch ?? '--')
  const rankDist = visData?.rankingDistribution as Record<string, number> | undefined

  // Suggested keywords (high relevance, unranked or poorly ranked)
  const suggestedKw = [...keywords]
    .filter(k => Number(k.relevance ?? 0) >= 70 && (!k.rank || Number(k.rank) > 20))
    .sort((a, b) => Number(b.relevance ?? 0) - Number(a.relevance ?? 0))
    .slice(0, 6)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        The words that <Text style={[styles.titleAccent, { color: colors.accent }]}>drive</Text> discovery.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Track rankings, volume, and intent.</Text>

      {!rawData && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching keyword data...</Text></Card>
      ) : !rawData ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run keyword analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'TRACKED', value: String(totalKw) },
            { label: 'TOP 10', value: String(top10) },
            { label: 'AVG POSITION', value: String(avgPos) },
            { label: 'VISIBILITY', value: String(vis) },
          ]} />

          {/* Keyword Intelligence table */}
          {keywords.length > 0 && (
            <>
              <SectionHead num="01" title="Keyword" accent="intelligence" />
              <Card noPadding>
                <View style={[styles.tableHeader, { backgroundColor: colors.paper2 }]}>
                  <Text style={[styles.th, { color: colors.ink3, flex: 1 }]}>KEYWORD</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 38, textAlign: 'right' }]}>RANK</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 44, textAlign: 'right' }]}>VOL</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 32, textAlign: 'right' }]}>DIFF</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 36, textAlign: 'right' }]}>Δ 7D</Text>
                </View>
                {keywords.slice(0, 15).map((kw, i) => {
                  const change = Number(kw.delta7d ?? kw.change7d ?? kw.rankChange ?? 0)
                  const diff = Number(kw.difficulty ?? 0)
                  return (
                    <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.td, { color: colors.ink2 }]} numberOfLines={1}>{String(kw.keyword ?? kw.term ?? '')}</Text>
                        {kw.intent ? <Pill text={String(kw.intent)} variant="muted" /> : null}
                      </View>
                      <Text style={[styles.tdNum, { color: colors.ink, width: 38 }]}>{String(kw.rank ?? kw.position ?? '--')}</Text>
                      <Text style={[styles.td, { color: colors.ink2, width: 44, textAlign: 'right' }]}>{formatVol(kw.volume ?? kw.searchVolume)}</Text>
                      <Text style={[styles.td, { color: diff >= 70 ? colors.warn : diff >= 40 ? colors.gold : colors.ok, width: 32, textAlign: 'right' }]}>{diff > 0 ? String(diff) : '--'}</Text>
                      <View style={{ width: 36, alignItems: 'flex-end' }}>
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

          {/* Metadata Score */}
          <SectionHead num="02" title="Metadata" accent="score" />
          <Card>
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreBig, { color: colors.ink }]}>{ranked.length}</Text>
              <Text style={[styles.scoreMax, { color: colors.ink4 }]}>/{totalKw} ranked</Text>
            </View>
            <ScoreBar label="Keywords with rank" value={totalKw > 0 ? Math.round((ranked.length / totalKw) * 100) : 0} />
            <ScoreBar label="Top 10 positions" value={totalKw > 0 ? Math.round((top10 / totalKw) * 100) : 0} />
            <ScoreBar label="Top 3 positions" value={totalKw > 0 ? Math.round((top3 / totalKw) * 100) : 0} />
            <ScoreBar label="Avg difficulty" value={avgDiff} />
            <ScoreBar label="Avg relevance" value={avgRel} />
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.ink3 }]}>Total est. volume</Text>
              <Text style={[styles.metaVal, { color: colors.ink }]}>{formatVol(totalVol)}</Text>
            </View>
            {ranked.length < totalKw && (
              <View style={[styles.callout, { backgroundColor: colors.warnWash, borderLeftColor: colors.warn }]}>
                <Text style={[styles.calloutText, { color: colors.warn }]}>{totalKw - ranked.length} keywords not yet ranked</Text>
              </View>
            )}
          </Card>

          {/* Ranking distribution */}
          {rankDist && (
            <Card title="Ranking Distribution">
              <View style={styles.distRow}>
                {[
                  { label: 'Top 3', val: rankDist.top3 ?? 0, color: colors.ok },
                  { label: 'Top 10', val: rankDist.top10 ?? 0, color: colors.accent },
                  { label: 'Top 25', val: rankDist.top25 ?? 0, color: colors.gold },
                  { label: 'Top 50', val: rankDist.top50 ?? 0, color: colors.ink3 },
                  { label: 'Not Ranked', val: rankDist.notRanked ?? 0, color: colors.warn },
                ].map((d, i) => (
                  <View key={i} style={styles.distItem}>
                    <View style={[styles.distDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.distLabel, { color: colors.ink3 }]}>{d.label}</Text>
                    <Text style={[styles.distVal, { color: colors.ink }]}>{d.val}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Suggested Keywords */}
          {suggestedKw.length > 0 && (
            <>
              <SectionHead num="03" title="Suggested" accent="keywords" />
              <Card noPadding>
                <View style={[styles.tableHeader, { backgroundColor: colors.paper2 }]}>
                  <Text style={[styles.th, { color: colors.ink3, flex: 1 }]}>KEYWORD</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 40, textAlign: 'right' }]}>INTENT</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 36, textAlign: 'right' }]}>REL</Text>
                </View>
                {suggestedKw.map((kw, i) => (
                  <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.td, { color: colors.ink2, flex: 1 }]} numberOfLines={1}>{String(kw.keyword ?? '')}</Text>
                    <View style={{ width: 40, alignItems: 'flex-end' }}>
                      <Pill text={String(kw.intent ?? '--')} variant="muted" />
                    </View>
                    <Text style={[styles.tdNum, { color: colors.accent, width: 36 }]}>{String(kw.relevance ?? '--')}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Intent clusters */}
          {clusters.length > 0 && (
            <>
              <SectionHead num="04" title="Intent" accent="clusters" />
              <Card>
                {clusters.slice(0, 4).map((cl, i) => {
                  const coverage = Number(cl.coverage ?? cl.coveragePercent ?? 0)
                  const clKeywords = Array.isArray(cl.keywords) ? cl.keywords as Array<Record<string, unknown>> : []
                  return (
                    <View key={i} style={[styles.cluster, i < Math.min(clusters.length, 4) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <Text style={[styles.clusterName, { color: colors.ink }]}>{String(cl.name ?? cl.cluster ?? '')}</Text>
                      <View style={styles.coverageRow}>
                        <View style={[styles.coverageTrack, { backgroundColor: colors.paper3 }]}>
                          <View style={[styles.coverageFill, { width: `${coverage}%`, backgroundColor: colors.accent }]} />
                        </View>
                        <Text style={[styles.coveragePct, { color: colors.ink3 }]}>{coverage}%</Text>
                      </View>
                      <View style={styles.chipRow}>
                        {clKeywords.slice(0, 4).map((ck, j) => (
                          <View key={j} style={[styles.chip, { borderColor: colors.line, backgroundColor: colors.card }]}>
                            <Text style={[styles.chipText, { color: colors.ink2 }]}>{String(typeof ck === 'string' ? ck : ck.keyword ?? ck.term ?? '')}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

function formatVol(v: unknown): string {
  const n = Number(v)
  if (!n || isNaN(n)) return '--'
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
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  td: { fontSize: 12, fontFamily: 'InterTight_400Regular' },
  tdNum: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular', textAlign: 'right' },
  // Score center
  scoreCenter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 12 },
  scoreBig: { fontSize: 36, fontFamily: 'InstrumentSerif_400Regular' },
  scoreMax: { fontSize: 14, fontFamily: 'InterTight_400Regular', marginLeft: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metaLabel: { fontSize: 12, fontFamily: 'InterTight_400Regular' },
  metaVal: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular' },
  callout: { padding: 10, borderLeftWidth: 3, borderRadius: 6, marginTop: 8 },
  calloutText: { fontSize: 12, fontFamily: 'InterTight_600SemiBold' },
  // Ranking distribution
  distRow: { gap: 6 },
  distItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distDot: { width: 10, height: 10, borderRadius: 2 },
  distLabel: { fontSize: 12, fontFamily: 'InterTight_400Regular', flex: 1 },
  distVal: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular' },
  // Clusters
  cluster: { paddingVertical: 12 },
  clusterName: { fontSize: 16, fontFamily: 'InstrumentSerif_400Regular_Italic', marginBottom: 6 },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  coverageTrack: { width: 60, height: 4, borderRadius: 2, overflow: 'hidden' },
  coverageFill: { height: '100%', borderRadius: 2 },
  coveragePct: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
})
