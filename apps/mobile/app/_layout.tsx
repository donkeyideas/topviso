import { Slot } from 'expo-router'
import { AuthProvider } from '../src/lib/auth'
import { ThemeProvider } from '../src/lib/theme'
import { AppDataProvider } from '../src/lib/useAppData'
import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif'
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold } from '@expo-google-fonts/inter-tight'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <Slot />
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
