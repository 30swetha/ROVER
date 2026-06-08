import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { connectSocket, sendLocationUpdate } from '../../services/socket';
import { emergencyAPI } from '../../services/api';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function ActiveRideScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [distance, setDistance] = useState('--');
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setupSocket();
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  const setupSocket = async () => {
    await connectSocket();
    await startTracking();
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Location permission required' });
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const toggleSharing = async (value: boolean) => {
    setSharing(value);
    if (value) {
      locationInterval.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          const position = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setLocation(position);
          sendLocationUpdate(position);
        } catch { /* ignore */ }
      }, 10000);
      Toast.show({ type: 'success', text1: 'Location sharing ON', text2: 'Owner can now track you live.' });
    } else {
      if (locationInterval.current) clearInterval(locationInterval.current);
      Toast.show({ type: 'info', text1: 'Location sharing paused' });
    }
  };

  const handleSOS = async () => {
    Alert.alert('🚨 SOS', 'Trigger emergency alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'SEND SOS', style: 'destructive',
        onPress: async () => {
          if (location) {
            await emergencyAPI.triggerSOS({ lat: location.lat, lng: location.lng });
            Toast.show({ type: 'error', text1: '🚨 SOS SENT', text2: 'Help is on the way!' });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, sharing && styles.liveDotActive]} />
          <Text style={styles.liveText}>{sharing ? 'LIVE' : 'PAUSED'}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          userInterfaceStyle="dark"
          showsUserLocation
          initialRegion={{
            latitude: location?.lat || 19.076,
            longitude: location?.lng || 72.877,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {location && (
            <Marker coordinate={{ latitude: location.lat, longitude: location.lng }}>
              <View style={styles.myMarker}>
                <Ionicons name="bicycle" size={18} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Controls */}
      <View style={styles.controlsCard}>
        <View style={styles.shareRow}>
          <View>
            <Text style={styles.shareTitle}>Share Live Location</Text>
            <Text style={styles.shareSubtitle}>Owner tracks your journey in real-time</Text>
          </View>
          <Switch
            value={sharing}
            onValueChange={toggleSharing}
            trackColor={{ false: COLORS.glass, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Current Location</Text>
            <Text style={styles.infoValue}>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring...'}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/chat/conversations')}
          >
            <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
            <Text style={styles.chatBtnText}>Message Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
            <LinearGradient colors={['#DC2626', '#991B1B']} style={styles.sosGradient}>
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.sosBtnText}>SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.completeBtn} activeOpacity={0.8}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.completeGradient}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.completeBtnText}>Complete Delivery</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.glass, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textMuted },
  liveDotActive: { backgroundColor: '#22C55E' },
  liveText: { color: COLORS.text, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  myMarker: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  controlsCard: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  shareTitle: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.base },
  shareSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  infoRow: { marginBottom: SPACING.md },
  infoItem: { gap: 3 },
  infoLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  infoValue: { color: COLORS.text, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,107,0,0.1)', padding: SPACING.sm, borderRadius: RADIUS.md },
  chatBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sosBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  sosGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  sosBtnText: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.base },
  completeBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  completeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
