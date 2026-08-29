import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthUser, CurrentUser } from '../common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations/:digitalHumanId')
  list(@Param('digitalHumanId') dhId: string) {
    return this.chat.listConversations(dhId);
  }

  @Post('conversations')
  create(@Body() dto: { digitalHumanId: string; mode?: string; title?: string }) {
    return this.chat.createConversation(dto.digitalHumanId, dto.mode, dto.title);
  }

  @Get('conversations/:id/messages')
  messages(@Param('id') id: string) {
    return this.chat.getMessages(id);
  }

  @Post('conversations/:id/messages')
  ask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { content: string },
  ) {
    return this.chat.ask(id, dto.content, user?.id);
  }

  /** 流式问答（SSE）：delta 增量 / final 完整消息 / error 错误 */
  @Post('conversations/:id/messages/stream')
  async askStream(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: { content: string },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx 不缓冲，逐段下发
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    try {
      const message = await this.chat.askStream(id, dto.content, user?.id, (delta) => {
        res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
      });
      res.write(`data: ${JSON.stringify({ type: 'final', message })}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: (e as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
