import { Controller, Get } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common';

@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
