import { Module } from '@nestjs/common';
import { AdoptionController } from './adoption.controller';
import { AdoptionService } from './adoption.service';
import { GlbGenerationService } from './glb-generation.service';

@Module({
  controllers: [AdoptionController],
  providers: [AdoptionService, GlbGenerationService],
  exports: [AdoptionService],
})
export class AdoptionModule {}
