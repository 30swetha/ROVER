import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { COLORS } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/onboarding" />;

  if (user?.role === 'rider') return <Redirect href="/(rider)/home" />;
  if (user?.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
  return <Redirect href="/(owner)/home" />;
}
