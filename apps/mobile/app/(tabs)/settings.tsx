import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native'
import { useAuth } from '../../src/lib/auth'
import { useTheme } from '../../src/lib/theme'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { colors, isDark, toggle } = useTheme()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/signin')
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.paper }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.ink }]}>
        <Text style={[styles.titleAccent, { color: colors.accent }]}>Settings</Text>.
      </Text>
      <Text style={[styles.subtitle, { color: colors.ink3 }]}>Account and app preferences.</Text>

      <View style={[styles.section, { borderTopColor: colors.line }]}>
        <View style={[styles.row, { borderBottomColor: colors.lineSoft }]}>
          <Text style={[styles.label, { color: colors.ink3 }]}>EMAIL</Text>
          <Text style={[styles.value, { color: colors.ink }]}>{user?.email ?? '--'}</Text>
        </View>

        <View style={[styles.row, { borderBottomColor: colors.lineSoft }]}>
          <Text style={[styles.label, { color: colors.ink3 }]}>PLAN</Text>
          <Text style={[styles.value, { color: colors.ink }]}>Solo (Free)</Text>
        </View>

        <View style={[styles.row, { borderBottomColor: colors.lineSoft }]}>
          <Text style={[styles.label, { color: colors.ink3 }]}>DARK MODE</Text>
          <Switch
            value={isDark}
            onValueChange={toggle}
            trackColor={{ false: colors.paper3, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.row, { borderBottomColor: colors.lineSoft }]}>
          <Text style={[styles.label, { color: colors.ink3 }]}>VERSION</Text>
          <Text style={[styles.value, { color: colors.ink4 }]}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>

      <View style={[styles.noteBox, { backgroundColor: colors.accentWash, borderLeftColor: colors.accent }]}>
        <Text style={[styles.noteLabel, { color: colors.accent }]}>COMPANION APP</Text>
        <Text style={[styles.noteText, { color: colors.ink }]}>
          This app is a read-only companion. Manage your subscription and run analyses from the web dashboard.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.signOutBtn, { backgroundColor: colors.ink }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Text style={[styles.signOutText, { color: colors.paper }]}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, marginBottom: 6 },
  titleAccent: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  subtitle: { fontSize: 13, fontFamily: 'InterTight_400Regular', marginBottom: 20 },
  section: { borderTopWidth: 1, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1 },
  label: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: 'InterTight_600SemiBold' },
  value: { fontSize: 14, fontFamily: 'InterTight_400Regular' },
  noteBox: { padding: 14, borderLeftWidth: 3, borderRadius: 6, marginBottom: 24 },
  noteLabel: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_600SemiBold', marginBottom: 4 },
  noteText: { fontSize: 13, fontFamily: 'InterTight_400Regular', lineHeight: 19 },
  signOutBtn: { borderRadius: 6, padding: 16, alignItems: 'center' },
  signOutText: { fontSize: 15, fontFamily: 'InterTight_600SemiBold' },
})
