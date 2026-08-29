import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser, Public } from '../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body()
    dto: { username: string; password: string; email?: string; nickname?: string },
  ) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: { account: string; password: string }) {
    return this.auth.login(dto.account, dto.password);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body('account') account: string) {
    return this.auth.forgotPassword(account);
  }

  @Public()
  @Post('reset-password')
  resetPassword(
    @Body() dto: { account: string; code: string; newPassword: string },
  ) {
    return this.auth.resetPassword(dto.account, dto.code, dto.newPassword);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    return this.auth.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }
}