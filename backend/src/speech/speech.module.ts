import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SpeechController, AdminSpeechController } from './speech.controller';
import { SpeechService } from './speech.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SpeechController, AdminSpeechController],
  providers: [SpeechService],
})
export class SpeechModule {}
