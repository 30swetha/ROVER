import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { riderAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const STEPS = ['License', 'Aadhaar', 'Selfie', 'Submit'];

export default function VerificationScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<{
    licenseUri?: string; aadhaarUri?: string; selfieUri?: string;
    licenseNumber?: string; aadhaarNumber?: string;
  }>({});

  const pickImage = async (field: 'licenseUri' | 'aadhaarUri') => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (!result.canceled) setDocs(d => ({ ...d, [field]: result.assets[0].uri }));
  };

  const takeSelfie = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Camera permission required' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.9 });
    if (!result.canceled) setDocs(d => ({ ...d, selfieUri: result.assets[0].uri }));
  };

  const handleSubmit = async () => {
    if (!docs.licenseUri || !docs.aadhaarUri || !docs.selfieUri) {
      Toast.show({ type: 'error', text1: 'All documents required' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('license', { uri: docs.licenseUri, name: 'license.jpg', type: 'image/jpeg' } as unknown as Blob);
      fd.append('aadhaar', { uri: docs.aadhaarUri, name: 'aadhaar.jpg', type: 'image/jpeg' } as unknown as Blob);
      fd.append('selfie', { uri: docs.selfieUri, name: 'selfie.jpg', type: 'image/jpeg' } as unknown as Blob);
      if (docs.licenseNumber) fd.append('licenseNumber', docs.licenseNumber);
      if (docs.aadhaarNumber) fd.append('aadhaarNumber', docs.aadhaarNumber);

      await riderAPI.uploadDocuments(fd);
      Toast.show({ type: 'success', text1: 'Documents Submitted! 🎉', text2: 'Admin will review within 24 hours.' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.progressStep, i <= step && styles.progressActive]}>
              {i < step ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNum}>{i + 1}</Text>}
            </View>
            {i < STEPS.length - 1 && <View style={[styles.progressLine, i < step && styles.progressLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <DocUpload
            title="Driving License"
            subtitle="Upload a clear photo of your driving license (front)"
            imageUri={docs.licenseUri}
            onUpload={() => pickImage('licenseUri')}
            extraField={
              <TextInput
                style={styles.textInput}
                placeholder="License Number (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={docs.licenseNumber}
                onChangeText={v => setDocs(d => ({ ...d, licenseNumber: v }))}
              />
            }
          />
        )}

        {step === 1 && (
          <DocUpload
            title="Aadhaar Card"
            subtitle="Upload a clear photo of your Aadhaar card (front)"
            imageUri={docs.aadhaarUri}
            onUpload={() => pickImage('aadhaarUri')}
            extraField={
              <TextInput
                style={styles.textInput}
                placeholder="Aadhaar Number (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={docs.aadhaarNumber}
                onChangeText={v => setDocs(d => ({ ...d, aadhaarNumber: v }))}
                keyboardType="numeric"
                maxLength={12}
              />
            }
          />
        )}

        {step === 2 && (
          <View style={styles.selfieContainer}>
            <Text style={styles.docTitle}>Selfie Verification</Text>
            <Text style={styles.docSubtitle}>Take a live selfie. Make sure your face is clearly visible in good lighting.</Text>
            {docs.selfieUri
              ? <Image source={{ uri: docs.selfieUri }} style={styles.selfiePreview} />
              : <View style={styles.selfieIcon}>
                  <Ionicons name="person-circle" size={100} color={COLORS.textMuted} />
                </View>}
            <TouchableOpacity style={styles.cameraBtn} onPress={takeSelfie}>
              <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.cameraGradient}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.cameraBtnText}>{docs.selfieUri ? 'Retake Selfie' : 'Take Selfie'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.docTitle}>Review & Submit</Text>
            <Text style={styles.docSubtitle}>Please review your documents before submitting for verification.</Text>
            <ReviewItem label="Driving License" value={docs.licenseUri ? '✅ Uploaded' : '❌ Missing'} />
            <ReviewItem label="Aadhaar Card" value={docs.aadhaarUri ? '✅ Uploaded' : '❌ Missing'} />
            <ReviewItem label="Selfie" value={docs.selfieUri ? '✅ Captured' : '❌ Missing'} />

            <View style={styles.noteCard}>
              <Ionicons name="information-circle" size={18} color={COLORS.info} />
              <Text style={styles.noteText}>Verification typically takes 24-48 hours. You'll be notified once approved.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
          disabled={loading || (step === 0 && !docs.licenseUri) || (step === 1 && !docs.aadhaarUri) || (step === 2 && !docs.selfieUri)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.ctaGradient}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>{step < STEPS.length - 1 ? 'Continue' : 'Submit Documents'}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DocUpload({ title, subtitle, imageUri, onUpload, extraField }: any) {
  return (
    <View>
      <Text style={styles.docTitle}>{title}</Text>
      <Text style={styles.docSubtitle}>{subtitle}</Text>
      <TouchableOpacity style={[styles.uploadBox, imageUri && styles.uploadBoxFilled]} onPress={onUpload}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
          : <>
              <Ionicons name="cloud-upload" size={48} color={COLORS.primary} />
              <Text style={styles.uploadText}>Tap to upload</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB</Text>
            </>}
      </TouchableOpacity>
      {extraField}
    </View>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewItem}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  progressStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  progressActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.glass },
  progressLineActive: { backgroundColor: COLORS.primary },
  content: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  docTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: SPACING.xs },
  docSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, marginBottom: SPACING.lg, lineHeight: 22 },
  uploadBox: { borderWidth: 2, borderColor: COLORS.cardBorder, borderStyle: 'dashed', borderRadius: RADIUS.xl, height: 200, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  uploadBoxFilled: { borderStyle: 'solid', borderColor: COLORS.primary, overflow: 'hidden' },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.md },
  uploadSubtext: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  textInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.glassBorder },
  selfieContainer: { alignItems: 'center', gap: SPACING.md },
  selfiePreview: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: COLORS.primary },
  selfieIcon: { marginVertical: SPACING.lg },
  cameraBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%' },
  cameraGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  cameraBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(59,130,246,0.1)', padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.md },
  noteText: { color: COLORS.info, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 20 },
  reviewItem: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  reviewLabel: { color: COLORS.textSecondary, fontWeight: '600' },
  reviewValue: { color: COLORS.text },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, backgroundColor: COLORS.background },
  ctaBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  ctaGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
