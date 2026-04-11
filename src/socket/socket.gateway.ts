import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

const defaultOrigins =
  process.env.NODE_ENV === 'production'
    ? 'https://intrabox.com.ng,https://www.intrabox.com.ng'
    : 'http://localhost:3001,http://localhost:3000,https://intrabox.com.ng,https://www.intrabox.com.ng';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? defaultOrigins)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Client connection rejected: No token provided. ID: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      this.logger.log(
        `Client connected: ${client.id} Payload: ${JSON.stringify(payload)}`,
      );

      // Join a room based on orgId if present in payload
      if (payload.orgId) {
        client.join(`org_${payload.orgId}`);
      }

      if (payload.orgId) {
        await this.prisma.user.updateMany({
          where: { id: payload.userId, orgId: payload.orgId },
          data: { isOnline: true },
        });
      }

      if (payload.orgId) {
        this.emitToOrg(payload.orgId, 'userStatusChanged', {
          userId: payload.userId,
          isOnline: true,
        });
      }
    } catch (err) {
      this.logger.error(
        `Client connection rejected: Invalid token. ID: ${client.id}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userPayload = client.data?.user;
    if (userPayload?.userId) {
      try {
        await this.prisma.user.updateMany({
          where: { id: userPayload.userId, orgId: userPayload.orgId },
          data: { isOnline: false },
        });

        if (userPayload.orgId) {
          this.emitToOrg(userPayload.orgId, 'userStatusChanged', {
            userId: userPayload.userId,
            isOnline: false,
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update offline status for user ${userPayload.userId}`,
          err,
        );
      }
    }
  }

  emitToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org_${orgId}`).emit(event, data);
  }

  /**
   * Emit to all clients that have joined a specific conversation room.
   * Falls back to org-scoped emission if orgId is provided.
   */
  emitToConversation(
    conversationId: string,
    event: string,
    data: any,
    orgId?: string,
  ) {
    if (orgId) {
      // Only emit to clients in the org room — prevents cross-tenant leakage
      this.server.to(`org_${orgId}`).emit(`${event}_${conversationId}`, data);
    } else {
      // Legacy fallback — conversation room
      this.server
        .to(`conv_${conversationId}`)
        .emit(`${event}_${conversationId}`, data);
    }
  }
}
