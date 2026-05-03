import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'

export default function LlmDiscoveryScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data, loading, refetch } = useAnalysis<Record<string, unknown>>(app?.id, 'llm-track')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // llm-track format: { results: [{surface, mentioned, response, position}], citations: [{source, quote, meta}], promptMatrix: [{prompt, engines: {}, winner}], optimizationTips: [{title, detail, priority}] }
  const results = Array.isArray(data?.results) ? data.results as Array<Record<string, unknown>> : []
  const citations = Array.isArray(data?.citations) ? data.citations as Array<Record<string, unknown>> : []
  const promptMatrix = Array.isArray(data?.promptMatrix) ? data.promptMatrix as Array<Record<string, unknown>> : []
  const optimizationTips = Array.isArray(data?.optimizationTips) ? data.optimizationTips as Array<Record<string, unknown>> : []

  // Calculate share of voice from results (same as web)
  const mentionedResults = results.filter(r => r.mentioned === true || r.mentioned === 'true')
  const sov = results.length > 0 ? Math.round((mentionedResults.length / results.length) * 100) : 0

  // Build engine bars from results using position-based bars (exactly like the web)
  // Web uses: posMap = {'1st': 100, '2nd': 75, '3rd': 50, 'not listed': 0}
  // pct = r.mentioned ? (posMap[r.position] ?? 25) : 0
  // Display: r.mentioned ? r.position : 'N/A'
  const posMap: Record<string, number> = { '1st': 100, '2nd': 75, '3rd': 50, 'not listed': 0 }
  const engineBars = results.map(r => ({
    name: String(r.surface ?? ''),
    pct: r.mentioned ? (posMap[String(r.position ?? '')] ?? 25) : 0,
    label: r.mentioned ? String(r.position ?? 'Mentioned') : 'N/A',
    mentioned: !!r.mentioned,
  }))

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Your presence across <Text style={[styles.accent, { color: colors.accent }]}>AI engines</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Track how LLMs recommend your app.</Text>

      {!data && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching LLM data...</Text></Card>
      ) : !data ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3 }}>Run LLM discovery analysis from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'SHARE OF VOICE', value: `${sov}%`, deltaType: sov > 20 ? 'up' : 'down' },
            { label: 'ENGINES', value: String(results.length) },
            { label: 'CITED IN', value: String(mentionedResults.length) },
            { label: 'CITATIONS', value: String(citations.length) },
          ]} />

          {engineBars.length > 0 && (
            <>
              <SectionHead num="01" title="Engine" accent="breakdown" />
              <Card>
                {engineBars.map((engine, i) => (
                  <View key={i} style={styles.barRow}>
                    <Text style={[styles.barLabel, { color: colors.ink2 }]}>{engine.name}</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.paper3 }]}>
                      <View style={[styles.barFill, { width: `${Math.min(100, engine.pct)}%`, backgroundColor: engine.mentioned ? colors.accent : colors.warn }]} />
                    </View>
                    <Text style={[styles.barVal, { color: engine.mentioned ? colors.ink : colors.ink4 }]}>{engine.label}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {citations.length > 0 && (
            <>
              <SectionHead num="02" title="Top" accent="citations" />
              <Card>
                {citations.slice(0, 5).map((cite, i) => (
                  <View key={i} style={[styles.citeRow, { borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.citeRank, { color: colors.ink4 }]}>{String(i + 1).padStart(2, '0')}</Text>
                    <View style={styles.citeInfo}>
                      <Text style={[styles.citeName, { color: colors.ink }]}>{String(cite.source ?? cite.name ?? cite.url ?? '')}</Text>
                      <Text style={[styles.citeUrl, { color: colors.ink4 }]}>{String(cite.url ?? cite.domain ?? '')}</Text>
                    </View>
                    <Text style={[styles.citeCount, { color: colors.accent }]}>{String(cite.count ?? cite.mentions ?? '')}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Prompt matrix */}
          {promptMatrix.length > 0 && (
            <>
              <SectionHead num="03" title="Prompt" accent="matrix" />
              <Card>
                {promptMatrix.slice(0, 5).map((pm, i) => (
                  <View key={i} style={[styles.promptRow, i < Math.min(promptMatrix.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.promptText, { color: colors.ink }]} numberOfLines={2}>{String(pm.prompt ?? '')}</Text>
                    {pm.winner ? <Text style={[styles.promptWinner, { color: colors.accent }]}>Winner: {String(pm.winner)}</Text> : null}
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Optimization tips */}
          {optimizationTips.length > 0 && (
            <>
              <SectionHead num="04" title="Optimization" accent="tips" />
              <Card>
                {optimizationTips.slice(0, 5).map((tip, i) => (
                  <View key={i} style={[styles.tipRow, i < Math.min(optimizationTips.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.tipTitle, { color: colors.ink }]}>{String(tip.title ?? '')}</Text>
                    {tip.detail ? <Text style={[styles.tipDetail, { color: colors.ink3 }]}>{String(tip.detail)}</Text> : null}
                    {tip.priority ? <Pill text={String(tip.priority)} variant={tip.priority === 'high' ? 'high' : tip.priority === 'low' ? 'low' : 'medium'} /> : null}
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
  accent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  pageSub: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18, marginBottom: 20 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontSize: 12, fontFamily: 'InterTight_400Regular', minWidth: 80 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barVal: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular', minWidth: 36, textAlign: 'right' },
  citeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  citeRank: { fontSize: 9, letterSpacing: 1, fontFamily: 'InterTight_500Medium', width: 16 },
  citeInfo: { flex: 1 },
  citeName: { fontSize: 13, fontFamily: 'InterTight_500Medium' },
  citeUrl: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  citeCount: { fontSize: 15, fontFamily: 'InstrumentSerif_400Regular' },
  promptRow: { paddingVertical: 10 },
  promptText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18 },
  promptWinner: { fontSize: 11, fontFamily: 'InterTight_600SemiBold', marginTop: 4 },
  tipRow: { paddingVertical: 10 },
  tipTitle: { fontSize: 13, fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  tipDetail: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginBottom: 4 },
})
