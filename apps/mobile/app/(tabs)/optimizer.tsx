import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'

export default function OptimizerScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data: titleData, loading: l1, refetch: r1 } = useAnalysis<Record<string, unknown>>(app?.id, 'optimize-title')
  const { data: subtitleData, loading: l2, refetch: r2 } = useAnalysis<Record<string, unknown>>(app?.id, 'optimize-subtitle')
  const { data: descData, loading: l3, refetch: r3 } = useAnalysis<Record<string, unknown>>(app?.id, 'optimize-description')
  const { data: kwData, loading: l4, refetch: r4 } = useAnalysis<Record<string, unknown>>(app?.id, 'optimize-keywords-field')
  const [refreshing, setRefreshing] = useState(false)

  const loading = l1 || l2 || l3 || l4
  const hasData = titleData || subtitleData || descData || kwData

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([r1(), r2(), r3(), r4()])
    setRefreshing(false)
  }, [r1, r2, r3, r4])

  const titles = Array.isArray(titleData?.titles) ? titleData.titles as Array<Record<string, unknown>> : []
  const subtitles = Array.isArray(subtitleData?.subtitles) ? subtitleData.subtitles as Array<Record<string, unknown>> : []
  const shortDesc = String(descData?.shortDescription ?? '')
  const fullDesc = String(descData?.fullDescription ?? '')
  const keywordsUsed = Array.isArray(descData?.keywordsUsed) ? descData.keywordsUsed as string[] : []
  const kwField = String(kwData?.keywordField ?? '')
  const kwCharCount = Number(kwData?.charCount ?? 0)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        AI-crafted <Text style={[styles.accent, { color: colors.accent }]}>metadata</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Optimized titles, subtitles, and descriptions.</Text>

      {!hasData && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching optimizer data...</Text></Card>
      ) : !hasData ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run optimizer from the web dashboard.</Text></Card>
      ) : (
        <>
          {/* Title suggestions */}
          {titles.length > 0 && (
            <>
              <SectionHead num="01" title="Title" accent="options" />
              <Card>
                {titles.slice(0, 5).map((t, i) => (
                  <View key={i} style={[styles.optionRow, i < Math.min(titles.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionTitle, { color: colors.ink }]}>{String(t.title ?? '')}</Text>
                      {t.charCount ? <Pill text={`${t.charCount} chars`} variant="muted" /> : null}
                    </View>
                    {t.reasoning ? <Text style={[styles.optionReason, { color: colors.ink3 }]}>{String(t.reasoning)}</Text> : null}
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Subtitle suggestions */}
          {subtitles.length > 0 && (
            <>
              <SectionHead num="02" title="Subtitle" accent="options" />
              <Card>
                {subtitles.slice(0, 5).map((s, i) => (
                  <View key={i} style={[styles.optionRow, i < Math.min(subtitles.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                    <View style={styles.optionHeader}>
                      <Text style={[styles.optionTitle, { color: colors.ink }]}>{String(s.subtitle ?? '')}</Text>
                      {s.charCount ? <Pill text={`${s.charCount} chars`} variant="muted" /> : null}
                    </View>
                    {s.reasoning ? <Text style={[styles.optionReason, { color: colors.ink3 }]}>{String(s.reasoning)}</Text> : null}
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Description */}
          {(shortDesc || fullDesc) && (
            <>
              <SectionHead num="03" title="Description" accent="copy" />
              {shortDesc ? (
                <Card title="Short Description">
                  <Text style={[styles.descText, { color: colors.ink }]}>{shortDesc}</Text>
                </Card>
              ) : null}
              {fullDesc ? (
                <Card title="Full Description">
                  <Text style={[styles.descText, { color: colors.ink }]}>{fullDesc}</Text>
                </Card>
              ) : null}
              {keywordsUsed.length > 0 && (
                <View style={styles.chipRow}>
                  {keywordsUsed.slice(0, 10).map((kw, i) => (
                    <View key={i} style={[styles.chip, { borderColor: colors.accent, backgroundColor: colors.accentWash }]}>
                      <Text style={[styles.chipText, { color: colors.accent }]}>{String(kw)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* iOS Keywords Field */}
          {kwField ? (
            <>
              <SectionHead num="04" title="Keywords" accent="field" />
              <Card title="iOS Keyword Field" tag={kwCharCount ? `${kwCharCount}/100` : undefined}>
                <Text style={[styles.kwField, { color: colors.ink, backgroundColor: colors.paper2 }]}>{kwField}</Text>
                {kwData?.reasoning ? <Text style={[styles.optionReason, { color: colors.ink3, marginTop: 8 }]}>{String(kwData.reasoning)}</Text> : null}
              </Card>
            </>
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
  optionRow: { paddingVertical: 10 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  optionTitle: { fontSize: 14, fontFamily: 'InterTight_600SemiBold', flex: 1 },
  optionReason: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginTop: 4 },
  descText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  kwField: { fontSize: 12, fontFamily: 'InterTight_400Regular', padding: 10, borderRadius: 6, lineHeight: 18 },
})
