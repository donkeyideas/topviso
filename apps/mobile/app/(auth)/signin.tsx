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
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brandName}>Top Viso</Text>
        </View>

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
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 32 },
  brandMark: { width: 12, height: 12, backgroundColor: '#1a1a1a', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  brandDot: { width: 6, height: 6, backgroundColor: '#e94e1b', borderRadius: 3 },
  brandName: { fontSize: 24, fontWeight: '300', letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '300', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  error: { fontSize: 13, color: '#e94e1b', marginBottom: 12, padding: 12, backgroundColor: '#fef2f0', borderRadius: 6 },
  input: { borderWidth: 1, borderColor: '#e5e3de', borderRadius: 6, padding: 14, fontSize: 15, marginBottom: 12, backgroundColor: '#fff' },
  button: { backgroundColor: '#1a1a1a', borderRadius: 6, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#888' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
