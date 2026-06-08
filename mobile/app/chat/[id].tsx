import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { messageAPI, userAPI } from '../../services/api';
import { connectSocket, sendTyping } from '../../services/socket';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
    setupSocket();
  }, []);

  const loadData = async () => {
    try {
      const [messagesRes, userRes] = await Promise.all([
        messageAPI.getMessages(id!),
        userAPI.getById(id!),
      ]);
      setMessages(messagesRes.data.messages || []);
      setOtherUser(userRes.data.user);
    } catch { /* ignore */ }
  };

  const setupSocket = async () => {
    const socket = await connectSocket();
    socket.on('new-message', (data: any) => {
      if (data.from === id) {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          senderId: id,
          content: data.content,
          type: data.type || 'text',
          createdAt: data.timestamp,
          read: false,
        }]);
        flatListRef.current?.scrollToEnd();
      }
    });
    socket.on('user-typing', (data: { userId: string }) => {
      if (data.userId === id) {
        setIsTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const messageText = text.trim();
    setText('');

    const tempMessage = {
      _id: Date.now().toString(),
      senderId: user?._id,
      content: messageText,
      type: 'text',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, tempMessage]);
    flatListRef.current?.scrollToEnd();

    try {
      await messageAPI.send(id!, messageText);
    } catch { /* ignore, message shown optimistically */ }
  };

  const handleTyping = (value: string) => {
    setText(value);
    sendTyping(id!);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={18} color={COLORS.textMuted} />
          </View>
          <View>
            <Text style={styles.headerName}>{otherUser?.name || 'Loading...'}</Text>
            <Text style={styles.headerStatus}>{isTyping ? 'Typing...' : 'Online'}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="call" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: SPACING.md, gap: SPACING.xs }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?._id || item.senderId?._id === user?._id;
            return (
              <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
                {isMine
                  ? <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.myBubbleGradient}>
                      <Text style={styles.myText}>{item.content}</Text>
                    </LinearGradient>
                  : <View style={styles.theirBubbleInner}>
                      <Text style={styles.theirText}>{item.content}</Text>
                    </View>}
                <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
                  {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={handleTyping}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim()} activeOpacity={0.8}>
            <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.sendGradient}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  headerName: { color: COLORS.text, fontWeight: '700', fontSize: FONTS.sizes.base },
  headerStatus: { color: COLORS.success, fontSize: FONTS.sizes.xs },
  messageBubble: { maxWidth: '75%' },
  myBubble: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirBubble: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  myBubbleGradient: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  myText: { color: '#fff', fontSize: FONTS.sizes.base, lineHeight: 22 },
  theirBubbleInner: { backgroundColor: COLORS.surface, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.glassBorder },
  theirText: { color: COLORS.text, fontSize: FONTS.sizes.base, lineHeight: 22 },
  timestamp: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 3, marginHorizontal: 4 },
  timestampMine: { alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.md, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 24, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.text, fontSize: FONTS.sizes.base, maxHeight: 100, borderWidth: 1, borderColor: COLORS.glassBorder },
  sendBtn: { borderRadius: 24, overflow: 'hidden' },
  sendGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
