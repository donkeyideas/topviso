import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native'
import { Feather } from '@expo/vector-icons'
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
  const { sync, syncing, phase, currentStep, steps, dismiss } = useSync(app?.id)

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
          <Feather name={isDark ? 'sun' : 'moon'} size={15} color={colors.ink3} />
        </TouchableOpacity>
      </View>

      {/* Sync progress modal */}
      <Modal visible={phase !== 'idle'} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            {phase === 'done' ? (
              <View style={[styles.checkCircle, { borderColor: '#1f6a3a' }]}>
                <Text style={styles.checkMark}>{'✓'}</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color={colors.accent} />
            )}
            <Text style={[styles.modalTitle, { color: colors.ink }]}>
              {phase === 'done' ? 'Sync complete' : 'Syncing data'}
            </Text>
            <View style={styles.stepList}>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        i < currentStep ? '#1f6a3a'
                        : i === currentStep ? colors.accent
                        : colors.line,
                    },
                  ]} />
                  <Text style={[
                    styles.stepText,
                    {
                      color: i <= currentStep ? colors.ink : colors.ink4,
                      fontFamily: i === currentStep ? 'InterTight_600SemiBold' : 'InterTight_400Regular',
                    },
                  ]}>{step}</Text>
                </View>
              ))}
            </View>
            {phase === 'done' && (
              <TouchableOpacity style={[styles.dismissBtn, { borderColor: colors.line }]} onPress={dismiss}>
                <Text style={[styles.dismissText, { color: colors.ink3 }]}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modal: { width: '100%', maxWidth: 320, borderRadius: 16, padding: 28, alignItems: 'center' },
  checkCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 24, color: '#1f6a3a' },
  modalTitle: { fontSize: 18, fontFamily: 'InterTight_600SemiBold', marginTop: 16, marginBottom: 20 },
  stepList: { width: '100%', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  stepText: { fontSize: 13 },
  dismissBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1 },
  dismissText: { fontSize: 13, fontFamily: 'InterTight_500Medium' },
})
