import { Module } from '@nestjs/common';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';
import { ChatModule } from '../chat/chat.module';
import { PointsModule } from '../points/points.module';
import { LLMModule } from '../llm/llm.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ChatModule, PointsModule, LLMModule, DatabaseModule],
  controllers: [DaoController],
  providers: [DaoService],
  exports: [DaoService],
})
export class DaoModule {}
