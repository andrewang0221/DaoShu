import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

/**
 * WebSocket 语音/实时对话网关（协议见《开发需求与技术文档》8.3）
 * 客户端：{ type:'chat', conversationId, content } → 服务端 { type:'answer', data }
 */
@WebSocketGateway({ cors: { origin: true } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chat: ChatService) {}

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() body: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      client.emit('thinking', {});
      const answer = await this.chat.ask(body.conversationId, body.content);
      client.emit('answer', { message: answer });
    } catch (e) {
      client.emit('error', { code: 'CHAT_ERROR', message: (e as Error).message });
    }
  }
}
