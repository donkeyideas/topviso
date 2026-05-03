import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'

interface KpiItem {
  label: string
  value: string
  delta?: string
  deltaType?: 'up' | 'down' | 'flat'
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  const { colors } = useTheme()

  const deltaColor = (type?: string) => {
    if (type === 'up') return colors.ok
    if (type === 'down') return colors.warn
    return colors.ink4
  }

  return (
    <View style={[styles.strip, { backgroundColor: colors.card, borderColor: colors.line }]}>
      {items.map((item, i) => (
        <View
          key={item.label}
          style={[
            styles.kpi,
            { borderColor: colors.lineSoft },
            i % 2 === 0 && styles.kpiBorderRight,
            i < items.length - 2 && styles.kpiBorderBottom,
          ]}
        >
          <Text style={[styles.label, { color: colors.ink3 }]}>{item.label}</Text>
          <Text style={[styles.value, { color: colors.ink }]}>{item.value}</Text>
          {item.delta !== undefined && (
            <Text style={[styles.delta, { color: deltaColor(item.deltaType) }]}>{item.delta}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  kpi: { width: '50%', padding: 14 },
  kpiBorderRight: { borderRightWidth: 1 },
  kpiBorderBottom: { borderBottomWidth: 1 },
  label: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium', marginBottom: 6 },
  value: { fontSize: 26, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5 },
  delta: { fontSize: 11, fontFamily: 'InterTight_400Regular', marginTop: 2 },
})
