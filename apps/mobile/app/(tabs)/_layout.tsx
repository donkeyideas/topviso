import { Stack } from 'expo-router'
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { AppHeader } from '../../src/components/AppHeader'
import { FloatingMenu } from '../../src/components/FloatingMenu'
import { useTheme } from '../../src/lib/theme'

export default function TabsLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.paper }]}>
      <AppHeader onMenuPress={() => setMenuOpen(!menuOpen)} />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </View>
      <FloatingMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
})
