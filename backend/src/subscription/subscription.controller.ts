import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  /** 三级产品计划（体验/Pro/企业） */
  @Get('plans')
  plans() {
    return this.service.plans();
  }

  /** 购买/开通（演示模式模拟成功） */
  @Post('orders')
  purchase(@CurrentUser() user: AuthUser, @Body() body: { planCode: string }) {
    return this.service.purchase(user.id, body.planCode);
  }

  /** 我的订阅与权益 */
  @Get('my')
  my(@CurrentUser() user: AuthUser) {
    return this.service.my(user.id);
  }
}