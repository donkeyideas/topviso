import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'

interface CardProps {
  title?: string
  tag?: string
  children: React.ReactNode
  noPadding?: boolean
}

export function Card({ title, tag, children, noPadding }: CardProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
      {title && (
        <View style={[styles.head, { borderBottomColor: colors.lineSoft }]}>
          <Text style={[styles.title, { color: colors.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>{title}</Text>
          {tag && <Text style={[styles.tag, { color: colors.ink4 }]}>{tag}</Text>}
        </View>
      )}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, letterSpacing: -0.3 },
  tag: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
  body: { padding: 14 },
})
