import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/auth'

export default function SignInScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    if (!email || !password) return
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.replace('/(tabs)/overview')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.brandName}>Top Viso</Text>

        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Welcome back. Enter your credentials.</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7f4' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  brandName: { fontSize: 38, fontFamily: 'InstrumentSerif_400Regular_Italic', letterSpacing: -0.5, marginBottom: 32, textAlign: 'center' },
  title: { fontSize: 28, fontFamily: 'InstrumentSerif_400Regular', letterSpacing: -0.5, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'InterTight_400Regular', color: '#888', marginBottom: 24, textAlign: 'center' },
  error: { fontSize: 13, fontFamily: 'InterTight_400Regular', color: '#e94e1b', marginBottom: 12, padding: 12, backgroundColor: '#fef2f0', borderRadius: 6, width: '100%' },
  input: { borderWidth: 1, borderColor: '#e5e3de', borderRadius: 6, padding: 14, fontSize: 15, fontFamily: 'InterTight_400Regular', marginBottom: 12, backgroundColor: '#fff', width: '100%' },
  button: { backgroundColor: '#1a1a1a', borderRadius: 6, padding: 16, alignItems: 'center', marginTop: 8, width: '100%' },
  buttonDisabled: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: 'InterTight_600SemiBold' },
})
