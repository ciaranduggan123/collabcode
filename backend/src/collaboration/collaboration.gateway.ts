import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { CollaborationService } from './collaboration.service';


@WebSocketGateway({ cors: { origin: '*' } })
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // Redis clients for publishing and subscribing
  private redisPub = new Redis({ host: 'localhost', port: 6379 });
  private redisSub = new Redis({ host: 'localhost', port: 6379 });

  constructor(private jwt: JwtService) {}

  /**
   * Initialize the Redis subscription when the Gateway starts
   */
  afterInit() {
  this.redisSub = new (require('ioredis'))();
  this.redisPub = new (require('ioredis'))();

  this.redisSub.subscribe('code_updates', (err) => {
    if (err) console.error('❌ Redis subscription error:', err);
  });

  this.redisSub.on('message', (channel, message) => {
    try {
      const update = JSON.parse(message.toString());
      this.server.to(update.projectId.toString()).emit('codeUpdate', update);
    } catch (e) {
      console.error('Invalid Redis message:', e);
    }
  });

  console.log('✅ CollaborationGateway initialized');
}


  /**
   * Handle client connection
   */
  
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        console.log('❌ No auth token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      (client as any).user = payload;

      console.log(`✅ ${payload.email} connected [socket:${client.id}]`);
    } catch (error) {
      console.log('❌ Invalid token, disconnecting:', error.message);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    console.log(`❎ Client disconnected: ${client.id}`);
  }

  /**
   * User joins a project room
   */
  @SubscribeMessage('joinProject')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { projectId: number }) {
    client.join(data.projectId.toString());
    client.emit('joinedProject', { projectId: data.projectId });
    console.log(`👥 User joined project ${data.projectId}`);
  }

  /**
   * Handle live code edits
   */
  @SubscribeMessage('editCode')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number; content: string },
  ) {
    if (!data?.projectId || !data?.content) return;

    const update = {
      projectId: data.projectId,
      content: data.content,
      timestamp: Date.now(),
    };

    // Publish the update so all servers (and clients) receive it
    await this.redisPub.publish('code_updates', JSON.stringify(update));
  }
}
