import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
}
