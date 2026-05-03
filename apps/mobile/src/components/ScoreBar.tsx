import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'

interface ScoreBarProps {
  label: string
  value: number
  max?: number
}

export function ScoreBar({ label, value, max = 100 }: ScoreBarProps) {
  const { colors } = useTheme()
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  let fillColor = colors.ok
  if (value < 40) fillColor = colors.warn
  else if (value < 70) fillColor = colors.gold

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.ink2 }]}>{label}</Text>
      <View style={[styles.track, { backgroundColor: colors.paper3 }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={[styles.val, { color: colors.ink }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label: { fontSize: 12, fontFamily: 'InterTight_400Regular', minWidth: 72 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { fontSize: 15, fontFamily: 'InstrumentSerif_400Regular', minWidth: 30, textAlign: 'right' },
})
