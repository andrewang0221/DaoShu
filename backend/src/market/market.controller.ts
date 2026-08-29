import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketService, PublishDto } from './market.service';
import { AuthUser, CurrentUser, Public } from '../common';

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post('publish')
  publish(@CurrentUser() user: AuthUser, @Body() dto: PublishDto) {
    return this.market.publish(user.id, dto);
  }

  /** 市场列表（游客可浏览） */
  @Public()
  @Get('items')
  list() {
    return this.market.list();
  }

  @Public()
  @Get('items/:id/citations')
  citations(@Param('id') id: string) {
    return this.market.citations(id);
  }
}
