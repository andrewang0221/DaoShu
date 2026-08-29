import { Module } from '@nestjs/common';
import { PointsModule } from '../points/points.module';
import { IprController } from './ipr.controller';
import { IprAdminController } from './ipr-admin.controller';
import { IprService } from './ipr.service';

@Module({
  imports: [PointsModule],
  controllers: [IprController, IprAdminController],
  providers: [IprService],
  exports: [IprService],
})
export class IprModule {}
