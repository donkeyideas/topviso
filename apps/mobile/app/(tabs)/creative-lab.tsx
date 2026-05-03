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

export default function CreativeLabScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data, loading, refetch } = useAnalysis<Record<string, unknown>>(app?.id, 'creative-lab')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const creativeScore = Number(data?.creativeScore ?? 0)
  const screenshots = Array.isArray(data?.screenshots) ? data.screenshots as string[] : []
  const iconUrl = String(data?.iconUrl ?? app?.icon_url ?? '')
  const breakdown = data?.scoreBreakdown as Record<string, unknown> | undefined
  const competitorCreatives = Array.isArray(data?.competitorCreatives) ? data.competitorCreatives as Array<Record<string, unknown>> : []
  const screenshotRecs = Array.isArray(data?.screenshotRecommendations) ? data.screenshotRecommendations as Array<Record<string, unknown>> : []
  const iconRecs = Array.isArray(data?.iconRecommendations) ? data.iconRecommendations as Array<Record<string, unknown>> : []
  const compInsights = Array.isArray(data?.competitorInsights) ? data.competitorInsights as Array<Record<string, unknown>> : []
  const summary = String(data?.summary ?? '')

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Visuals that <Text style={[styles.accent, { color: colors.accent }]}>convert</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Analyze and optimize your store creatives.</Text>

      {!data && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching creative data...</Text></Card>
      ) : !data ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run Creative Lab from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'CREATIVE SCORE', value: String(creativeScore), deltaType: creativeScore >= 60 ? 'up' : 'down' },
            { label: 'SCREENSHOTS', value: String(screenshots.length || data?.screenshotCount || 0) },
            { label: 'COMPETITORS', value: String(competitorCreatives.length || data?.competitorCount || 0) },
          ]} />

          {/* Your Screenshots */}
          {screenshots.length > 0 && (
            <>
              <SectionHead num="01" title="Your" accent="screenshots" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ssScroll}>
                {screenshots.slice(0, 10).map((url, i) => (
                  <Image key={i} source={{ uri: String(url) }} style={styles.ssImage} resizeMode="cover" />
                ))}
              </ScrollView>
            </>
          )}

          {/* Creative Quality Score */}
          {breakdown ? (
            <>
              <SectionHead num="02" title="Creative quality" accent="score" />
              <Card>
                <View style={styles.scoreCenter}>
                  <Text style={[styles.scoreBig, { color: colors.ink }]}>{creativeScore}</Text>
                  <Text style={[styles.scoreMax, { color: colors.ink4 }]}>/100</Text>
                </View>
                {breakdown.titleScore != null && <ScoreBar label="Title" value={Number(breakdown.titleScore)} />}
                {breakdown.subtitleScore != null && <ScoreBar label="Subtitle" value={Number(breakdown.subtitleScore)} />}
                {breakdown.descriptionScore != null && <ScoreBar label="Description" value={Number(breakdown.descriptionScore)} />}
                {breakdown.keywordsFieldScore != null && <ScoreBar label="Keywords Field" value={Number(breakdown.keywordsFieldScore)} />}
                {breakdown.ratingsScore != null && <ScoreBar label="Ratings" value={Number(breakdown.ratingsScore)} />}
                {breakdown.creativesScore != null && <ScoreBar label="Creatives" value={Number(breakdown.creativesScore)} />}
              </Card>
            </>
          ) : null}

          {/* AI Recommendations — Screenshots */}
          {screenshotRecs.length > 0 && (
            <>
              <SectionHead num="03" title="Screenshot" accent="strategy" />
              <Card>
                {screenshotRecs.slice(0, 5).map((rec, i) => (
                  <View key={i} style={[styles.recRow, i < Math.min(screenshotRecs.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={[styles.recNum, { backgroundColor: colors.accentWash }]}>
                      <Text style={[styles.recNumText, { color: colors.accent }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.recContent}>
                      <Text style={[styles.recTitle, { color: colors.ink }]}>{String(rec.title ?? '')}</Text>
                      {rec.detail ? <Text style={[styles.recDetail, { color: colors.ink3 }]}>{String(rec.detail)}</Text> : null}
                      {rec.priority ? <Pill text={String(rec.priority)} variant={rec.priority === 'high' ? 'high' : rec.priority === 'low' ? 'low' : 'medium'} /> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* AI Recommendations — Icon */}
          {iconRecs.length > 0 && (
            <>
              <SectionHead num="04" title="Icon" accent="improvements" />
              <Card>
                {iconUrl ? <Image source={{ uri: iconUrl }} style={styles.iconPreview} /> : null}
                {iconRecs.slice(0, 3).map((rec, i) => (
                  <View key={i} style={[styles.recRow, i < Math.min(iconRecs.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={[styles.recNum, { backgroundColor: colors.accentWash }]}>
                      <Text style={[styles.recNumText, { color: colors.accent }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.recContent}>
                      <Text style={[styles.recTitle, { color: colors.ink }]}>{String(rec.title ?? '')}</Text>
                      {rec.detail ? <Text style={[styles.recDetail, { color: colors.ink3 }]}>{String(rec.detail)}</Text> : null}
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Competitor Visuals */}
          {competitorCreatives.length > 0 && (
            <>
              <SectionHead num="05" title="Competitor" accent="visuals" />
              {competitorCreatives.slice(0, 4).map((comp, i) => {
                const compScreenshots = Array.isArray(comp.screenshots) ? comp.screenshots as string[] : []
                return (
                  <Card key={i}>
                    <View style={styles.compHeader}>
                      {comp.iconUrl ? (
                        <Image source={{ uri: String(comp.iconUrl) }} style={styles.compIcon} />
                      ) : (
                        <View style={[styles.compIconFallback, { backgroundColor: colors.paper3 }]}>
                          <Text style={[styles.compIconText, { color: colors.ink3 }]}>{String(comp.name ?? '').charAt(0)}</Text>
                        </View>
                      )}
                      <View style={styles.compInfo}>
                        <Text style={[styles.compName, { color: colors.ink }]}>{String(comp.name ?? '')}</Text>
                        <Text style={[styles.compMeta, { color: colors.ink3 }]}>
                          {comp.rating ? `${Number(comp.rating).toFixed(1)} ★` : ''}{compScreenshots.length > 0 ? ` · ${compScreenshots.length} screenshots` : ''}
                        </Text>
                      </View>
                    </View>
                    {compScreenshots.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compSsScroll}>
                        {compScreenshots.slice(0, 4).map((url, j) => (
                          <Image key={j} source={{ uri: String(url) }} style={styles.compSsImage} resizeMode="cover" />
                        ))}
                      </ScrollView>
                    )}
                  </Card>
                )
              })}
            </>
          )}

          {/* Creative Patterns / Insights */}
          {compInsights.length > 0 && (
            <Card title="Creative Patterns" tag="AI INSIGHTS">
              {compInsights.slice(0, 4).map((ins, i) => (
                <View key={i} style={[styles.insightRow, { backgroundColor: colors.accentWash, borderLeftColor: colors.accent }]}>
                  <View style={[styles.insightNum, { backgroundColor: colors.accent }]}>
                    <Text style={styles.insightNumText}>{i + 1}</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightText, { color: colors.ink }]}>{String(ins.insight ?? '')}</Text>
                    {ins.action ? <Text style={[styles.insightAction, { color: colors.accent }]}>{String(ins.action)}</Text> : null}
                  </View>
                </View>
              ))}
            </Card>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, lineHeight: 33, marginBottom: 6 },
  accent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  ssScroll: { marginBottom: 16 },
  ssImage: { width: 120, height: 213, borderRadius: 8, marginRight: 8 },
  // Score
  scoreCenter: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 12 },
  scoreBig: { fontSize: 36, fontFamily: 'InstrumentSerif_400Regular' },
  scoreMax: { fontSize: 14, fontFamily: 'InterTight_400Regular', marginLeft: 2 },
  iconPreview: { width: 48, height: 48, borderRadius: 12, marginBottom: 10 },
  // Recs
  recRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  recNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  recNumText: { fontSize: 10, fontFamily: 'InterTight_600SemiBold' },
  recContent: { flex: 1 },
  recTitle: { fontSize: 13, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  recDetail: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
  // Competitor visuals
  compHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  compIcon: { width: 32, height: 32, borderRadius: 8 },
  compIconFallback: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  compIconText: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular' },
  compInfo: { flex: 1 },
  compName: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  compMeta: { fontSize: 10, fontFamily: 'InterTight_400Regular', marginTop: 2 },
  compSsScroll: { marginTop: 4 },
  compSsImage: { width: 72, height: 128, borderRadius: 6, marginRight: 6 },
  // Insights
  insightRow: { flexDirection: 'row', gap: 10, padding: 12, borderLeftWidth: 3, borderRadius: 6, marginBottom: 8 },
  insightNum: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  insightNumText: { color: '#fff', fontSize: 10, fontFamily: 'InterTight_600SemiBold' },
  insightContent: { flex: 1 },
  insightText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18 },
  insightAction: { fontSize: 12, fontFamily: 'InterTight_600SemiBold', marginTop: 4 },
  summaryText: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular_Italic', lineHeight: 20 },
})
