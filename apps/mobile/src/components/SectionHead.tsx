import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'

interface SectionHeadProps {
  num: string
  title: string
  accent: string
}

export function SectionHead({ num, title, accent }: SectionHeadProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { borderBottomColor: colors.line }]}>
      <Text style={[styles.num, { color: colors.ink3 }]}>{num}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>
        {title} <Text style={[styles.accent, { color: colors.accent }]}>{accent}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 10, marginBottom: 14, borderBottomWidth: 1, marginTop: 8 },
  num: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.3 },
  accent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
})
