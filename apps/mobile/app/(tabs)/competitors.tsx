import { View, Text, ScrollView, StyleSheet, RefreshControl, Image } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'

export default function CompetitorsScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data: rawData, loading, refetch } = useAnalysis<Record<string, unknown> | Array<Record<string, unknown>>>(app?.id, 'competitors')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Handle both { competitors: [...], alerts: [...] } and direct array format
  const data = rawData as Record<string, unknown> | null
  const competitors = Array.isArray(rawData) ? rawData : (Array.isArray(data?.competitors) ? data.competitors as Array<Record<string, unknown>> : [])
  const alerts = Array.isArray(data?.alerts) ? data.alerts as Array<Record<string, unknown>> : []
  const keywordGaps = Array.isArray(data?.keywordGaps) ? data.keywordGaps as Array<Record<string, unknown>> : []
  const sharedKeywords = Array.isArray(data?.sharedKeywords) ? data.sharedKeywords as Array<Record<string, unknown>> : []
  const highThreats = competitors.filter(c => String(c.threatLevel ?? c.threat ?? '').toLowerCase() === 'high').length
  const gapCount = Number(data?.totalGaps ?? keywordGaps.length)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Know your <Text style={[styles.titleAccent, { color: colors.accent }]}>battlefield</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Competitors tracked across rankings and store changes.</Text>

      {!rawData && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching competitor data...</Text></Card>
      ) : !rawData ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run competitor analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'TRACKED', value: String(competitors.length) },
            { label: 'HIGH THREATS', value: String(highThreats), deltaType: highThreats > 0 ? 'down' : 'up' },
            { label: 'KEYWORD GAPS', value: String(gapCount) },
            { label: 'ALERTS', value: String(alerts.length) },
          ]} />

          {/* Head to Head */}
          {competitors.length > 0 && (
            <>
              <SectionHead num="01" title="Head to" accent="head" />
              <Card noPadding>
                <View style={[styles.tableHeader, { backgroundColor: colors.paper2 }]}>
                  <Text style={[styles.th, { color: colors.ink3, flex: 1 }]}>APP</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 50, textAlign: 'right' }]}>RATING</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 42, textAlign: 'right' }]}>KW</Text>
                  <Text style={[styles.th, { color: colors.ink3, width: 50, textAlign: 'right' }]}>THREAT</Text>
                </View>
                {/* Your app row */}
                <View style={[styles.tableRow, { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {app?.icon_url ? (
                      <Image source={{ uri: app.icon_url }} style={styles.miniIcon} />
                    ) : (
                      <View style={[styles.miniIconFallback, { backgroundColor: colors.accent }]}>
                        <Text style={styles.miniIconText}>{(app?.name ?? 'A').charAt(0)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.compName, { color: colors.ink }]} numberOfLines={1}>{app?.name ?? 'Your App'}</Text>
                      <Text style={[styles.compDev, { color: colors.accent }]}>Your app</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdNum, { color: colors.ink, width: 50 }]}>{Number(data?.yourRating ?? app?.rating ?? 0) > 0 ? Number(data?.yourRating ?? app?.rating ?? 0).toFixed(1) : '--'}</Text>
                  <Text style={[styles.tdNum, { color: colors.ink, width: 42 }]}>--</Text>
                  <View style={{ width: 50, alignItems: 'flex-end' }}><Pill text="YOU" variant="accent" /></View>
                </View>
                {competitors.slice(0, 8).map((comp, i) => {
                  const threat = String(comp.threatLevel ?? comp.threat ?? 'medium').toLowerCase()
                  const rating = Number(comp.rating ?? 0)
                  const overlap = Number(comp.overlapCount ?? comp.sharedKeywords ?? 0)
                  return (
                    <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.miniIconFallback, { backgroundColor: colors.paper3 }]}>
                          <Text style={[styles.miniIconText, { color: colors.ink3 }]}>{String(comp.name ?? '').charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.compName, { color: colors.ink }]} numberOfLines={1}>{String(comp.name ?? '')}</Text>
                          {comp.developer ? <Text style={[styles.compDev, { color: colors.ink4 }]} numberOfLines={1}>{String(comp.developer)}</Text> : null}
                        </View>
                      </View>
                      <Text style={[styles.tdNum, { color: colors.ink, width: 50 }]}>{rating > 0 ? rating.toFixed(1) : '--'}</Text>
                      <Text style={[styles.tdNum, { color: colors.ink, width: 42 }]}>{overlap > 0 ? String(overlap) : '--'}</Text>
                      <View style={{ width: 50, alignItems: 'flex-end' }}>
                        <Pill text={threat.toUpperCase()} variant={threat === 'high' ? 'warn' : threat === 'low' ? 'muted' : 'accent'} />
                      </View>
                    </View>
                  )
                })}
              </Card>

              {/* Competitor strength/weakness details */}
              {competitors.slice(0, 4).map((comp, i) => {
                const strengths = Array.isArray(comp.strengths) ? comp.strengths as string[] : []
                const weaknesses = Array.isArray(comp.weaknesses) ? comp.weaknesses as string[] : []
                if (strengths.length === 0 && weaknesses.length === 0) return null
                return (
                  <Card key={i} title={String(comp.name ?? '')} tag={String(comp.threatLevel ?? '').toUpperCase()}>
                    {strengths.length > 0 && (
                      <>
                        <Text style={[styles.swLabel, { color: colors.ok }]}>STRENGTHS</Text>
                        {strengths.slice(0, 3).map((s, j) => (
                          <Text key={j} style={[styles.swItem, { color: colors.ink2 }]}>• {s}</Text>
                        ))}
                      </>
                    )}
                    {weaknesses.length > 0 && (
                      <>
                        <Text style={[styles.swLabel, { color: colors.warn, marginTop: 8 }]}>WEAKNESSES</Text>
                        {weaknesses.slice(0, 3).map((w, j) => (
                          <Text key={j} style={[styles.swItem, { color: colors.ink2 }]}>• {w}</Text>
                        ))}
                      </>
                    )}
                  </Card>
                )
              })}
            </>
          )}

          {/* Keyword Gaps */}
          {keywordGaps.length > 0 && (
            <>
              <SectionHead num="02" title="Keyword" accent="gaps" />
              <Card title="They rank, you don't" tag={`${keywordGaps.length} GAPS`}>
                <View style={styles.chipRow}>
                  {keywordGaps.slice(0, 15).map((gap, i) => (
                    <View key={i} style={[styles.gapChip, { borderColor: colors.warn, backgroundColor: colors.warnWash }]}>
                      <Text style={[styles.gapChipText, { color: colors.warn }]}>{String(gap.keyword ?? gap.term ?? gap)}</Text>
                    </View>
                  ))}
                </View>
              </Card>
              {sharedKeywords.length > 0 && (
                <Card title="Keywords you both rank for" tag={`${sharedKeywords.length} SHARED`}>
                  <View style={styles.chipRow}>
                    {sharedKeywords.slice(0, 15).map((kw, i) => (
                      <View key={i} style={[styles.gapChip, { borderColor: colors.line, backgroundColor: colors.paper2 }]}>
                        <Text style={[styles.gapChipText, { color: colors.ink2 }]}>{String(typeof kw === 'string' ? kw : kw.keyword ?? kw.term ?? kw)}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}
            </>
          )}

          {/* Alerts & Moves */}
          {alerts.length > 0 && (
            <>
              <SectionHead num="03" title="Recent" accent="moves" />
              <Card>
                {alerts.slice(0, 5).map((alert, i) => (
                  <View key={i} style={[styles.alertItem, i < Math.min(alerts.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={styles.alertMeta}>
                      <Pill text={String(alert.type ?? 'CHANGE')} variant={String(alert.type ?? '').toLowerCase() === 'threat' ? 'warn' : 'accent'} />
                      {alert.competitor ? <Text style={[styles.alertDate, { color: colors.ink3 }]}>{String(alert.competitor)}</Text> : null}
                      {alert.timeAgo ? <Text style={[styles.alertDate, { color: colors.ink4 }]}>{String(alert.timeAgo)}</Text> : null}
                    </View>
                    <Text style={[styles.alertText, { color: colors.ink }]}>{String(alert.text ?? alert.description ?? '')}</Text>
                    {alert.action ? <Text style={[styles.alertAction, { color: colors.accent }]}>{String(alert.action)}</Text> : null}
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, lineHeight: 33, marginBottom: 6 },
  titleAccent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  // Table
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  tdNum: { fontSize: 13, fontFamily: 'InstrumentSerif_400Regular', textAlign: 'right' },
  miniIcon: { width: 24, height: 24, borderRadius: 6 },
  miniIconFallback: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  miniIconText: { color: '#fff', fontSize: 11, fontFamily: 'InterTight_600SemiBold' },
  compName: { fontSize: 12, fontFamily: 'InterTight_600SemiBold' },
  compDev: { fontSize: 9, fontFamily: 'InterTight_400Regular', marginTop: 1 },
  // Strengths/Weaknesses
  swLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'InterTight_600SemiBold', marginBottom: 4 },
  swItem: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 2 },
  // Keyword gaps
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gapChip: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 3, borderStyle: 'dashed' },
  gapChipText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  // Alerts
  alertItem: { paddingVertical: 10 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  alertDate: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  alertText: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 20 },
  alertAction: { fontSize: 12, fontFamily: 'InterTight_600SemiBold', marginTop: 4 },
})
