import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { requestAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const STEPS = ['Route', 'Schedule', 'Bike', 'Budget', 'Photos'];

const BIKE_BRANDS = ['Royal Enfield', 'Honda', 'Yamaha', 'Bajaj', 'KTM', 'Suzuki', 'TVS', 'Hero', 'Kawasaki', 'Triumph'];

export default function CreateRequest() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickupCity: '', destinationCity: '',
    pickupDate: '', deliveryDeadline: '',
    bikeBrand: '', bikeModel: '', registrationNumber: '',
    budget: '', notes: '',
  });
  const [bikeImages, setBikeImages] = useState<string[]>([]);

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setBikeImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      bikeImages.forEach((uri, i) => {
        fd.append('bikeImages', { uri, name: `bike_${i}.jpg`, type: 'image/jpeg' } as unknown as Blob);
      });

      await requestAPI.create(fd);
      Toast.show({ type: 'success', text1: 'Request Posted! 🏍️', text2: 'Riders will start applying soon.' });
      router.push('/(owner)/rider-discovery');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to post request', text2: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    if (step === 0) return form.pickupCity && form.destinationCity;
    if (step === 1) return form.pickupDate && form.deliveryDeadline;
    if (step === 2) return form.bikeBrand && form.bikeModel && form.registrationNumber;
    if (step === 3) return form.budget;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Transport Request</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.progressStep, i <= step && styles.progressStepActive]}>
                {i < step
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[styles.progressStepText, i === step && styles.progressStepTextActive]}>{i + 1}</Text>}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.progressLine, i < step && styles.progressLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEPS[step]}</Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Where is your bike going?</Text>
              <InputField label="Pickup City" placeholder="e.g. Mumbai" value={form.pickupCity} onChangeText={v => update('pickupCity', v)} icon="location" />
              <View style={styles.routeArrow}>
                <Ionicons name="arrow-down" size={24} color={COLORS.primary} />
              </View>
              <InputField label="Destination City" placeholder="e.g. Goa" value={form.destinationCity} onChangeText={v => update('destinationCity', v)} icon="flag" />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>When do you need it?</Text>
              <InputField label="Pickup Date" placeholder="YYYY-MM-DD" value={form.pickupDate} onChangeText={v => update('pickupDate', v)} icon="calendar" />
              <InputField label="Delivery Deadline" placeholder="YYYY-MM-DD" value={form.deliveryDeadline} onChangeText={v => update('deliveryDeadline', v)} icon="time" />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tell us about your bike</Text>
              <Text style={styles.fieldLabel}>Brand</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                {BIKE_BRANDS.map(brand => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.brandPill, form.bikeBrand === brand && styles.brandPillActive]}
                    onPress={() => update('bikeBrand', brand)}
                  >
                    <Text style={[styles.brandPillText, form.bikeBrand === brand && styles.brandPillTextActive]}>{brand}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <InputField label="Model" placeholder="e.g. Classic 350" value={form.bikeModel} onChangeText={v => update('bikeModel', v)} icon="bicycle" />
              <InputField label="Registration Number" placeholder="e.g. MH01AB1234" value={form.registrationNumber} onChangeText={v => update('registrationNumber', v.toUpperCase())} icon="id-card" />
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Budget & Notes</Text>
              <InputField label="Your Budget (₹)" placeholder="e.g. 3500" value={form.budget} onChangeText={v => update('budget', v)} icon="wallet" keyboardType="numeric" />
              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any special instructions for the rider..."
                placeholderTextColor={COLORS.textMuted}
                value={form.notes}
                onChangeText={v => update('notes', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload bike photos</Text>
              <Text style={styles.stepSubtitle}>Help riders see your bike before taking the job</Text>
              <View style={styles.imagesGrid}>
                {bikeImages.map((uri, i) => (
                  <View key={i} style={styles.imageThumb}>
                    <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: RADIUS.md }} />
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() => setBikeImages(imgs => imgs.filter((_, idx) => idx !== i))}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {bikeImages.length < 5 && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                    <Ionicons name="camera" size={32} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, (!canContinue() || loading) && styles.ctaDisabled]}
            onPress={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
            disabled={!canContinue() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaText}>
                {loading ? 'Posting...' : step < STEPS.length - 1 ? 'Continue' : 'Post Request'}
              </Text>
              <Ionicons name={step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark'} size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ label, placeholder, value, onChangeText, icon, keyboardType }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  icon: string; keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon as 'location'} size={18} color={COLORS.primary} />
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: 4 },
  progressStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  progressStepActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressStepText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  progressStepTextActive: { color: '#fff' },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.glass },
  progressLineActive: { backgroundColor: COLORS.primary },
  stepLabel: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 1 },
  content: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  stepContent: { flex: 1 },
  stepTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: SPACING.lg },
  stepSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, marginBottom: SPACING.lg, marginTop: -SPACING.sm },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.glassBorder, gap: SPACING.sm },
  inputField: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base },
  routeArrow: { alignItems: 'center', paddingVertical: SPACING.sm },
  brandPill: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: SPACING.xs, backgroundColor: COLORS.glass },
  brandPillActive: { backgroundColor: 'rgba(255,107,0,0.2)', borderColor: COLORS.primary },
  brandPillText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  brandPillTextActive: { color: COLORS.primary },
  notesInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base, borderWidth: 1, borderColor: COLORS.glassBorder, minHeight: 100 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  imageThumb: { width: 100, height: 100, position: 'relative' },
  removeImage: { position: 'absolute', top: -8, right: -8 },
  addImageBtn: { width: 100, height: 100, backgroundColor: COLORS.glass, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed', gap: 6 },
  addImageText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  ctaContainer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  ctaButton: { borderRadius: RADIUS.md, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  ctaText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
