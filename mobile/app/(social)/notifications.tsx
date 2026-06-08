import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { notificationAPI } from '../../services/api';
import { useNotificationStore } from '../../store/notification.store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  application: { icon: 'bicycle', color: COLORS.primary },
  selection: { icon: 'star', color: COLORS.gold },
  payment: { icon: 'wallet', color: COLORS.success },
  message: { icon: 'chatbubble', color: '#3B82F6' },
  verification: { icon: 'shield-checkmark', color: COLORS.success },
  trip_update: { icon: 'map', color: '#7C3AED' },
  community: { icon: 'people', color: COLORS.primary },
  sos: { icon: 'warning', color: COLORS.error },
  achievement: { icon: 'trophy', color: COLORS.gold },
  system: { icon: 'information-circle', color: COLORS.textSecondary },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } = useNotificationStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    notificationAPI.getAll({ limit: 50 }).then(res => {
      setNotifications(res.data.notifications || [], res.data.unreadCount || 0);
    }).finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    markRead(id);
    await notificationAPI.markRead(id);
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationAPI.markAllRead();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unreadBadge}>{unreadCount} new</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        : <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
            renderItem={({ item }) => {
              const { icon, color } = TYPE_ICONS[item.type] || TYPE_ICONS.system;
              return (
                <TouchableOpacity
                  style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                  onPress={() => handleMarkRead(item._id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notifIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as 'bicycle'} size={22} color={color} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            }
          />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  unreadBadge: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  markAllText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  notifCardUnread: { backgroundColor: 'rgba(255,107,0,0.05)' },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm, marginBottom: 2 },
  notifBody: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 18, marginBottom: 4 },
  notifTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: SPACING['2xl'], gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
});
