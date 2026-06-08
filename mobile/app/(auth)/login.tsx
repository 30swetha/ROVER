import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { authAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const ROLES = [
  { value: 'owner', label: 'Bike Owner', icon: 'key', desc: 'Send your bike with a trusted rider' },
  { value: 'rider', label: 'Rider', icon: 'bicycle', desc: 'Earn by transporting bikes' },
  { value: 'tripPartner', label: 'Trip Partner', icon: 'map', desc: 'Find fellow bikers & plan trips' },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'rider' | 'tripPartner'>('owner');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'details'>('phone');

  const handleContinue = async () => {
    if (step === 'phone') {
      if (phone.length !== 10) {
        Toast.show({ type: 'error', text1: 'Invalid phone number', text2: 'Enter a valid 10-digit number' });
        return;
      }
      setStep('details');
      return;
    }

    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name required', text2: 'Please enter your name' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOTP(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone, name, role: selectedRole } });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send OTP. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.logo}>
            <Ionicons name="bicycle" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>ROVER</Text>
          <Text style={styles.tagline}>Ride • Relocate • Earn</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.cardTitle}>Enter your mobile number</Text>
              <Text style={styles.cardSubtitle}>We'll send you an OTP to verify your identity</Text>

              <View style={styles.phoneInput}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('phone')}>
                <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Tell us about yourself</Text>

              <TextInput
                style={styles.nameInput}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text style={styles.sectionLabel}>I want to join as</Text>
              <View style={styles.rolesGrid}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[styles.roleCard, selectedRole === role.value && styles.roleCardActive]}
                    onPress={() => setSelectedRole(role.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={role.icon as 'key' | 'bicycle' | 'map'}
                      size={24}
                      color={selectedRole === role.value ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.roleLabel, selectedRole === role.value && styles.roleLabelActive]}>
                      {role.label}
                    </Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.ctaButton, loading && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaText}>{loading ? 'Please wait...' : step === 'phone' ? 'Continue' : 'Get OTP'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  logoText: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.text, letterSpacing: 4 },
  tagline: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  cardSubtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  phoneInput: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  countryCode: { backgroundColor: COLORS.glass, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, justifyContent: 'center', borderRightWidth: 1, borderRightColor: COLORS.cardBorder },
  countryText: { color: COLORS.text, fontSize: FONTS.sizes.base },
  input: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: 6 },
  backText: { color: COLORS.primary, fontWeight: '600' },
  nameInput: { borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.md, marginBottom: SPACING.lg },
  sectionLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md },
  rolesGrid: { gap: SPACING.sm, marginBottom: SPACING.lg },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder, gap: SPACING.md },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,0,0.1)' },
  roleLabel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.base, flex: 1 },
  roleLabelActive: { color: COLORS.primary },
  roleDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 2 },
  ctaButton: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
  ctaDisabled: { opacity: 0.6 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  ctaText: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  terms: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.xs, lineHeight: 18 },
  link: { color: COLORS.primary },
});
