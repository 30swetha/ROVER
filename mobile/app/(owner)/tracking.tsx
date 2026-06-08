import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connectSocket, trackRequest } from '../../services/socket';
import { emergencyAPI } from '../../services/api';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function TrackingScreen() {
  const router = useRouter();
  const { requestId, riderId, riderName, pickupCity, destinationCity } = useLocalSearchParams<{
    requestId: string; riderId: string; riderName: string;
    pickupCity: string; destinationCity: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [ownerLocation, setOwnerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState('Calculating...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setupTracking();
    return () => {};
  }, []);

  const setupTracking = async () => {
    // Get owner location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setOwnerLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    }

    // Connect socket and listen for rider location
    const socket = await connectSocket();
    trackRequest(requestId!);

    socket.on('rider-location', (data: { riderId: string; lat: number; lng: number }) => {
      if (data.riderId === riderId) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
        setProgress(prev => Math.min(prev + 2, 95));
        setEta('~2 hrs 30 min remaining');

        mapRef.current?.animateToRegion({
          latitude: data.lat,
          longitude: data.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });
  };

  const handleSOS = async () => {
    Alert.alert('🚨 SOS Emergency', 'Are you sure you want to trigger an emergency alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS', style: 'destructive',
        onPress: async () => {
          if (ownerLocation) {
            await emergencyAPI.triggerSOS({
              lat: ownerLocation.lat,
              lng: ownerLocation.lng,
              requestId: requestId!,
            });
            Toast.show({ type: 'error', text1: '🚨 SOS Sent', text2: 'Emergency team has been notified.' });
          }
        },
      },
    ]);
  };

  const defaultRegion = {
    latitude: riderLocation?.lat || 19.076,
    longitude: riderLocation?.lng || 72.877,
    latitudeDelta: 2,
    longitudeDelta: 2,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <Text style={styles.headerSubtitle}>{pickupCity} → {destinationCity}</Text>
        </View>
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={defaultRegion}
          userInterfaceStyle="dark"
          customMapStyle={darkMapStyle}
        >
          {riderLocation && (
            <Marker coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }} title={riderName || 'Rider'}>
              <View style={styles.riderMarker}>
                <Ionicons name="bicycle" size={20} color="#fff" />
              </View>
            </Marker>
          )}
          {ownerLocation && (
            <Marker coordinate={{ latitude: ownerLocation.lat, longitude: ownerLocation.lng }} title="Your Location" pinColor={COLORS.primary} />
          )}
          {riderLocation && ownerLocation && (
            <Polyline
              coordinates={[
                { latitude: riderLocation.lat, longitude: riderLocation.lng },
                { latitude: ownerLocation.lat, longitude: ownerLocation.lng },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>ETA: {eta}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FF6B00', '#CC4400']}
              style={[styles.progressBar, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>{progress}% complete</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: riderId! } })}
          >
            <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Message Rider</Text>
          </TouchableOpacity>

          {progress >= 95 && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => router.push({ pathname: '/(owner)/payments', params: { requestId, complete: 'true' } })}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.completeGradient}>
                <Text style={styles.completeBtnText}>Mark Delivered ✓</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  headerSubtitle: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  sosBtn: { backgroundColor: '#DC2626', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  sosBtnText: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.sm },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  riderMarker: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  infoCard: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  infoText: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '600' },
  progressContainer: { marginBottom: SPACING.md },
  progressTrack: { height: 6, backgroundColor: COLORS.glass, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBar: { height: '100%', borderRadius: 3 },
  progressText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,0,0.15)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, flex: 1, justifyContent: 'center' },
  actionBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  completeBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  completeGradient: { paddingVertical: SPACING.sm, alignItems: 'center', justifyContent: 'center' },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
});
