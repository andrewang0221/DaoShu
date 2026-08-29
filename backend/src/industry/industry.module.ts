import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { LLMModule } from '../llm/llm.module';
import { PointsModule } from '../points/points.module';
import { IndustryController } from './industry.controller';
import { IndustryService } from './industry.service';

@Module({
  imports: [ChatModule, LLMModule, PointsModule],
  controllers: [IndustryController],
  providers: [IndustryService],
  exports: [IndustryService],
})
export class IndustryModule {}
