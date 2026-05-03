import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'

export default function ReviewsScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data: basic, loading: l1, refetch: r1 } = useAnalysis<Record<string, unknown>>(app?.id, 'reviews-analysis')
  const { data: plus, loading: l2, refetch: r2 } = useAnalysis<Record<string, unknown>>(app?.id, 'reviews-plus')
  const [refreshing, setRefreshing] = useState(false)

  const loading = l1 || l2
  const hasData = basic || plus

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([r1(), r2()])
    setRefreshing(false)
  }, [r1, r2])

  // Basic analysis data
  const praiseThemes = Array.isArray(basic?.praiseThemes) ? basic.praiseThemes as Array<Record<string, unknown>> : []
  const complaintThemes = Array.isArray(basic?.complaintThemes) ? basic.complaintThemes as Array<Record<string, unknown>> : []
  const replyTemplates = Array.isArray(basic?.replyTemplates) ? basic.replyTemplates as Array<Record<string, unknown>> : []
  const reviewKeywords = Array.isArray(basic?.keywordsFromReviews) ? basic.keywordsFromReviews as string[] : []
  const reviewCount = Number(basic?.realReviewCount ?? 0)
  const avgRating = Number(basic?.averageRating ?? 0)

  // Plus data
  const clusters = Array.isArray(plus?.clusters) ? plus.clusters as Array<Record<string, unknown>> : []
  const tickets = Array.isArray(plus?.tickets) ? plus.tickets as Array<Record<string, unknown>> : []
  const ratingRisk = String(plus?.ratingRisk ?? '')

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        The voice of your <Text style={[styles.accent, { color: colors.accent }]}>users</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Sentiment, themes, and actionable insights.</Text>

      {!hasData && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching review data...</Text></Card>
      ) : !hasData ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run review analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'REVIEWS', value: reviewCount > 0 ? String(reviewCount) : (plus?.newThisWeek ? String(plus.newThisWeek) : '--') },
            { label: 'AVG RATING', value: avgRating > 0 ? avgRating.toFixed(1) : '--', deltaType: avgRating >= 4 ? 'up' : 'down' },
            { label: 'RATING RISK', value: ratingRisk || '--' },
            { label: 'CLUSTERS', value: String(clusters.length || complaintThemes.length) },
          ]} />

          {/* Sentiment summary */}
          {basic?.sentimentSummary ? (
            <>
              <SectionHead num="01" title="Sentiment" accent="overview" />
              <Card>
                <Text style={[styles.summary, { color: colors.ink }]}>{String(basic.sentimentSummary)}</Text>
              </Card>
            </>
          ) : null}

          {/* Praise themes */}
          {praiseThemes.length > 0 && (
            <>
              <SectionHead num="02" title="What users" accent="love" />
              <Card>
                {praiseThemes.slice(0, 5).map((t, i) => (
                  <View key={i} style={[styles.themeRow, i < Math.min(praiseThemes.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={[styles.themeIcon, { backgroundColor: colors.okWash }]}>
                      <Text style={[styles.themeIconText, { color: colors.ok }]}>+</Text>
                    </View>
                    <View style={styles.themeContent}>
                      <Text style={[styles.themeTitle, { color: colors.ink }]}>{String(t.theme ?? '')}</Text>
                      {t.example ? <Text style={[styles.themeExample, { color: colors.ink3 }]}>"{String(t.example)}"</Text> : null}
                      {t.frequency ? <Pill text={String(t.frequency)} variant={t.frequency === 'high' ? 'ok' : 'muted'} /> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Complaint themes */}
          {complaintThemes.length > 0 && (
            <>
              <SectionHead num="03" title="Pain" accent="points" />
              <Card>
                {complaintThemes.slice(0, 5).map((t, i) => (
                  <View key={i} style={[styles.themeRow, i < Math.min(complaintThemes.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={[styles.themeIcon, { backgroundColor: colors.warnWash }]}>
                      <Text style={[styles.themeIconText, { color: colors.warn }]}>!</Text>
                    </View>
                    <View style={styles.themeContent}>
                      <Text style={[styles.themeTitle, { color: colors.ink }]}>{String(t.theme ?? '')}</Text>
                      {t.suggestedFix ? <Text style={[styles.themeFix, { color: colors.accent }]}>{String(t.suggestedFix)}</Text> : null}
                      {t.frequency ? <Pill text={String(t.frequency)} variant={t.frequency === 'high' ? 'warn' : 'muted'} /> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Trending clusters (from reviews-plus) */}
          {clusters.length > 0 && (
            <>
              <SectionHead num="04" title="Trending" accent="clusters" />
              <Card>
                {clusters.slice(0, 5).map((c, i) => (
                  <View key={i} style={[styles.clusterRow, i < Math.min(clusters.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={styles.clusterInfo}>
                      <Text style={[styles.clusterName, { color: colors.ink }]}>{String(c.cluster ?? '')}</Text>
                      {c.trend ? <Text style={[styles.clusterTrend, { color: colors.warn }]}>{String(c.trend)}</Text> : null}
                    </View>
                    {c.status ? <Pill text={String(c.status)} variant={String(c.status) === 'ESCALATED' ? 'warn' : 'muted'} /> : null}
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Reply templates */}
          {replyTemplates.length > 0 && (
            <>
              <SectionHead num="05" title="Reply" accent="templates" />
              <Card>
                {replyTemplates.slice(0, 3).map((r, i) => (
                  <View key={i} style={[styles.replyRow, i < Math.min(replyTemplates.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.replyScenario, { color: colors.ink3 }]}>{String(r.scenario ?? '')}</Text>
                    <Text style={[styles.replyText, { color: colors.ink }]}>{String(r.reply ?? '')}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Keywords from reviews */}
          {reviewKeywords.length > 0 && (
            <View style={styles.chipRow}>
              {reviewKeywords.slice(0, 12).map((kw, i) => (
                <View key={i} style={[styles.chip, { borderColor: colors.line, backgroundColor: colors.card }]}>
                  <Text style={[styles.chipText, { color: colors.ink2 }]}>{String(kw)}</Text>
                </View>
              ))}
            </View>
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
  accent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  summary: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 20 },
  themeRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  themeIcon: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  themeIconText: { fontSize: 12, fontFamily: 'InterTight_700Bold' },
  themeContent: { flex: 1 },
  themeTitle: { fontSize: 13, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  themeExample: { fontSize: 12, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 17, marginBottom: 4 },
  themeFix: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
  clusterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  clusterInfo: { flex: 1 },
  clusterName: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  clusterTrend: { fontSize: 11, fontFamily: 'InterTight_500Medium', marginTop: 2 },
  replyRow: { paddingVertical: 10 },
  replyScenario: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_600SemiBold', marginBottom: 4 },
  replyText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
})
