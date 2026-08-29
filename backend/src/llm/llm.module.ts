import { Module, Global } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMConfigService } from './llm-config.service';
import { LLMController, AdminModelController } from './llm-config.controller';

@Global()
@Module({
  providers: [LLMService, LLMConfigService],
  controllers: [LLMController, AdminModelController],
  exports: [LLMService, LLMConfigService],
})
export class LLMModule {}
