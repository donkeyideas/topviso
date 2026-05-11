import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'
import { SortableHeader } from '../../src/components/SortableHeader'
import { useSortable } from '../../src/hooks/useSortable'

const trafficColumns = [
  { label: 'KEYWORD', key: 'keyword', flex: 1 },
  { label: 'RANK', key: 'rank', width: 40, align: 'right' as const },
  { label: 'VOL', key: 'volume', width: 50, align: 'right' as const },
  { label: 'TRAFFIC', key: 'estimatedTraffic', width: 50, align: 'right' as const },
  { label: 'TREND', key: 'trend', width: 44, align: 'right' as const },
]

const versionColumns = [
  { label: 'VER', key: 'version', width: 50 },
  { label: 'CHANGES', key: 'changes', flex: 1 },
  { label: 'IMPACT', key: 'asoImpact', width: 50, align: 'right' as const },
]

export default function GrowthScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data, loading, refetch } = useAnalysis<Record<string, unknown>>(app?.id, 'growth-insights')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const currentInstalls = String(data?.currentInstalls ?? '--')
  const currentRating = Number(data?.currentRating ?? 0)
  const currentRatings = Number(data?.currentRatings ?? 0)
  const visScore = Number(data?.visibilityScore ?? 0)
  const totalTraffic = Number(data?.totalEstimatedTraffic ?? 0)
  const kwVisibility = Array.isArray(data?.keywordVisibility) ? data.keywordVisibility as Array<Record<string, unknown>> : []
  const recs = Array.isArray(data?.growthRecommendations) ? data.growthRecommendations as Array<Record<string, unknown>> : []
  const installTrend = data?.installTrend as Record<string, unknown> | undefined
  const ratingTrend = data?.ratingTrend as Record<string, unknown> | undefined
  const versionHistory = Array.isArray(data?.versionHistory) ? data.versionHistory as Array<Record<string, unknown>> : []
  const nextUpdatePlan = Array.isArray(data?.nextUpdatePlan) ? data.nextUpdatePlan as Array<Record<string, unknown>> : []
  const metadataTests = Array.isArray(data?.metadataTests) ? data.metadataTests as Array<Record<string, unknown>> : []
  const updateFrequency = String(data?.updateFrequency ?? '')
  const releaseNotesTips = Array.isArray(data?.releaseNotesTips) ? data.releaseNotesTips as string[] : []

  const { sorted: sortedTraffic, sort: trafficSort, toggle: trafficToggle } = useSortable(kwVisibility)
  const { sorted: sortedVersions, sort: verSort, toggle: verToggle } = useSortable(versionHistory)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Growth at a <Text style={[styles.accent, { color: colors.accent }]}>glance</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Install trends, traffic estimates, and growth levers.</Text>

      {!data && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching growth data...</Text></Card>
      ) : !data ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run growth analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'INSTALLS', value: currentInstalls },
            { label: 'RATING', value: currentRating > 0 ? currentRating.toFixed(1) : '--', deltaType: currentRating >= 4 ? 'up' : 'down' },
            { label: 'VISIBILITY', value: String(visScore) },
            { label: 'EST. TRAFFIC', value: totalTraffic > 0 ? formatNum(totalTraffic) : '--' },
            { label: 'VERSIONS', value: String(versionHistory.length || '--') },
          ]} />

          {/* Install trend */}
          {installTrend && Array.isArray(installTrend.dates) && (installTrend.dates as string[]).length > 0 && (
            <>
              <SectionHead num="01" title="Install" accent="trend" />
              <Card>
                <View style={styles.trendRow}>
                  {(installTrend.values as number[]).slice(-7).map((val, i) => {
                    const max = Math.max(...(installTrend.values as number[]).slice(-7))
                    const h = max > 0 ? (Number(val) / max) * 60 : 0
                    return (
                      <View key={i} style={styles.trendBarCol}>
                        <View style={[styles.trendBar, { height: h, backgroundColor: colors.accent }]} />
                        <Text style={[styles.trendLabel, { color: colors.ink4 }]}>
                          {String((installTrend.dates as string[])[(installTrend.dates as string[]).length - 7 + i] ?? '').slice(-5)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </Card>
            </>
          )}

          {/* Rating trend */}
          {ratingTrend && Array.isArray(ratingTrend.scores) && (ratingTrend.scores as number[]).length > 0 && (
            <>
              <SectionHead num="02" title="Rating" accent="trend" />
              <Card>
                <View style={styles.ratingRow}>
                  <Text style={[styles.ratingBig, { color: colors.ink }]}>{currentRating > 0 ? currentRating.toFixed(1) : '--'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ratingMeta, { color: colors.ink3 }]}>{formatNum(currentRatings)} ratings</Text>
                    <Text style={[styles.ratingMeta, { color: colors.ink4 }]}>
                      {(ratingTrend.scores as number[]).length} data points
                    </Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* Keyword visibility */}
          {kwVisibility.length > 0 && (
            <>
              <SectionHead num="03" title="Keyword" accent="traffic" />
              {totalTraffic > 0 && (
                <View style={styles.trafficHeader}>
                  <Text style={[styles.trafficVal, { color: colors.ink }]}>{formatNum(totalTraffic)}</Text>
                  <Text style={[styles.trafficLabel, { color: colors.ink3 }]}>Total est. traffic</Text>
                </View>
              )}
              <Card noPadding>
                <SortableHeader columns={trafficColumns} sort={trafficSort} onSort={trafficToggle} />
                {sortedTraffic.slice(0, 10).map((kw, i) => (
                  <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.td, { color: colors.ink2, flex: 1 }]} numberOfLines={1}>{String(kw.keyword ?? '')}</Text>
                    <Text style={[styles.tdNum, { color: colors.ink, width: 40 }]}>{kw.rank != null ? String(kw.rank) : '--'}</Text>
                    <Text style={[styles.td, { color: colors.ink2, width: 50, textAlign: 'right' }]}>{formatNum(Number(kw.volume ?? 0))}</Text>
                    <Text style={[styles.td, { color: colors.ink2, width: 50, textAlign: 'right' }]}>{formatNum(Number(kw.estimatedTraffic ?? 0))}</Text>
                    <View style={{ width: 44, alignItems: 'flex-end' }}>
                      {kw.trend ? (
                        <Pill text={String(kw.trend)} variant={kw.trend === 'up' ? 'ok' : kw.trend === 'down' ? 'warn' : 'muted'} />
                      ) : (
                        <Pill text="--" variant="muted" />
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Growth recommendations */}
          {recs.length > 0 && (
            <>
              <SectionHead num="04" title="Growth" accent="playbook" />
              <Card>
                {recs.slice(0, 5).map((rec, i) => (
                  <View key={i} style={[styles.recRow, i < Math.min(recs.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={[styles.recNum, { backgroundColor: colors.okWash }]}>
                      <Text style={[styles.recNumText, { color: colors.ok }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.recContent}>
                      <Text style={[styles.recTitle, { color: colors.ink }]}>{String(rec.title ?? '')}</Text>
                      {rec.detail ? <Text style={[styles.recDetail, { color: colors.ink3 }]}>{String(rec.detail)}</Text> : null}
                      {rec.impact ? <Pill text={String(rec.impact)} variant={rec.impact === 'high' ? 'high' : rec.impact === 'low' ? 'low' : 'medium'} /> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Version Timeline */}
          {versionHistory.length > 0 && (
            <>
              <SectionHead num="05" title="Version" accent="timeline" />
              <Card noPadding>
                <SortableHeader columns={versionColumns} sort={verSort} onSort={verToggle} />
                {sortedVersions.slice(0, 8).map((v, i) => {
                  const impact = String(v.asoImpact ?? '').toLowerCase()
                  const changes = Array.isArray(v.changes) ? (v.changes as string[]).join(', ') : String(v.changes ?? '')
                  return (
                    <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                      <View style={{ width: 50 }}>
                        <Text style={[styles.versionNum, { color: colors.ink }]}>{String(v.version ?? '')}</Text>
                        {v.date ? <Text style={[styles.versionDate, { color: colors.ink4 }]}>{String(v.date).slice(0, 10)}</Text> : null}
                      </View>
                      <Text style={[styles.td, { color: colors.ink2, flex: 1 }]} numberOfLines={2}>{changes}</Text>
                      <View style={{ width: 50, alignItems: 'flex-end' }}>
                        <Pill text={impact || '--'} variant={impact === 'positive' ? 'ok' : impact === 'negative' ? 'warn' : 'muted'} />
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* Next Update Plan */}
          {nextUpdatePlan.length > 0 && (
            <>
              <SectionHead num="06" title="Next update" accent="plan" />
              {nextUpdatePlan.map((item, i) => {
                const priority = String(item.priority ?? 'medium').toLowerCase()
                return (
                  <Card key={i}>
                    <View style={styles.planHeader}>
                      <Text style={[styles.planTitle, { color: colors.ink }]}>{String(item.change ?? '')}</Text>
                      <Pill text={priority.toUpperCase()} variant={priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium'} />
                    </View>
                    {item.expectedImpact ? (
                      <Text style={[styles.planDetail, { color: colors.ink3 }]}>{String(item.expectedImpact)}</Text>
                    ) : null}
                  </Card>
                )
              })}
            </>
          )}

          {/* Metadata Tests */}
          {metadataTests.length > 0 && (
            <>
              <SectionHead num="07" title="Metadata" accent="tests" />
              {metadataTests.slice(0, 4).map((test, i) => (
                <Card key={i} title={String(test.element ?? '')} tag="A/B TEST">
                  {test.current ? (
                    <View style={styles.testRow}>
                      <Text style={[styles.testLabel, { color: colors.ink4 }]}>CURRENT</Text>
                      <Text style={[styles.testVal, { color: colors.ink }]}>{String(test.current)}</Text>
                    </View>
                  ) : null}
                  {test.suggested ? (
                    <View style={styles.testRow}>
                      <Text style={[styles.testLabel, { color: colors.accent }]}>SUGGESTED</Text>
                      <Text style={[styles.testVal, { color: colors.ink }]}>{String(test.suggested)}</Text>
                    </View>
                  ) : null}
                  {test.hypothesis ? (
                    <View style={[styles.hypothesisBox, { backgroundColor: colors.accentWash }]}>
                      <Text style={[styles.hypothesisText, { color: colors.accent }]}>{String(test.hypothesis)}</Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </>
          )}

          {/* Update Frequency */}
          {updateFrequency ? (
            <Card title="Update Frequency">
              <Text style={[styles.freqText, { color: colors.ink }]}>{updateFrequency}</Text>
            </Card>
          ) : null}

          {/* Release Notes Tips */}
          {releaseNotesTips.length > 0 && (
            <Card title="Release Notes Tips">
              {releaseNotesTips.map((tip, i) => (
                <Text key={i} style={[styles.tipItem, { color: colors.ink2 }]}>• {String(tip)}</Text>
              ))}
            </Card>
          )}

          {/* Summary */}
          {data?.summary ? (
            <Card>
              <Text style={[styles.summaryText, { color: colors.ink }]}>{String(data.summary)}</Text>
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
  accent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 80, paddingTop: 10 },
  trendBarCol: { alignItems: 'center', gap: 4 },
  trendBar: { width: 20, borderRadius: 3 },
  trendLabel: { fontSize: 8, fontFamily: 'InterTight_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingBig: { fontSize: 36, fontFamily: 'InstrumentSerif_400Regular' },
  ratingMeta: { fontSize: 11, fontFamily: 'InterTight_400Regular' },
  trafficHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  trafficVal: { fontSize: 24, fontFamily: 'InstrumentSerif_400Regular' },
  trafficLabel: { fontSize: 11, fontFamily: 'InterTight_400Regular' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  td: { fontSize: 12, fontFamily: 'InterTight_400Regular' },
  tdNum: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular', textAlign: 'right' },
  recRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  recNum: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  recNumText: { fontSize: 10, fontFamily: 'InterTight_600SemiBold' },
  recContent: { flex: 1 },
  recTitle: { fontSize: 13, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  recDetail: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
  versionNum: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  versionDate: { fontSize: 9, fontFamily: 'InterTight_400Regular' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planTitle: { fontSize: 14, fontFamily: 'InterTight_600SemiBold', flex: 1 },
  planDetail: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17 },
  testRow: { marginBottom: 8 },
  testLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  testVal: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18 },
  hypothesisBox: { padding: 10, borderRadius: 6, marginTop: 4 },
  hypothesisText: { fontSize: 12, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 17 },
  freqText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 19 },
  tipItem: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 4 },
  summaryText: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 20 },
})
