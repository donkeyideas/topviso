import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../lib/theme'
import { useAppData } from '../lib/useAppData'
import { useSync } from '../lib/useSync'

interface AppHeaderProps {
  onMenuPress: () => void
}

export function AppHeader({ onMenuPress }: AppHeaderProps) {
  const { colors, isDark, toggle } = useTheme()
  const insets = useSafeAreaInsets()
  const { app } = useAppData()
  const { sync, syncing } = useSync(app?.id)

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.paper, borderBottomColor: colors.line }]}>
      <View style={styles.left}>
        <TouchableOpacity
          style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.line }]}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <View style={styles.bars}>
            <View style={[styles.bar, { backgroundColor: colors.ink }]} />
            <View style={[styles.bar, { backgroundColor: colors.ink, marginVertical: 3 }]} />
            <View style={[styles.bar, { backgroundColor: colors.ink }]} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.logo, { color: colors.accent }]}>Top Viso</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: colors.accent }]}
          onPress={sync}
          activeOpacity={0.7}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.syncText}>Sync</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.line }]}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.themeIcon, { color: colors.ink3 }]}>
            {isDark ? '\u2600' : '\u263E'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  bars: { alignItems: 'center' },
  bar: { width: 14, height: 1.5, borderRadius: 1 },
  logo: { fontSize: 22, fontFamily: 'InstrumentSerif_400Regular_Italic', letterSpacing: -0.5 },
  syncBtn: { paddingHorizontal: 14, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 56 },
  syncText: { color: '#fff', fontSize: 12, fontFamily: 'InterTight_600SemiBold', letterSpacing: 0.3 },
  themeBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  themeIcon: { fontSize: 16 },
})
