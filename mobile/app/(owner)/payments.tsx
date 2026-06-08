import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paymentAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function PaymentsScreen() {
  const router = useRouter();
  const { requestId, complete } = useLocalSearchParams<{ requestId?: string; complete?: string }>();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await paymentAPI.getHistory();
      setHistory(res.data.payments || []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder(requestId);
      const { order, razorpayKeyId } = res.data;
      Toast.show({ type: 'info', text1: 'Razorpay order created', text2: `Order ID: ${order.id}` });
      // In production, open Razorpay checkout here
    } catch {
      Toast.show({ type: 'error', text1: 'Payment failed', text2: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await paymentAPI.release(requestId);
      Toast.show({ type: 'success', text1: 'Payment Released! 🎉', text2: 'Rider has been paid.' });
      loadHistory();
    } catch {
      Toast.show({ type: 'error', text1: 'Release failed' });
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: COLORS.warning,
    escrowed: COLORS.info,
    released: COLORS.success,
    refunded: COLORS.error,
    failed: COLORS.error,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      {requestId && (
        <View style={styles.actionCard}>
          {complete === 'true' ? (
            <>
              <Text style={styles.actionTitle}>Release Payment to Rider</Text>
              <Text style={styles.actionSubtitle}>Your bike has been delivered successfully. Release the escrowed payment to the rider.</Text>
              <TouchableOpacity style={styles.releaseBtn} onPress={handleRelease} disabled={loading}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.gradient}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Release Payment ✓</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.actionTitle}>Secure Payment in Escrow</Text>
              <Text style={styles.actionSubtitle}>Payment is held safely until your bike is delivered. The rider gets paid only on successful delivery.</Text>
              <View style={styles.escrowInfo}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.escrowText}>100% secure escrow payment</Text>
              </View>
              <TouchableOpacity style={styles.payBtn} onPress={handleCreateOrder} disabled={loading}>
                <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.gradient}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <><Ionicons name="lock-closed" size={18} color="#fff" /><Text style={styles.btnText}>Pay Securely via Razorpay</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <Text style={styles.historyTitle}>Transaction History</Text>
      {historyLoading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        : <FlatList
            data={history}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
            renderItem={({ item }) => (
              <View style={styles.txCard}>
                <View style={styles.txRow}>
                  <View>
                    <Text style={styles.txRoute}>
                      {item.requestId?.pickupCity} → {item.requestId?.destinationCity}
                    </Text>
                    <Text style={styles.txBike}>{item.requestId?.bikeBrand}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmount}>₹{item.amount?.toLocaleString()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || COLORS.textMuted) + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || COLORS.textMuted }]}>
                        {item.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet</Text>}
          />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  actionCard: { margin: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder },
  actionTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '800', marginBottom: SPACING.xs },
  actionSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20, marginBottom: SPACING.md },
  escrowInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md, backgroundColor: 'rgba(34,197,94,0.1)', padding: SPACING.sm, borderRadius: RADIUS.sm },
  escrowText: { color: COLORS.success, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  payBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  releaseBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  historyTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  txCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txRoute: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.base },
  txBike: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  txAmount: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.lg },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingTop: SPACING.xl },
});
