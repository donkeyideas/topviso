import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useTheme } from '../../src/lib/theme'
import { useAppData } from '../../src/lib/useAppData'
import { useAnalysis } from '../../src/lib/useAnalysis'
import { KpiStrip } from '../../src/components/KpiStrip'
import { Card } from '../../src/components/Card'
import { SectionHead } from '../../src/components/SectionHead'
import { Pill } from '../../src/components/Pill'
import { ScoreBar } from '../../src/components/ScoreBar'
import { SortableHeader } from '../../src/components/SortableHeader'
import { useSortable } from '../../src/hooks/useSortable'

const perfColumns = [
  { label: 'MARKET', key: 'market', flex: 1 },
  { label: 'DL', key: 'estimatedDownloads', width: 50, align: 'right' as const },
  { label: 'KW', key: 'keywordsCovered', width: 40, align: 'right' as const },
  { label: 'STATUS', key: 'status', width: 50, align: 'right' as const },
]

export default function LocalizationScreen() {
  const { colors } = useTheme()
  const { app } = useAppData()
  const { data, loading, refetch } = useAnalysis<Record<string, unknown>>(app?.id, 'localization')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const localizations = Array.isArray(data?.localizations) ? data.localizations as Array<Record<string, unknown>> : []
  const opportunities = Array.isArray(data?.marketOpportunities) ? data.marketOpportunities as Array<Record<string, unknown>> : []
  const performance = Array.isArray(data?.marketPerformance) ? data.marketPerformance as Array<Record<string, unknown>> : []
  const localized = localizations.length
  const topOpp = opportunities.length > 0 ? Number(opportunities[0]?.opportunityScore ?? 0) : 0

  const { sorted: sortedPerf, sort: perfSort, toggle: perfToggle } = useSortable(performance)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.pageTitle, { color: colors.ink }]}>
        Go <Text style={[styles.accent, { color: colors.accent }]}>global</Text>.
      </Text>
      <Text style={[styles.pageSub, { color: colors.ink3 }]}>Localized metadata and market opportunities.</Text>

      {!data && loading ? (
        <Card title="Loading..."><Text style={{ color: colors.ink3 }}>Fetching localization data...</Text></Card>
      ) : !data ? (
        <Card title="No data yet"><Text style={{ color: colors.ink3, fontFamily: 'InterTight_400Regular', fontSize: 13 }}>Run localization from the web dashboard.</Text></Card>
      ) : (
        <>
          <KpiStrip items={[
            { label: 'LOCALES', value: String(localized) },
            { label: 'MARKETS', value: String(opportunities.length) },
            { label: 'TOP OPP', value: `${topOpp}%` },
            { label: 'PERFORMANCE', value: String(performance.length) },
          ]} />

          {/* Market opportunities */}
          {opportunities.length > 0 && (
            <>
              <SectionHead num="01" title="Market" accent="opportunities" />
              <Card>
                {opportunities.slice(0, 6).map((mkt, i) => {
                  const oppScore = Number(mkt.opportunityScore ?? 0)
                  const competition = String(mkt.competition ?? '')
                  return (
                    <View key={i} style={[styles.mktRow, i < Math.min(opportunities.length, 6) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
                      <View style={styles.mktHeader}>
                        <Text style={[styles.mktName, { color: colors.ink }]}>{String(mkt.market ?? mkt.locale ?? '')}</Text>
                        <Text style={[styles.mktLocale, { color: colors.ink4 }]}>{String(mkt.locale ?? '')}</Text>
                      </View>
                      <ScoreBar label="Opportunity" value={oppScore} />
                      <View style={styles.mktMeta}>
                        {mkt.marketSize ? <Pill text={String(mkt.marketSize)} variant="accent" /> : null}
                        {competition ? <Pill text={`${competition} competition`} variant={competition === 'high' ? 'warn' : competition === 'low' ? 'ok' : 'muted'} /> : null}
                        {mkt.status ? <Pill text={String(mkt.status)} variant={mkt.status === 'localized' ? 'ok' : mkt.status === 'ai-draft' ? 'accent' : 'muted'} /> : null}
                      </View>
                      {mkt.recommendation ? <Text style={[styles.mktRec, { color: colors.ink3 }]}>{String(mkt.recommendation)}</Text> : null}
                    </View>
                  )
                })}
              </Card>
            </>
          )}

          {/* Localized metadata */}
          {localizations.length > 0 && (
            <>
              <SectionHead num="02" title="Translated" accent="metadata" />
              {localizations.slice(0, 4).map((loc, i) => (
                <Card key={i} title={String(loc.locale ?? '')} tag="TRANSLATION">
                  {loc.title ? (
                    <View style={styles.fieldRow}>
                      <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>TITLE</Text>
                      <Text style={[styles.fieldValue, { color: colors.ink }]}>{String(loc.title)}</Text>
                    </View>
                  ) : null}
                  {loc.subtitle ? (
                    <View style={styles.fieldRow}>
                      <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>SUBTITLE</Text>
                      <Text style={[styles.fieldValue, { color: colors.ink }]}>{String(loc.subtitle)}</Text>
                    </View>
                  ) : null}
                  {loc.shortDescription ? (
                    <View style={styles.fieldRow}>
                      <Text style={[styles.fieldLabel, { color: colors.ink3 }]}>SHORT DESC</Text>
                      <Text style={[styles.fieldValue, { color: colors.ink }]}>{String(loc.shortDescription)}</Text>
                    </View>
                  ) : null}
                  {Array.isArray(loc.keywords) && (loc.keywords as string[]).length > 0 && (
                    <View style={styles.chipRow}>
                      {(loc.keywords as string[]).slice(0, 8).map((kw, j) => (
                        <View key={j} style={[styles.chip, { borderColor: colors.line, backgroundColor: colors.card }]}>
                          <Text style={[styles.chipText, { color: colors.ink2 }]}>{String(kw)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* Market performance */}
          {performance.length > 0 && (
            <>
              <SectionHead num="03" title="Market" accent="performance" />
              <Card noPadding>
                <SortableHeader columns={perfColumns} sort={perfSort} onSort={perfToggle} />
                {sortedPerf.slice(0, 8).map((p, i) => (
                  <View key={i} style={[styles.tableRow, { borderBottomColor: colors.lineSoft }]}>
                    <Text style={[styles.td, { color: colors.ink2, flex: 1 }]} numberOfLines={1}>{String(p.market ?? p.locale ?? '')}</Text>
                    <Text style={[styles.td, { color: colors.ink2, width: 50, textAlign: 'right' }]}>{String(p.estimatedDownloads ?? '--')}</Text>
                    <Text style={[styles.tdNum, { color: colors.ink, width: 40 }]}>{String(p.keywordsCovered ?? '--')}</Text>
                    <View style={{ width: 50, alignItems: 'flex-end' }}>
                      <Pill text={String(p.status ?? '--')} variant={p.status === 'live' ? 'ok' : p.status === 'draft' ? 'accent' : 'muted'} />
                    </View>
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
  mktRow: { paddingVertical: 10 },
  mktHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mktName: { fontSize: 14, fontFamily: 'InterTight_600SemiBold' },
  mktLocale: { fontSize: 10, fontFamily: 'InterTight_400Regular', letterSpacing: 0.5 },
  mktMeta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  mktRec: { fontSize: 12, fontFamily: 'InterTight_400Regular', lineHeight: 17, marginTop: 6 },
  fieldRow: { marginBottom: 8 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_600SemiBold', marginBottom: 2 },
  fieldValue: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: 'InterTight_400Regular' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  td: { fontSize: 12, fontFamily: 'InterTight_400Regular' },
  tdNum: { fontSize: 14, fontFamily: 'InstrumentSerif_400Regular', textAlign: 'right' },
})
