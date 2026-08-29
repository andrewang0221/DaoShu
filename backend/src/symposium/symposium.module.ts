import { Module } from '@nestjs/common';
import { SymposiumController } from './symposium.controller';
import { SymposiumService } from './symposium.service';
import { ChatModule } from '../chat/chat.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { LLMModule } from '../llm/llm.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ChatModule, KnowledgeModule, LLMModule, DatabaseModule],
  controllers: [SymposiumController],
  providers: [SymposiumService],
  exports: [SymposiumService],
})
export class SymposiumModule {}
