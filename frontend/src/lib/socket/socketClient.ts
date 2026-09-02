import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/realtime';

class RealtimeSocketManager {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private currentWorkspaceId: string | null = null;

  public connect(userId?: string, workspaceId?: string) {
    if (typeof window === 'undefined') return;

    if (!this.socket) {
      this.socket = io(WS_BASE_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        if (this.currentUserId) {
          this.socket?.emit('join_user', { userId: this.currentUserId });
        }
        if (this.currentWorkspaceId) {
          this.socket?.emit('join_workspace', { workspaceId: this.currentWorkspaceId });
        }
      });
    }

    if (userId && userId !== this.currentUserId) {
      this.currentUserId = userId;
      if (this.socket.connected) {
        this.socket.emit('join_user', { userId });
      }
    }

    if (workspaceId && workspaceId !== this.currentWorkspaceId) {
      this.currentWorkspaceId = workspaceId;
      if (this.socket.connected) {
        this.socket.emit('join_workspace', { workspaceId });
      }
    }
  }

  public joinWorkspace(workspaceId: string) {
    this.currentWorkspaceId = workspaceId;
    if (this.socket?.connected) {
      this.socket.emit('join_workspace', { workspaceId });
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
    return () => {
      this.socket?.off(event, callback);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    this.currentWorkspaceId = null;
  }
}

export const realtimeSocket = new RealtimeSocketManager();
