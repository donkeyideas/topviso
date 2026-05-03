import { Text, View, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'

type PillVariant = 'ok' | 'warn' | 'accent' | 'muted' | 'high' | 'medium' | 'low'

interface PillProps {
  text: string
  variant: PillVariant
  boxed?: boolean
}

export function Pill({ text, variant, boxed }: PillProps) {
  const { colors } = useTheme()

  const variantMap: Record<PillVariant, { color: string; bg?: string }> = {
    ok: { color: colors.ok },
    warn: { color: colors.warn },
    accent: { color: colors.accent },
    muted: { color: colors.ink4 },
    high: { color: colors.warn, bg: colors.warnWash },
    medium: { color: colors.accent, bg: colors.accentWash },
    low: { color: colors.ok, bg: colors.okWash },
  }

  const v = variantMap[variant]

  if (boxed || v.bg) {
    return (
      <View style={[styles.box, { backgroundColor: v.bg ?? colors.paper2 }]}>
        <Text style={[styles.text, { color: v.color }]}>{text}</Text>
      </View>
    )
  }

  return <Text style={[styles.text, { color: v.color }]}>{text}</Text>
}

const styles = StyleSheet.create({
  text: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'InterTight_600SemiBold' },
  box: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3 },
})
