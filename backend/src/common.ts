import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

/** 数字人照片上传目录（UPLOAD_DIR 优先，默认 <backend>/uploads/avatars） */
export function avatarUploadDir(): string {
  const base = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads/avatars');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

/** 3D 模型（.glb）上传目录（MODEL_UPLOAD_DIR 优先，默认 <backend>/uploads/models） */
export function modelUploadDir(): string {
  const base = process.env.MODEL_UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads/models');
  fs.mkdirSync(base, { recursive: true });
  return base;
}

/** 认证用户 */
export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
}

/** 公开接口标记（跳过全局认证） */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** 演示模式：未配置 DATABASE_URL 或显式 DEMO_MODE=true 时启用 */
export const IS_DEMO = (): boolean =>
  process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;

/** 取当前登录用户（由 AuthGuard 注入） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser;
  },
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    if (IS_DEMO()) {
      const req = ctx.switchToHttp().getRequest();
      req.user = { id: 'demo-user', phone: '13800000000', role: 'admin' } as AuthUser;
      return true;
    }
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('缺少认证令牌');
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET ?? 'dev-secret') as AuthUser;
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('令牌无效或已过期');
    }
  }
}

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (IS_DEMO()) return true;
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser;
    return required.includes(user.role);
  }
}
