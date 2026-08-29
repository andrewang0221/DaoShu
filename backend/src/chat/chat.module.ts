import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { KnowledgeRetriever } from './knowledge-retriever.service';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [EvolutionModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, KnowledgeRetriever],
  exports: [ChatService, KnowledgeRetriever],
})
export class ChatModule {}
