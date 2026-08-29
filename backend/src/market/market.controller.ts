import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketService, PublishDto } from './market.service';
import { AuthUser, CurrentUser } from '../common';

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post('publish')
  publish(@CurrentUser() user: AuthUser, @Body() dto: PublishDto) {
    return this.market.publish(user.id, dto);
  }

  @Get('items')
  list() {
    return this.market.list();
  }

  @Get('items/:id/citations')
  citations(@Param('id') id: string) {
    return this.market.citations(id);
  }
}
