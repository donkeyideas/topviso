import { View, Text, TouchableOpacity, Pressable, StyleSheet, Animated, Image } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../lib/theme'
import { useAppData, type AppData } from '../lib/useAppData'
import { useEffect, useRef, useState } from 'react'

interface FloatingMenuProps {
  visible: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Overview', route: '/(tabs)/overview' },
  { label: 'Keywords', route: '/(tabs)/keywords' },
  { label: 'LLM Discovery', route: '/(tabs)/llm-discovery' },
  { label: 'Conversion', route: '/(tabs)/conversion' },
  { label: 'Competitors', route: '/(tabs)/competitors' },
]

const secondaryItems = [
  { label: 'Optimizer', route: '/(tabs)/optimizer' },
  { label: 'Reviews', route: '/(tabs)/reviews' },
  { label: 'Creative Lab', route: '/(tabs)/creative-lab' },
  { label: 'Growth', route: '/(tabs)/growth' },
  { label: 'Localization', route: '/(tabs)/localization' },
]

export function FloatingMenu({ visible, onClose }: FloatingMenuProps) {
  const { colors } = useTheme()
  const { app, apps, switchApp } = useAppData()
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current
  const [showAppPicker, setShowAppPicker] = useState(false)

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [visible, opacity])

  useEffect(() => {
    if (!visible) setShowAppPicker(false)
  }, [visible])

  if (!visible) return null

  function navigate(route: string) {
    onClose()
    router.push(route as never)
  }

  function handleSwitchApp(a: AppData) {
    switchApp(a.id)
    setShowAppPicker(false)
  }

  const isActive = (route: string) => pathname.includes(route.replace('/(tabs)/', ''))

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.menu, { top: insets.top + 56, backgroundColor: colors.card, borderColor: colors.line }]}>
        {/* App info + switcher */}
        <TouchableOpacity
          style={[styles.appInfo, { borderBottomColor: colors.lineSoft }]}
          onPress={() => apps.length > 1 && setShowAppPicker(!showAppPicker)}
          activeOpacity={apps.length > 1 ? 0.7 : 1}
        >
          <View style={styles.appInfoRow}>
            {app?.icon_url ? (
              <Image source={{ uri: app.icon_url }} style={styles.appIconImg} />
            ) : (
              <View style={styles.appIcon}>
                <Text style={styles.appIconText}>{app?.name?.charAt(0) ?? 'A'}</Text>
              </View>
            )}
            <View style={styles.appInfoText}>
              <Text style={[styles.appName, { color: colors.ink }]} numberOfLines={2}>{app?.name ?? 'My App'}</Text>
              <Text style={[styles.appPlatform, { color: colors.ink4 }]}>
                {(app?.platform ?? 'ios').toUpperCase()}
              </Text>
            </View>
            {apps.length > 1 && (
              <Text style={[styles.switchArrow, { color: colors.ink3 }]}>
                {showAppPicker ? '\u25B2' : '\u25BC'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* App picker dropdown */}
        {showAppPicker && (
          <View style={[styles.appPicker, { borderBottomColor: colors.lineSoft }]}>
            {apps.filter(a => a.id !== app?.id).map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.appPickerItem, { backgroundColor: colors.paper2 }]}
                onPress={() => handleSwitchApp(a)}
                activeOpacity={0.7}
              >
                {a.icon_url ? (
                  <Image source={{ uri: a.icon_url }} style={styles.appPickerIcon} />
                ) : (
                  <View style={[styles.appPickerIconFallback, { backgroundColor: colors.accent }]}>
                    <Text style={styles.appPickerIconText}>{a.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.appPickerName, { color: colors.ink }]} numberOfLines={1}>{a.name}</Text>
                  <Text style={[styles.appPickerPlatform, { color: colors.ink4 }]}>{a.platform.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Primary nav */}
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              isActive(item.route) && { backgroundColor: colors.ink },
            ]}
            onPress={() => navigate(item.route)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.menuItemText,
                { color: isActive(item.route) ? colors.paper : colors.ink2 },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.lineSoft }]} />

        {/* Secondary nav */}
        {secondaryItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              isActive(item.route) && { backgroundColor: colors.ink },
            ]}
            onPress={() => navigate(item.route)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.menuItemText,
                { color: isActive(item.route) ? colors.paper : colors.ink2 },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.lineSoft }]} />

        {/* Settings */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            pathname.includes('settings') && { backgroundColor: colors.ink },
          ]}
          onPress={() => navigate('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.menuItemText,
              { color: pathname.includes('settings') ? colors.paper : colors.ink2 },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 100 },
  menu: { position: 'absolute', left: 16, width: 220, borderWidth: 1, borderRadius: 12, padding: 8, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 20 },
  appInfo: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, marginBottom: 4 },
  appInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1d3fd9', justifyContent: 'center', alignItems: 'center' },
  appIconText: { color: '#fff', fontFamily: 'InstrumentSerif_400Regular', fontSize: 16 },
  appIconImg: { width: 32, height: 32, borderRadius: 8 },
  appInfoText: { flex: 1 },
  appName: { fontSize: 13, fontFamily: 'InterTight_600SemiBold' },
  appPlatform: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium', marginTop: 2 },
  switchArrow: { fontSize: 8 },
  appPicker: { borderBottomWidth: 1, marginBottom: 4, paddingBottom: 4 },
  appPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, marginBottom: 2 },
  appPickerIcon: { width: 24, height: 24, borderRadius: 6 },
  appPickerIconFallback: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  appPickerIconText: { color: '#fff', fontSize: 11, fontFamily: 'InterTight_600SemiBold' },
  appPickerName: { fontSize: 12, fontFamily: 'InterTight_500Medium' },
  appPickerPlatform: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'InterTight_400Regular' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6 },
  menuItemText: { fontSize: 13, fontFamily: 'InterTight_500Medium' },
  divider: { height: 1, marginVertical: 4 },
})
