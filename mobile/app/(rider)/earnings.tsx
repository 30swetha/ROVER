import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { riderAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riderAPI.getEarnings().then(res => {
      setEarnings(res.data.earnings);
      setTransactions(res.data.transactions || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>My Earnings</Text>

      {/* Summary Cards */}
      <LinearGradient colors={['#1A0500', '#0A0A0A']} style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={styles.summaryValue}>₹{earnings?.totalEarnings?.toLocaleString() || '0'}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>₹{earnings?.pendingEarnings?.toLocaleString() || '0'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { icon: 'bicycle', label: 'Completed Trips', value: earnings?.completedTrips || 0, color: COLORS.primary },
          { icon: 'star', label: 'Avg Rating', value: earnings?.rating ? earnings.rating.toFixed(1) : '0', color: COLORS.gold },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as 'bicycle'} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons name="bicycle" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txRoute}>{item.requestId?.pickupCity} → {item.requestId?.destinationCity}</Text>
                <Text style={styles.txDate}>{new Date(item.releasedAt || item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <Text style={styles.txAmount}>+₹{item.riderEarning?.toLocaleString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptySubtitle}>Complete transport jobs to start earning</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  pageTitle: { color: COLORS.text, fontSize: FONTS.sizes['2xl'], fontWeight: '900', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  summaryCard: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)', marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: 4 },
  summaryValue: { color: COLORS.text, fontSize: FONTS.sizes['2xl'], fontWeight: '900' },
  summaryDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.glassBorder },
  statValue: { color: COLORS.text, fontWeight: '900', fontSize: FONTS.sizes.xl },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center' },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  txCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  txRoute: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },
  txDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  txAmount: { color: COLORS.success, fontWeight: '900', fontSize: FONTS.sizes.md },
  emptyContainer: { alignItems: 'center', paddingTop: SPACING['2xl'], gap: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center' },
});
