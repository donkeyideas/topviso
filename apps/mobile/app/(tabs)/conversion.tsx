import { View, Text, ScrollView, StyleSheet, RefreshControl, Image } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { ScoreBar } from '../../src/components/ScoreBar'
import { Pill } from '../../src/components/Pill'

export default function ConversionScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data, loading, refetch } = useAnalysis<Record<string, unknown>>(app?.id, 'conversion')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const score = Number(data?.conversionScore ?? 0)
  const summary = String(data?.summary ?? '')
  const audit = data?.searchCardAudit as Record<string, unknown> | undefined
  const iconScore = Number(audit?.iconScore ?? 0)
  const titleScore = Number(audit?.titleScore ?? 0)
  const subtitleScore = Number(audit?.subtitleScore ?? 0)
  const ratingScore = Number(audit?.ratingScore ?? 0)
  const screenshotScore = Number(audit?.screenshotScore ?? 0)
  const issues = Array.isArray(audit?.issues) ? audit.issues as Array<Record<string, unknown>> : []
  const recs = Array.isArray(data?.recommendations) ? data.recommendations as Array<Record<string, unknown>> : []
  const competitors = Array.isArray(data?.competitorComparison) ? data.competitorComparison as Array<Record<string, unknown>> : []
  const screenshotUrls = Array.isArray(data?.screenshotUrls) ? data.screenshotUrls as string[] : []
  const appIcon = String(data?.appIcon ?? app?.icon_url ?? '')
  const appTitle = String(data?.appTitle ?? app?.name ?? '')
  const appSubtitle = String(data?.appSubtitle ?? '')
  const appRating = Number(data?.appRating ?? 0)
  const appRatingsCount = Number(data?.appRatingsCount ?? 0)
  const titleSubAvg = Math.round((titleScore + subtitleScore) / 2)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        From impression to <Text style={[styles.titleAccent, { color: colors.accent }]}>install</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Audit your search result card.</Text>

      {!data && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching conversion data...</Text></Card>
      ) : !data ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run conversion analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          {/* Summary */}
          {summary ? <Text style={[styles.summaryText, { color: colors.ink2 }]}>{summary}</Text> : null}

          <KpiStrip items={[
            { label: 'CONVERSION', value: String(score), deltaType: score >= 60 ? 'up' : 'down' },
            { label: 'ICON', value: String(iconScore) },
            { label: 'TITLE & SUB', value: String(titleSubAvg) },
            { label: 'SOCIAL PROOF', value: String(ratingScore) },
            { label: 'SCREENSHOTS', value: String(screenshotScore) },
          ]} />

          {/* Search result card — Your listing */}
          <SectionHead num="01" title="Search result" accent="card" />
          <Card title="Your listing" tag="REAL DATA">
            <View style={styles.listingRow}>
              {appIcon ? (
                <Image source={{ uri: appIcon }} style={styles.listingIcon} />
              ) : (
                <View style={[styles.listingIconFallback, { backgroundColor: colors.accent }]}>
                  <Text style={styles.listingIconText}>{appTitle.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.listingInfo}>
                <Text style={[styles.listingTitle, { color: colors.ink }]} numberOfLines={1}>{appTitle}</Text>
                <Text style={[styles.listingSub, { color: colors.ink3 }]} numberOfLines={1}>{appSubtitle || 'No subtitle'}</Text>
                <Text style={[styles.listingRating, { color: colors.ink4 }]}>
                  {appRating > 0 ? `${appRating.toFixed(1)} ★` : '0.0 ★'} ({formatCount(appRatingsCount)})
                </Text>
              </View>
            </View>
            {screenshotUrls.length > 0 && (
              <>
                <Text style={[styles.ssLabel, { color: colors.ink4 }]}>FIRST 3 SCREENSHOTS (SHOWN IN SEARCH)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ssRow}>
                  {screenshotUrls.slice(0, 3).map((url, i) => (
                    <Image key={i} source={{ uri: String(url) }} style={styles.ssThumb} resizeMode="cover" />
                  ))}
                </ScrollView>
              </>
            )}
          </Card>

          {/* Score Breakdown */}
          <Card title="Score breakdown">
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreBig, { color: colors.ink }]}>{score}</Text>
              <Text style={[styles.scoreMax, { color: colors.ink4 }]}>/100</Text>
            </View>
            <ScoreBar label="Icon" value={iconScore} />
            <ScoreBar label="Title" value={titleScore} />
            <ScoreBar label="Subtitle" value={subtitleScore} />
            <ScoreBar label="Rating & Reviews" value={ratingScore} />
            <ScoreBar label="Screenshots" value={screenshotScore} />
          </Card>

          {/* Competitor comparison */}
          {competitors.length > 0 && (
            <>
              <SectionHead num="02" title="Competitor" accent="comparison" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compScroll}>
                {/* Your app first */}
                <View style={[styles.compCard, { backgroundColor: colors.card, borderColor: colors.accent, borderWidth: 2 }]}>
                  {appIcon ? (
                    <Image source={{ uri: appIcon }} style={styles.compCardIcon} />
                  ) : (
                    <View style={[styles.compCardIconFallback, { backgroundColor: colors.accent }]}>
                      <Text style={styles.compCardIconText}>{appTitle.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={[styles.compCardName, { color: colors.ink }]} numberOfLines={1}>{appTitle}</Text>
                  <Text style={[styles.compCardRole, { color: colors.accent }]}>Your app</Text>
                  <View style={styles.compCardStats}>
                    <View style={styles.compStatRow}>
                      <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Rating</Text>
                      <Text style={[styles.compStatVal, { color: colors.ink }]}>{appRating > 0 ? `${appRating.toFixed(1)} ★` : '0.0 ★'}</Text>
                    </View>
                    <View style={styles.compStatRow}>
                      <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Ratings</Text>
                      <Text style={[styles.compStatVal, { color: colors.ink }]}>{formatCount(appRatingsCount)}</Text>
                    </View>
                    <View style={styles.compStatRow}>
                      <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Screenshots</Text>
                      <Text style={[styles.compStatVal, { color: colors.ink }]}>{screenshotUrls.length}</Text>
                    </View>
                  </View>
                </View>
                {competitors.slice(0, 3).map((comp, i) => (
                  <View key={i} style={[styles.compCard, { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 }]}>
                    {comp.iconUrl ? (
                      <Image source={{ uri: String(comp.iconUrl) }} style={styles.compCardIcon} />
                    ) : (
                      <View style={[styles.compCardIconFallback, { backgroundColor: colors.paper3 }]}>
                        <Text style={[styles.compCardIconText, { color: colors.ink3 }]}>{String(comp.name ?? '').charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={[styles.compCardName, { color: colors.ink }]} numberOfLines={1}>{String(comp.name ?? '')}</Text>
                    <Text style={[styles.compCardRole, { color: colors.ink4 }]}>Competitor</Text>
                    <View style={styles.compCardStats}>
                      <View style={styles.compStatRow}>
                        <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Rating</Text>
                        <Text style={[styles.compStatVal, { color: colors.ink }]}>{Number(comp.rating ?? 0) > 0 ? `${Number(comp.rating).toFixed(1)} ★` : '--'}</Text>
                      </View>
                      <View style={styles.compStatRow}>
                        <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Ratings</Text>
                        <Text style={[styles.compStatVal, { color: colors.ink }]}>{formatCount(Number(comp.ratingsCount ?? 0))}</Text>
                      </View>
                      <View style={styles.compStatRow}>
                        <Text style={[styles.compStatLabel, { color: colors.ink3 }]}>Screenshots</Text>
                        <Text style={[styles.compStatVal, { color: colors.ink }]}>{String(comp.screenshotCount ?? '--')}</Text>
                      </View>
                    </View>
                    {comp.advantage ? (
                      <Text style={[styles.compAdvantage, { color: colors.ink3, backgroundColor: colors.paper2 }]}>{String(comp.advantage)}</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* Issues & Fixes */}
          {issues.length > 0 && (
            <>
              <SectionHead num="03" title="Issues" accent="& fixes" />
              <Card>
                {issues.map((issue, i) => {
                  const impact = String(issue.impact ?? 'medium')
                  return (
                    <View key={i} style={[styles.issueRow, i < issues.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <View style={[styles.issueNum, { backgroundColor: impact === 'high' ? colors.warnWash : impact === 'low' ? colors.okWash : colors.accentWash }]}>
                        <Text style={[styles.issueNumText, { color: impact === 'high' ? colors.warn : impact === 'low' ? colors.ok : colors.accent }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.issueContent}>
                        <View style={styles.issueHeader}>
                          {issue.element ? <Text style={[styles.issueElement, { color: colors.ink }]}>{String(issue.element)}</Text> : null}
                          <Text style={[styles.issueTitle, { color: colors.ink }]}> — {String(issue.issue ?? '')}</Text>
                        </View>
                        <Text style={[styles.issueDesc, { color: colors.ink3 }]}>{String(issue.fix ?? '')}</Text>
                        <Pill text={impact.toUpperCase()} variant={impact === 'high' ? 'high' : impact === 'low' ? 'low' : 'medium'} />
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* Conversion Playbook */}
          {recs.length > 0 && (
            <>
              <SectionHead num="04" title="Conversion" accent="playbook" />
              <Card>
                {recs.map((rec, i) => {
                  const priority = String(rec.priority ?? 'medium')
                  const effort = String(rec.effort ?? '')
                  return (
                    <View key={i} style={[styles.issueRow, i < recs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <View style={[styles.issueNum, { backgroundColor: priority === 'high' ? colors.warnWash : priority === 'low' ? colors.okWash : colors.accentWash }]}>
                        <Text style={[styles.issueNumText, { color: priority === 'high' ? colors.warn : priority === 'low' ? colors.ok : colors.accent }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.issueContent}>
                        <Text style={[styles.issueElement, { color: colors.ink }]}>{String(rec.title ?? '')}</Text>
                        {rec.detail ? <Text style={[styles.issueDesc, { color: colors.ink3 }]}>{String(rec.detail)}</Text> : null}
                        {rec.expectedLift ? (
                          <Text style={[styles.liftText, { color: colors.accent }]}>Expected lift: {String(rec.expectedLift)}</Text>
                        ) : null}
                        <View style={styles.issueMeta}>
                          <Pill text={priority.toUpperCase()} variant={priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium'} />
                          {effort ? <Pill text={effort.toUpperCase()} variant="muted" /> : null}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* All Screenshots */}
          {screenshotUrls.length > 3 && (
            <>
              <SectionHead num="05" title="All" accent="screenshots" />
              <Card title={`${screenshotUrls.length} screenshots`} tag="REAL DATA">
                <View style={styles.ssGrid}>
                  {screenshotUrls.slice(0, 12).map((url, i) => (
                    <Image key={i} source={{ uri: String(url) }} style={styles.ssGridItem} resizeMode="cover" />
                  ))}
                  {screenshotUrls.length > 12 && (
                    <View style={[styles.ssGridMore, { backgroundColor: colors.paper2 }]}>
                      <Text style={[styles.ssGridMoreText, { color: colors.ink3 }]}>+{screenshotUrls.length - 12} more</Text>
                    </View>
                  )}
                </View>
              </Card>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, lineHeight: 33, marginBottom: 6 },
  titleAccent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 12 },
  summaryText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 19, marginBottom: 16 },
  // Listing preview
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  listingIcon: { width: 40, height: 40, borderRadius: 10 },
  listingIconFallback: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  listingIconText: { color: '#fff', fontSize: 16, fontFamily: 'InstrumentSerif_400Regular' },
  listingInfo: { flex: 1 },
  listingTitle: { fontSize: 14, fontFamily: 'InterTight_600SemiBold' },
  listingSub: { fontSize: 11, fontFamily: 'InterTight_400Regular', marginTop: 1 },
  listingRating: { fontSize: 10, fontFamily: 'InterTight_400Regular', marginTop: 2 },
  ssLabel: { fontSize: 8, letterSpacing: 1.2, fontFamily: 'InterTight_500Medium', marginBottom: 6, marginTop: 4 },
  ssRow: { marginBottom: 4 },
  ssThumb: { width: 80, height: 142, borderRadius: 6, marginRight: 6 },
  // Score center
  scoreCenter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 12 },
  scoreBig: { fontSize: 36, fontFamily: 'InstrumentSerif_400Regular' },
  scoreMax: { fontSize: 14, fontFamily: 'InterTight_400Regular', marginLeft: 2 },
  // Competitor cards
  compScroll: { marginBottom: 16 },
  compCard: { width: 160, borderRadius: 10, padding: 12, marginRight: 8, alignItems: 'center' },
  compCardIcon: { width: 40, height: 40, borderRadius: 10, marginBottom: 8 },
  compCardIconFallback: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  compCardIconText: { color: '#fff', fontSize: 16, fontFamily: 'InstrumentSerif_400Regular' },
  compCardName: { fontSize: 12, fontFamily: 'InterTight_600SemiBold', textAlign: 'center', marginBottom: 2 },
  compCardRole: { fontSize: 9, fontFamily: 'InterTight_500Medium', letterSpacing: 0.5, marginBottom: 8 },
  compCardStats: { width: '100%', gap: 4 },
  compStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compStatLabel: { fontSize: 11, fontFamily: 'InterTight_400Regular' },
  compStatVal: { fontSize: 11, fontFamily: 'InterTight_600SemiBold' },
  compAdvantage: { fontSize: 10, fontFamily: 'InterTight_400Regular', lineHeight: 15, padding: 8, borderRadius: 6, marginTop: 8 },
  // Issues
  issueRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  issueNum: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  issueNumText: { fontSize: 11, fontFamily: 'InterTight_600SemiBold' },
  issueContent: { flex: 1 },
  issueHeader: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
  issueElement: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  issueTitle: { fontSize: 13, fontFamily: 'InterTight_400Regular' },
  issueDesc: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
  liftText: { fontSize: 12, fontFamily: 'InterTight_600SemiBold', marginBottom: 4 },
  issueMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  // Screenshots grid
  ssGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ssGridItem: { width: 72, height: 128, borderRadius: 6 },
  ssGridMore: { width: 72, height: 128, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  ssGridMoreText: { fontSize: 12, fontFamily: 'InterTight_500Medium' },
})
