import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, Image, ViewToken,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { postAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const { height, width } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    postAPI.getReels({ limit: 20 }).then(res => setReels(res.data.reels || []));
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index || 0);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        keyExtractor={item => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} isActive={index === activeIndex} currentUserId={user?._id} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="play-circle-outline" size={80} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No reels yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share a ride reel!</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function ReelItem({ reel, isActive, currentUserId }: { reel: any; isActive: boolean; currentUserId?: string }) {
  const videoRef = useRef<Video>(null);
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId));
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  const handleLike = async () => {
    try {
      await postAPI.like(reel._id);
      setLiked(!liked);
      setLikesCount((c: number) => liked ? c - 1 : c + 1);
    } catch { /* ignore */ }
  };

  return (
    <View style={styles.reelContainer}>
      {reel.videos?.[0] ? (
        <Video
          ref={videoRef}
          source={{ uri: reel.videos[0] }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={muted}
          shouldPlay={isActive}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Ionicons name="play-circle" size={80} color={COLORS.primary} />
        </View>
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Author info */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {reel.authorId?.avatar
              ? <Image source={{ uri: reel.authorId.avatar }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.primary }} />
              : <Ionicons name="person-circle" size={44} color={COLORS.textMuted} />}
          </View>
          <View>
            <Text style={styles.authorName}>{reel.authorId?.name}</Text>
            <Text style={styles.authorCity}>{reel.authorId?.city}</Text>
          </View>
        </View>

        {reel.content !== '' && <Text style={styles.caption} numberOfLines={3}>{reel.content}</Text>}

        {/* Tags */}
        {reel.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {reel.tags.map((t: string) => <Text key={t} style={styles.tag}>#{t}</Text>)}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? '#EF4444' : '#fff'} />
          <Text style={styles.actionCount}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>{reel.comments?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-outline" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setMuted(m => !m)}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  reelContainer: { width, height, position: 'relative' },
  video: { width, height },
  videoPlaceholder: { width, height, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  overlay: { position: 'absolute', bottom: 100, left: 0, right: 80, padding: SPACING.lg },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  authorAvatar: {},
  authorName: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  authorCity: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs },
  caption: { color: '#fff', fontSize: FONTS.sizes.base, lineHeight: 22, marginBottom: SPACING.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs },
  actions: { position: 'absolute', right: SPACING.md, bottom: 100, alignItems: 'center', gap: SPACING.lg },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionCount: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  backBtn: { position: 'absolute', top: 50, left: SPACING.lg },
  empty: { height, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyText: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '700' },
  emptySubtext: { color: COLORS.textSecondary, textAlign: 'center' },
});
