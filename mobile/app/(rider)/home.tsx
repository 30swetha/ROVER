import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { riderAPI, requestAPI, achievementAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function RiderHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [earnings, setEarnings] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [earningsRes, requestsRes, achievementsRes] = await Promise.all([
        riderAPI.getEarnings(),
        requestAPI.list({ status: 'open', limit: 3 }),
        achievementAPI.getMyAchievements(),
      ]);
      setEarnings(earningsRes.data.earnings);
      setRequests(requestsRes.data.requests || []);
      setAchievements(achievementsRes.data.achievements || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const BADGE_ICONS: Record<string, string> = {
    first_ride: '🏁', ten_trips: '🔟', fifty_trips: '5️⃣0️⃣',
    hundred_trips: '💯', top_rated: '⭐', verified_rider: '✅',
    community_star: '🌟', trip_leader: '🏔️', early_adopter: '🚀', five_star_streak: '🔥',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1A0A00', COLORS.background]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Ready to ride,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]} 🏍️</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(social)/notifications')}>
              <Ionicons name="notifications" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Earnings Summary Card */}
        <View style={styles.section}>
          <LinearGradient colors={['#1A0500', '#2D0A00']} style={styles.earningsCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.earningsRow}>
              <View>
                <Text style={styles.earningsLabel}>Total Earned</Text>
                <Text style={styles.earningsValue}>₹{earnings?.totalEarnings?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.earningsDivider} />
              <View>
                <Text style={styles.earningsLabel}>Pending</Text>
                <Text style={[styles.earningsValue, { color: COLORS.warning }]}>₹{earnings?.pendingEarnings?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.earningsDivider} />
              <View>
                <Text style={styles.earningsLabel}>XP</Text>
                <Text style={[styles.earningsValue, { color: '#7C3AED' }]}>{user?.xp || 0}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.earningsBtn} onPress={() => router.push('/(rider)/earnings')}>
              <Text style={styles.earningsBtnText}>View Earnings →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Trust Score */}
        <View style={styles.section}>
          <View style={styles.trustCard}>
            <View style={styles.trustInfo}>
              <Text style={styles.trustTitle}>Trust Score</Text>
              <Text style={styles.trustScore}>{user?.trustScore || 0}</Text>
            </View>
            <View style={styles.trustBarContainer}>
              <View style={styles.trustBarTrack}>
                <LinearGradient
                  colors={['#FF6B00', '#FFD700']}
                  style={[styles.trustBarFill, { width: `${user?.trustScore || 0}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.trustLevel}>
                {(user?.trustScore || 0) >= 70 ? '🥇 Gold Verified' : (user?.trustScore || 0) >= 40 ? '🥈 Silver Verified' : '🥉 Bronze Verified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Available Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(rider)/browse-requests')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {requests.map((req: any) => (
            <TouchableOpacity
              key={req._id}
              style={styles.jobCard}
              onPress={() => router.push({ pathname: '/(rider)/browse-requests', params: { requestId: req._id } })}
              activeOpacity={0.8}
            >
              <View style={styles.jobRoute}>
                <Text style={styles.jobCity}>{req.pickupCity}</Text>
                <View style={styles.routeArrow}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeLine} />
                  <Ionicons name="bicycle" size={16} color={COLORS.primary} />
                  <View style={styles.routeLine} />
                  <View style={styles.routeDot} />
                </View>
                <Text style={styles.jobCity}>{req.destinationCity}</Text>
              </View>
              <View style={styles.jobMeta}>
                <Text style={styles.jobBike}>{req.bikeBrand} {req.bikeModel}</Text>
                <Text style={styles.jobBudget}>₹{req.budget?.toLocaleString()}</Text>
              </View>
              <View style={styles.jobFooter}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.jobDate}>{new Date(req.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                <Text style={styles.jobApplicants}>{req.applicants?.length || 0} applied</Text>
              </View>
            </TouchableOpacity>
          ))}
          {requests.length === 0 && (
            <Text style={styles.emptyText}>No jobs available right now. Check back soon!</Text>
          )}
        </View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={[styles.section, { marginBottom: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <View style={styles.badgesRow}>
              {achievements.slice(0, 6).map((a: any) => (
                <View key={a._id} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{BADGE_ICONS[a.badge] || '🏅'}</Text>
                  <Text style={styles.badgeLabel}>{a.badge.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  userName: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  notifBtn: { padding: 8, backgroundColor: COLORS.glass, borderRadius: RADIUS.md },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: SPACING.md },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  earningsCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: SPACING.md },
  earningsDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  earningsLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, marginBottom: 4 },
  earningsValue: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.xl },
  earningsBtn: { alignItems: 'center' },
  earningsBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  trustCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder },
  trustInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  trustTitle: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  trustScore: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  trustBarContainer: { gap: 6 },
  trustBarTrack: { height: 8, backgroundColor: COLORS.glass, borderRadius: 4, overflow: 'hidden' },
  trustBarFill: { height: '100%', borderRadius: 4 },
  trustLevel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  jobCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder },
  jobRoute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  jobCity: { color: COLORS.text, fontWeight: '800', fontSize: FONTS.sizes.md },
  routeArrow: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4 },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.primary, maxWidth: 20 },
  jobMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  jobBike: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  jobBudget: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.md },
  jobFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  jobApplicants: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.xl },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: 'center', width: 90, borderWidth: 1, borderColor: COLORS.glassBorder },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeLabel: { color: COLORS.textSecondary, fontSize: 9, textAlign: 'center', textTransform: 'capitalize' },
});
