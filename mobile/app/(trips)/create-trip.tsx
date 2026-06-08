import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { tripAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function CreateTripScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', startCity: '', destination: '',
    date: '', endDate: '', maxRiders: '8',
    description: '', tags: '',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title || !form.startCity || !form.destination || !form.date || !form.description) {
      Toast.show({ type: 'error', text1: 'Fill all required fields' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (form.tags) {
        const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
        tagArray.forEach(tag => fd.append('tags', tag));
      }
      await tripAPI.create(fd);
      Toast.show({ type: 'success', text1: 'Trip Created! 🏍️', text2: 'Share it with the community.' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create trip' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan a Trip</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Field label="Trip Title *" placeholder="e.g. Goa Beach Expedition 2025" value={form.title} onChangeText={v => update('title', v)} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Start City *" placeholder="e.g. Mumbai" value={form.startCity} onChangeText={v => update('startCity', v)} />
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} style={{ marginTop: 28 }} />
            <View style={{ flex: 1 }}>
              <Field label="Destination *" placeholder="e.g. Goa" value={form.destination} onChangeText={v => update('destination', v)} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Start Date *" placeholder="YYYY-MM-DD" value={form.date} onChangeText={v => update('date', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End Date" placeholder="YYYY-MM-DD" value={form.endDate} onChangeText={v => update('endDate', v)} />
            </View>
          </View>
          <Field label="Max Riders" placeholder="8" value={form.maxRiders} onChangeText={v => update('maxRiders', v)} keyboardType="numeric" />
          <Field label="Tags" placeholder="goa, coastal, weekend" value={form.tags} onChangeText={v => update('tags', v)} hint="Comma-separated" />
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the route, stops, requirements..."
            placeholderTextColor={COLORS.textMuted}
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.cta}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.ctaGradient}>
              <Ionicons name="bicycle" size={20} color="#fff" />
              <Text style={styles.ctaText}>{loading ? 'Creating...' : 'Create Trip'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType, hint }: any) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  row: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: 4 },
  fieldHint: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: 4 },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base, borderWidth: 1, borderColor: COLORS.glassBorder },
  textArea: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base, borderWidth: 1, borderColor: COLORS.glassBorder, minHeight: 140 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: COLORS.background },
  ctaBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
