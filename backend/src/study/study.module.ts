import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  imports: [ChatModule],
  controllers: [StudyController],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}
