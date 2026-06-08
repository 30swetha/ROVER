import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

const activeRiders = new Map<string, { lat: number; lng: number; requestId?: string; updatedAt: Date }>();

export function initSocketService(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    console.log(`Socket connected: ${userId}`);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on('location-update', (data: { lat: number; lng: number; requestId?: string }) => {
      activeRiders.set(userId, { ...data, updatedAt: new Date() });
      if (data.requestId) {
        io.to(`tracking:${data.requestId}`).emit('rider-location', {
          riderId: userId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('track-request', (requestId: string) => {
      socket.join(`tracking:${requestId}`);
    });

    socket.on('send-message', (data: { to: string; content: string; type?: string; tripId?: string }) => {
      const messagePayload = {
        from: userId,
        content: data.content,
        type: data.type || 'text',
        timestamp: new Date().toISOString(),
      };
      if (data.tripId) {
        io.to(`trip:${data.tripId}`).emit('new-message', messagePayload);
      } else {
        io.to(`user:${data.to}`).emit('new-message', messagePayload);
      }
    });

    socket.on('typing', (data: { to: string; tripId?: string }) => {
      if (data.tripId) {
        socket.to(`trip:${data.tripId}`).emit('user-typing', { userId });
      } else {
        io.to(`user:${data.to}`).emit('user-typing', { userId });
      }
    });

    socket.on('read-receipt', (data: { messageId: string; from: string }) => {
      io.to(`user:${data.from}`).emit('message-read', { messageId: data.messageId, readBy: userId });
    });

    socket.on('disconnect', () => {
      activeRiders.delete(userId);
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function getActiveRiderLocation(userId: string) {
  return activeRiders.get(userId);
}
