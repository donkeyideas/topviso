import { Redirect } from 'expo-router'
import { useAuth } from '../src/lib/auth'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f7f4' }}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/signin" />
  }

  return <Redirect href="/(tabs)/overview" />
}
