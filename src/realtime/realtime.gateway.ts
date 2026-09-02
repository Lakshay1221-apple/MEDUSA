import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    if (data?.workspaceId) {
      client.join(`workspace:${data.workspaceId}`);
      return { status: 'joined', room: `workspace:${data.workspaceId}` };
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data?.userId) {
      client.join(`user:${data.userId}`);
      return { status: 'joined', room: `user:${data.userId}` };
    }
  }

  @OnEvent(DOMAIN_EVENTS.SCORE_UPDATED)
  handleScoreUpdated(payload: any) {
    if (this.server) {
      this.server.to(`user:${payload.userId}`).emit('SCORE_UPDATED', payload);
      if (payload.arcId) {
        this.server.emit('SCORE_UPDATED_GLOBAL', payload);
      }
    }
  }

  @OnEvent(DOMAIN_EVENTS.STREAK_MILESTONE)
  handleStreakMilestone(payload: any) {
    if (this.server) {
      this.server.to(`user:${payload.userId}`).emit('STREAK_MILESTONE', payload);
    }
  }

  @OnEvent(DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED)
  handleAchievementUnlocked(payload: any) {
    if (this.server) {
      this.server.to(`user:${payload.userId}`).emit('ACHIEVEMENT_UNLOCKED', payload);
    }
  }
}
