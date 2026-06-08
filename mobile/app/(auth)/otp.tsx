import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function OTPScreen() {
  const router = useRouter();
  const { phone, name, role } = useLocalSearchParams<{ phone: string; name: string; role: string }>();
  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [firebaseToken, setFirebaseToken] = useState('');

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (!value && index > 0) inputs.current[index - 1]?.focus();

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter 6-digit OTP' });
      return;
    }

    setLoading(true);
    try {
      // In production, use Firebase Auth to get the token
      // For now we simulate with a placeholder
      const mockFirebaseToken = firebaseToken || 'firebase_id_token_here';

      const response = await authAPI.verifyOTP(phone!, mockFirebaseToken, name, role);
      const { token, user } = response.data;

      await setToken(token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      setUser(user);

      Toast.show({ type: 'success', text1: 'Welcome to ROVER! 🏍️' });

      if (user.role === 'rider') router.replace('/(rider)/home');
      else router.replace('/(owner)/home');
    } catch {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please check the code and try again' });
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.phoneIcon}>
            <Ionicons name="phone-portrait" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>+91 {phone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpInput, digit !== '' && styles.otpInputFilled]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v.slice(-1), index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyDisabled]}
          onPress={() => handleVerify()}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={() => {
              setResendTimer(30);
              authAPI.sendOTP(phone!);
              Toast.show({ type: 'info', text1: 'OTP resent' });
            }}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 60 },
  backBtn: { marginBottom: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  phoneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,107,0,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  phone: { color: COLORS.primary, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  otpInput: {
    width: 52, height: 60, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.glassBorder, backgroundColor: COLORS.surface,
    textAlign: 'center', fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text,
  },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,0,0.1)' },
  verifyButton: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  verifyDisabled: { opacity: 0.6 },
  gradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  verifyText: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  resendRow: { alignItems: 'center' },
  resendTimer: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  resendText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
