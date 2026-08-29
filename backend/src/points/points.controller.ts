import { Body, Controller, Get, Post } from '@nestjs/common';
import { PointsService } from './points.service';
import { AuthUser, CurrentUser } from '../common';

@Controller('points')
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.points.getAccount(user.id);
  }

  @Post('exchange')
  exchange(@CurrentUser() user: AuthUser, @Body('itemCode') itemCode: string) {
    return this.points.exchange(user.id, itemCode);
  }
}
