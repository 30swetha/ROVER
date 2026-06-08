import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Modal, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { postAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const loadFeed = async () => {
    try {
      const res = await postAPI.getFeed({ limit: 20 });
      setPosts(res.data.posts || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadFeed(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const toggleLike = async (postId: string) => {
    try {
      await postAPI.like(postId);
      setPosts(ps => ps.map(p => {
        if (p._id !== postId) return p;
        const liked = p.likes.includes(user?._id);
        return {
          ...p,
          likes: liked ? p.likes.filter((id: string) => id !== user?._id) : [...p.likes, user?._id],
        };
      }));
    } catch { /* ignore */ }
  };

  const submitPost = async () => {
    if (!newPost.trim() && images.length === 0) {
      Toast.show({ type: 'error', text1: 'Write something or add a photo' });
      return;
    }
    try {
      const fd = new FormData();
      fd.append('content', newPost);
      images.forEach((uri, i) => fd.append('files', { uri, name: `img_${i}.jpg`, type: 'image/jpeg' } as unknown as Blob));
      await postAPI.create(fd);
      setCreateModal(false);
      setNewPost(''); setImages([]);
      Toast.show({ type: 'success', text1: 'Posted! 🏍️' });
      loadFeed();
    } catch {
      Toast.show({ type: 'error', text1: 'Post failed' });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.reelsBtn} onPress={() => router.push('/(social)/reels')}>
            <Ionicons name="play-circle" size={22} color={COLORS.primary} />
            <Text style={styles.reelsBtnText}>Reels</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(social)/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Post */}
      <TouchableOpacity style={styles.createPostBar} onPress={() => setCreateModal(true)}>
        <View style={styles.createAvatar}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            : <Ionicons name="person" size={18} color={COLORS.textMuted} />}
        </View>
        <Text style={styles.createPostPlaceholder}>Share your ride story...</Text>
        <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={() => toggleLike(item._id)} currentUserId={user?._id} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>}
      />

      {/* Create Post Modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share your story</Text>
              <TouchableOpacity onPress={() => { setCreateModal(false); setNewPost(''); setImages([]); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind? Share a ride story..."
              placeholderTextColor={COLORS.textMuted}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              autoFocus
            />
            {images.length > 0 && (
              <View style={styles.imagesRow}>
                {images.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.imageThumb} />
                ))}
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="image" size={22} color={COLORS.primary} />
                <Text style={styles.addImageText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitPost}>
                <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PostCard({ post, onLike, currentUserId }: { post: any; onLike: () => void; currentUserId?: string }) {
  const liked = post.likes.includes(currentUserId);
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          {post.authorId?.avatar
            ? <Image source={{ uri: post.authorId.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            : <Ionicons name="person" size={20} color={COLORS.textMuted} />}
        </View>
        <View>
          <Text style={styles.postAuthor}>{post.authorId?.name}</Text>
          <Text style={styles.postCity}>{post.authorId?.city}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
      </View>

      {post.content !== '' && <Text style={styles.postContent}>{post.content}</Text>}

      {post.images?.[0] && (
        <Image source={{ uri: post.images[0] }} style={styles.postImage} />
      )}

      {post.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag: string) => <Text key={tag} style={styles.postTag}>#{tag}</Text>)}
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionItem} onPress={onLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#EF4444' : COLORS.textSecondary} />
          <Text style={styles.actionCount}>{post.likes?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.actionCount}>{post.comments?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  reelsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  reelsBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  createPostBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  createAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  createPostPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  postCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  postAuthor: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.sm },
  postCity: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  postContent: { color: COLORS.text, fontSize: FONTS.sizes.base, lineHeight: 22, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  postImage: { width: '100%', height: 220 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  postTag: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  postActions: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingTop: SPACING['2xl'] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  postInput: { color: COLORS.text, fontSize: FONTS.sizes.base, lineHeight: 24, minHeight: 100, textAlignVertical: 'top', marginBottom: SPACING.md },
  imagesRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  imageThumb: { width: 80, height: 80, borderRadius: RADIUS.md },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addImageText: { color: COLORS.primary, fontWeight: '600' },
  submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  submitGradient: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  submitText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
