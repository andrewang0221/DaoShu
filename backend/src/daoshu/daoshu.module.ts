import { Module } from '@nestjs/common';
import { DaoshuController } from './daoshu.controller';
import { DaoshuService } from './daoshu.service';

@Module({
  controllers: [DaoshuController],
  providers: [DaoshuService],
  exports: [DaoshuService],
})
export class DaoshuModule {}