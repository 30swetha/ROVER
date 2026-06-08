import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Image, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { riderAPI, requestAPI, postAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function OwnerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [featuredRiders, setFeaturedRiders] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [ridersRes, requestsRes, postsRes] = await Promise.all([
        riderAPI.getDiscovery({ limit: 5 }),
        requestAPI.list({ myRequests: true, limit: 3 }),
        postAPI.getFeed({ limit: 5 }),
      ]);
      setFeaturedRiders(ridersRes.data.riders || []);
      setMyRequests(requestsRes.data.requests || []);
      setPosts(postsRes.data.posts || []);
    } catch {
      // ignore errors, show empty state
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const QUICK_ACTIONS = [
    { icon: 'add-circle', label: 'Post Request', color: COLORS.primary, onPress: () => router.push('/(owner)/create-request') },
    { icon: 'people', label: 'Find Riders', color: '#7C3AED', onPress: () => router.push('/(owner)/rider-discovery') },
    { icon: 'map', label: 'Trips', color: '#059669', onPress: () => router.push('/(trips)/feed') },
    { icon: 'chatbubbles', label: 'Messages', color: '#0EA5E9', onPress: () => router.push('/chat/conversations') },
  ];

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
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(social)/notifications')}>
              <Ionicons name="notifications" size={24} color={COLORS.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(owner)/rider-discovery')}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <Text style={styles.searchText}>Find a trusted rider...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as 'add-circle'} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Requests */}
        {myRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Requests</Text>
            {myRequests.slice(0, 2).map((req: any) => (
              <TouchableOpacity
                key={req._id}
                style={styles.requestCard}
                onPress={() => router.push({ pathname: '/(owner)/rider-discovery', params: { requestId: req._id } })}
                activeOpacity={0.8}
              >
                <View style={styles.requestRoute}>
                  <Text style={styles.routeCity}>{req.pickupCity}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                  <Text style={styles.routeCity}>{req.destinationCity}</Text>
                </View>
                <View style={styles.requestMeta}>
                  <Text style={styles.bikeName}>{req.bikeBrand} {req.bikeModel}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: req.status === 'open' ? '#22C55E20' : '#FF6B0020' }]}>
                    <Text style={[styles.statusText, { color: req.status === 'open' ? COLORS.success : COLORS.primary }]}>
                      {req.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.budget}>₹{req.budget.toLocaleString()} • {req.applicants?.length || 0} applicants</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Featured Riders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Riders</Text>
            <TouchableOpacity onPress={() => router.push('/(owner)/rider-discovery')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredRiders}
            keyExtractor={(item) => item.profile?._id || item.user?._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: SPACING.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.riderCard}
                onPress={() => router.push({ pathname: '/(owner)/rider-profile', params: { riderId: item.user?._id } })}
                activeOpacity={0.8}
              >
                <View style={styles.riderAvatar}>
                  {item.user?.avatar
                    ? <Image source={{ uri: item.user.avatar }} style={styles.avatarImg} />
                    : <Ionicons name="person" size={28} color={COLORS.textMuted} />}
                  <View style={[styles.trustBadgeSmall, { backgroundColor: item.profile?.trustLevel === 'gold' ? COLORS.gold : item.profile?.trustLevel === 'silver' ? COLORS.silver : COLORS.bronze }]}>
                    <Text style={styles.trustBadgeText}>
                      {item.profile?.trustLevel === 'gold' ? '🥇' : item.profile?.trustLevel === 'silver' ? '🥈' : '🥉'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.riderName} numberOfLines={1}>{item.user?.name}</Text>
                <Text style={styles.riderCity}>{item.user?.city}</Text>
                <View style={styles.riderStats}>
                  <Ionicons name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.riderRating}>{item.profile?.rating?.toFixed(1)}</Text>
                </View>
                <View style={styles.matchScorePill}>
                  <Text style={styles.matchScoreText}>{item.matchScore}% match</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Community Feed */}
        <View style={[styles.section, { marginBottom: SPACING.xl }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community</Text>
            <TouchableOpacity onPress={() => router.push('/(social)/feed')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {posts.slice(0, 2).map((post: any) => (
            <View key={post._id} style={styles.postCard}>
              <View style={styles.postAuthor}>
                <View style={styles.postAvatar}>
                  {post.authorId?.avatar
                    ? <Image source={{ uri: post.authorId.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    : <Ionicons name="person" size={18} color={COLORS.textMuted} />}
                </View>
                <View>
                  <Text style={styles.postAuthorName}>{post.authorId?.name}</Text>
                  <Text style={styles.postCity}>{post.authorId?.city}</Text>
                </View>
              </View>
              <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
              <View style={styles.postActions}>
                <Ionicons name="heart-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.postActionCount}>{post.likes?.length || 0}</Text>
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
                <Text style={styles.postActionCount}>{post.comments?.length || 0}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  userName: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  notifBtn: { position: 'relative', padding: 8, backgroundColor: COLORS.glass, borderRadius: RADIUS.md },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  requestCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder, ...SHADOWS.card },
  requestRoute: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  routeCity: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.md },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bikeName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  budget: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  riderCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, width: 130, marginRight: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  riderAvatar: { position: 'relative', marginBottom: SPACING.sm },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  trustBadgeSmall: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  trustBadgeText: { fontSize: 10 },
  riderName: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm, textAlign: 'center' },
  riderCity: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: 4 },
  riderStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  riderRating: { color: COLORS.text, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  matchScorePill: { marginTop: 6, backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  matchScoreText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  postCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  postAuthorName: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },
  postCity: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  postContent: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20, marginBottom: SPACING.sm },
  postActions: { flexDirection: 'row', alignItems: 'center' },
  postActionCount: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, marginLeft: 4 },
});
