import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { tripAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function TripFeedScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const res = await tripAPI.list({ status: 'open', limit: 20 });
      setTrips(res.data.trips || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadTrips(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const handleJoin = async (tripId: string) => {
    try {
      await tripAPI.join(tripId);
      Toast.show({ type: 'success', text1: 'Join request sent!', text2: 'Trip leader will approve your request.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to join trip' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trips</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(trips)/create-trip')}
        >
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.createGradient}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createText}>Plan Trip</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => router.push({ pathname: '/(trips)/trip-details', params: { tripId: item._id } })}
            activeOpacity={0.8}
          >
            {item.coverImage
              ? <Image source={{ uri: item.coverImage }} style={styles.tripCover} />
              : <LinearGradient colors={['#1A0500', '#2D0A00']} style={styles.tripCoverGradient}>
                  <Ionicons name="bicycle" size={48} color={COLORS.primary} />
                </LinearGradient>}

            <View style={styles.tripContent}>
              <View style={styles.tripHeader}>
                <View>
                  <Text style={styles.tripTitle}>{item.title}</Text>
                  <View style={styles.routeRow}>
                    <Ionicons name="location" size={12} color={COLORS.primary} />
                    <Text style={styles.routeText}>{item.startCity}</Text>
                    <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
                    <Text style={styles.routeText}>{item.destination}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'open' ? '#22C55E20' : '#FF6B0020' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'open' ? COLORS.success : COLORS.primary }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.tripDescription} numberOfLines={2}>{item.description}</Text>

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.currentRiders?.length || 0}/{item.maxRiders} riders</Text>
                </View>
              </View>

              <View style={styles.tripFooter}>
                <View style={styles.avatarsRow}>
                  {item.currentRiders?.slice(0, 3).map((rider: any, i: number) => (
                    <View key={i} style={[styles.miniAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                      {rider.avatar
                        ? <Image source={{ uri: rider.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                        : <Ionicons name="person" size={14} color={COLORS.textMuted} />}
                    </View>
                  ))}
                  {(item.currentRiders?.length || 0) > 3 && (
                    <Text style={styles.moreRiders}>+{item.currentRiders.length - 3}</Text>
                  )}
                </View>

                {item.status === 'open' && (
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={(e) => { e.stopPropagation(); handleJoin(item._id); }}
                  >
                    <Text style={styles.joinText}>Join</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No trips planned yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to plan a group ride!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  createBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  createGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  createText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  tripCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder },
  tripCover: { width: '100%', height: 160 },
  tripCoverGradient: { width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' },
  tripContent: { padding: SPACING.md },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  tripTitle: { color: COLORS.text, fontWeight: '800', fontSize: FONTS.sizes.md, marginBottom: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  tripDescription: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 18, marginBottom: SPACING.sm },
  tripMeta: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarsRow: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background },
  moreRiders: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginLeft: 8 },
  joinBtn: { backgroundColor: 'rgba(255,107,0,0.15)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  joinText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', paddingTop: SPACING['2xl'], gap: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center' },
});
