import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  const token = await SecureStore.getItemAsync('auth_token');

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket?.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(roomId: string): void {
  socket?.emit('join-room', roomId);
}

export function leaveRoom(roomId: string): void {
  socket?.emit('leave-room', roomId);
}

export function sendLocationUpdate(data: { lat: number; lng: number; requestId?: string }): void {
  socket?.emit('location-update', data);
}

export function trackRequest(requestId: string): void {
  socket?.emit('track-request', requestId);
}

export function sendTyping(to: string, tripId?: string): void {
  socket?.emit('typing', { to, tripId });
}

export function sendReadReceipt(messageId: string, from: string): void {
  socket?.emit('read-receipt', { messageId, from });
}
