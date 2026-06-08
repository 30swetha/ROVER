import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { requestAPI, applicationAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function BrowseRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyModal, setApplyModal] = useState<{ open: boolean; requestId?: string; budget?: number }>({ open: false });
  const [proposal, setProposal] = useState('');
  const [myPrice, setMyPrice] = useState('');
  const [applying, setApplying] = useState(false);
  const [filter, setFilter] = useState('');

  const loadRequests = async () => {
    try {
      const res = await requestAPI.list({ status: 'open', limit: 30 });
      setRequests(res.data.requests || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApply = async () => {
    if (!proposal.trim() || !myPrice) {
      Toast.show({ type: 'error', text1: 'Fill in your proposal and price' });
      return;
    }
    setApplying(true);
    try {
      await applicationAPI.apply(applyModal.requestId!, proposal, Number(myPrice));
      Toast.show({ type: 'success', text1: 'Application Sent! 🏍️', text2: 'Owner will review your application.' });
      setApplyModal({ open: false });
      setProposal(''); setMyPrice('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to apply';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setApplying(false);
    }
  };

  const filtered = requests.filter(r =>
    !filter ||
    r.pickupCity?.toLowerCase().includes(filter.toLowerCase()) ||
    r.destinationCity?.toLowerCase().includes(filter.toLowerCase()) ||
    r.bikeBrand?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Jobs</Text>
        <Text style={styles.headerCount}>{filtered.length} available</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city or bike..."
          placeholderTextColor={COLORS.textMuted}
          value={filter}
          onChangeText={setFilter}
        />
        {filter !== '' && (
          <TouchableOpacity onPress={() => setFilter('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        : <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: SPACING.lg }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={styles.cityCol}>
                    <Ionicons name="location" size={14} color={COLORS.primary} />
                    <Text style={styles.cityText}>{item.pickupCity}</Text>
                  </View>
                  <View style={styles.routeMiddle}>
                    <View style={styles.routeLine} />
                    <Ionicons name="bicycle" size={18} color={COLORS.primary} />
                    <View style={styles.routeLine} />
                  </View>
                  <View style={styles.cityCol}>
                    <Ionicons name="flag" size={14} color={COLORS.primary} />
                    <Text style={styles.cityText}>{item.destinationCity}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="bicycle-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{item.bikeBrand} {item.bikeModel}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{new Date(item.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>

                {item.notes && <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>}

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.budgetLabel}>Budget</Text>
                    <Text style={styles.budget}>₹{item.budget?.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => setApplyModal({ open: true, requestId: item._id, budget: item.budget })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.applyGradient}>
                      <Text style={styles.applyText}>Apply Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No jobs match your search</Text>}
          />}

      {/* Apply Modal */}
      <Modal visible={applyModal.open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Your Application</Text>
            <Text style={styles.modalSubtitle}>Owner's budget: ₹{applyModal.budget?.toLocaleString()}</Text>

            <Text style={styles.fieldLabel}>Your Proposal</Text>
            <TextInput
              style={styles.proposalInput}
              placeholder="Why should this owner choose you? Mention your experience..."
              placeholderTextColor={COLORS.textMuted}
              value={proposal}
              onChangeText={setProposal}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Your Price (₹)</Text>
            <TextInput
              style={styles.priceInput}
              placeholder={String(applyModal.budget || 3000)}
              placeholderTextColor={COLORS.textMuted}
              value={myPrice}
              onChangeText={setMyPrice}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setApplyModal({ open: false }); setProposal(''); setMyPrice(''); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleApply} disabled={applying}>
                <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.submitGradient}>
                  {applying ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Apply</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerCount: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: SPACING.xs },
  searchInput: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base },
  requestCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  cityCol: { alignItems: 'center', gap: 3, flex: 1 },
  cityText: { color: COLORS.text, fontWeight: '800', fontSize: FONTS.sizes.md },
  routeMiddle: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.primary, maxWidth: 30 },
  cardDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginVertical: SPACING.sm },
  detailsRow: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  notes: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 18, marginBottom: SPACING.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  budgetLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  budget: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  applyBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  applyGradient: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  applyText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingTop: SPACING.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, borderTopWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
  proposalInput: { backgroundColor: COLORS.glass, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.glassBorder, minHeight: 100, marginBottom: SPACING.md },
  priceInput: { backgroundColor: COLORS.glass, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: SPACING.lg },
  modalActions: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  submitGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
