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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client connection rejected: No token provided. ID: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      
      this.logger.log(`Client connected: ${client.id} Payload: ${JSON.stringify(payload)}`);
      
      // Join a room based on orgId if present in payload
      if (payload.orgId) {
        client.join(`org_${payload.orgId}`);
      }
    } catch (err) {
      this.logger.error(`Client connection rejected: Invalid token. ID: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org_${orgId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.emit(`${event}_${conversationId}`, data);
  }
}
