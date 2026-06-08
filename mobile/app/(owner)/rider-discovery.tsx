import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { riderAPI, requestAPI } from '../../services/api';
import { useRiderStore } from '../../store/rider.store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function RiderDiscovery() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { riders, currentIndex, setRiders, nextRider, passRider, shortlistRider, isLoading, setLoading, hasMore, appendRiders, setHasMore } = useRiderStore();

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const loadRiders = useCallback(async (append = false) => {
    if (isLoading) return;
    setLoading(true);
    try {
      const page = append ? Math.ceil(riders.length / 10) + 1 : 1;
      const res = await riderAPI.getDiscovery({ page, limit: 10 });
      const data = res.data.riders || [];
      if (append) appendRiders(data);
      else setRiders(data);
      setHasMore(res.data.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isLoading, riders.length]);

  useEffect(() => { loadRiders(); }, []);

  const currentRider = riders[currentIndex];

  const animateTransition = (direction: 'left' | 'right', callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withTiming(direction === 'left' ? -width : width, { duration: 250 }, () => {
      runOnJS(callback)();
      translateX.value = 0;
      opacity.value = withTiming(0, { duration: 0 }, () => {
        opacity.value = withSpring(1);
      });
    });
  };

  const handlePass = () => {
    if (!currentRider) return;
    animateTransition('left', () => passRider(currentRider.user?._id));
    if (currentIndex >= riders.length - 3 && hasMore) loadRiders(true);
  };

  const handleSelect = async () => {
    if (!currentRider || !requestId) {
      Toast.show({ type: 'info', text1: 'Select a request first', text2: 'Go to your active request to select a rider.' });
      return;
    }
    try {
      await requestAPI.selectRider(requestId, currentRider.user?._id);
      Toast.show({ type: 'success', text1: 'Rider Selected! 🎉', text2: 'Proceed to payment to confirm.' });
      router.push({ pathname: '/(owner)/payments', params: { requestId } });
    } catch {
      Toast.show({ type: 'error', text1: 'Error selecting rider' });
    }
  };

  const handleInterested = () => {
    if (!currentRider) return;
    animateTransition('right', () => shortlistRider(currentRider.user?._id));
    Toast.show({ type: 'success', text1: 'Added to shortlist ✅', text2: `${currentRider.user?.name} saved.` });
    if (currentIndex >= riders.length - 3 && hasMore) loadRiders(true);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  if (isLoading && riders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding trusted riders...</Text>
      </View>
    );
  }

  if (!currentRider) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bicycle" size={80} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>No more riders</Text>
        <Text style={styles.emptySubtitle}>Check back soon for new verified riders</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={() => loadRiders()}>
          <Text style={styles.reloadText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { profile, user, matchScore } = currentRider;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Riders</Text>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{currentIndex + 1}/{riders.length}</Text>
        </View>
      </View>

      {/* Card */}
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Cover Photo */}
          <View style={styles.coverContainer}>
            {profile?.coverPhoto
              ? <Image source={{ uri: profile.coverPhoto }} style={styles.coverPhoto} />
              : <LinearGradient colors={['#1A0500', '#0A0A0A']} style={styles.coverPhoto} />}

            {/* Match Score */}
            <View style={styles.matchScoreContainer}>
              <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.matchScoreBadge}>
                <Text style={styles.matchScoreValue}>{matchScore}%</Text>
                <Text style={styles.matchScoreLabel}>match</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={COLORS.textMuted} />
                  </View>}
              {profile?.verificationStatus === 'approved' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                </View>
              )}
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.name}</Text>
              <TrustBadge level={profile?.trustLevel || 'bronze'} />
            </View>
            <Text style={styles.city}>{user?.city}</Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard icon="star" value={profile?.rating?.toFixed(1) || '0'} label="Rating" color={COLORS.gold} />
              <StatCard icon="bicycle" value={String(profile?.completedTrips || 0)} label="Trips" color={COLORS.primary} />
              <StatCard icon="shield-checkmark" value={`${profile?.safetyScore || 0}%`} label="Safety" color={COLORS.success} />
              <StatCard icon="trophy" value={String(user?.xp || 0)} label="XP" color="#7C3AED" />
            </View>

            {/* Route Expertise */}
            {profile?.routeExpertise?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Route Expertise</Text>
                <View style={styles.tagsRow}>
                  {profile.routeExpertise.map((r: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Ionicons name="location" size={12} color={COLORS.primary} />
                      <Text style={styles.tagText}>{r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Prompts */}
            {profile?.prompts?.map((prompt: { question: string; answer: string }, i: number) => (
              <View key={i} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{prompt.answer}</Text>
              </View>
            ))}

            {/* Languages */}
            {profile?.languages?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Speaks</Text>
                <View style={styles.tagsRow}>
                  {profile.languages.map((l: string, i: number) => (
                    <View key={i} style={[styles.tag, { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' }]}>
                      <Text style={[styles.tagText, { color: '#A78BFA' }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Insurance */}
            <View style={styles.insuranceRow}>
              <Ionicons name={profile?.insuranceStatus ? 'shield-checkmark' : 'shield-outline'} size={16} color={profile?.insuranceStatus ? COLORS.success : COLORS.textMuted} />
              <Text style={[styles.insuranceText, { color: profile?.insuranceStatus ? COLORS.success : COLORS.textMuted }]}>
                {profile?.insuranceStatus ? 'Insurance Verified' : 'No Insurance Listed'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={handlePass} activeOpacity={0.8}>
          <Ionicons name="close" size={28} color="#EF4444" />
          <Text style={[styles.actionLabel, { color: '#EF4444' }]}>PASS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.selectBtn]} onPress={handleSelect} activeOpacity={0.8}>
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.selectGradient}>
            <Ionicons name="star" size={24} color="#fff" />
            <Text style={styles.selectLabel}>SELECT</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.interestedBtn]} onPress={handleInterested} activeOpacity={0.8}>
          <Ionicons name="heart" size={28} color="#22C55E" />
          <Text style={[styles.actionLabel, { color: '#22C55E' }]}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TrustBadge({ level }: { level: string }) {
  const colors = { gold: ['#F6C90E', '#D4A017'], silver: ['#C0C0C0', '#A0A0A0'], bronze: ['#CD7F32', '#A0622A'] };
  const labels = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
  const gradient = colors[level as keyof typeof colors] || colors.bronze;
  return (
    <LinearGradient colors={gradient as [string, string]} style={styles.trustBadge}>
      <Text style={styles.trustBadgeText}>{labels[level as keyof typeof labels] || 'Bronze'}</Text>
    </LinearGradient>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as 'star'} size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, gap: SPACING.md, padding: SPACING.xl },
  emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center' },
  reloadBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg },
  reloadText: { color: COLORS.text, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  headerCount: { backgroundColor: COLORS.glass, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full },
  headerCountText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  cardContainer: { flex: 1, paddingHorizontal: SPACING.md },
  coverContainer: { position: 'relative', marginBottom: SPACING.lg },
  coverPhoto: { width: '100%', height: 220, borderRadius: RADIUS.xl },
  matchScoreContainer: { position: 'absolute', top: SPACING.md, right: SPACING.md },
  matchScoreBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.lg, alignItems: 'center' },
  matchScoreValue: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.lg },
  matchScoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  profileInfo: { paddingHorizontal: SPACING.sm },
  avatarContainer: { position: 'relative', marginBottom: SPACING.sm, alignSelf: 'flex-start' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.primary },
  avatarPlaceholder: { backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.background, borderRadius: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  name: { color: COLORS.text, fontSize: FONTS.sizes['2xl'], fontWeight: '800' },
  trustBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  trustBadgeText: { color: '#000', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  city: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  statCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', flex: 1, marginHorizontal: 3, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 3 },
  statValue: { color: COLORS.text, fontWeight: '800', fontSize: FONTS.sizes.md },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  section: { marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, gap: 4, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  tagText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  promptCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  promptQuestion: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  promptAnswer: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '600', lineHeight: 24 },
  insuranceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: SPACING.sm },
  insuranceText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  actionBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  passBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: RADIUS.xl, padding: SPACING.md, width: 80, alignItems: 'center' },
  selectBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  selectGradient: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, alignItems: 'center', gap: 4, flexDirection: 'column', borderRadius: RADIUS.xl, width: 100 },
  selectLabel: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.sm },
  interestedBtn: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: RADIUS.xl, padding: SPACING.md, width: 80, alignItems: 'center' },
  actionLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
});
