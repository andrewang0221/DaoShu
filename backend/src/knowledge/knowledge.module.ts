import { Module } from '@nestjs/common';
import { KnowledgeController, AdminKnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [KnowledgeController, AdminKnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
