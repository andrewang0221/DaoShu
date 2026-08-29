import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  password_hash: string | null;
}

const SIGNED_COLS = 'id, username, email, phone, role, status';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(private readonly db: DatabaseService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedSuperAdmin();
  }

  // ---------- 工具 ----------
  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private signToken(user: UserRow) {
    return jwt.sign(
      { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET ?? 'dev-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions,
    );
  }

  private toClient(user: UserRow) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  }

  // ---------- 注册 ----------
  async register(dto: { username: string; password: string; email?: string; nickname?: string }) {
    const username = (dto.username ?? '').trim();
    const password = dto.password ?? '';
    const email = (dto.email ?? '').trim() || null;

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      throw new BadRequestException('账号需为 3-32 位字母、数字或下划线');
    }
    if (!password || password.length < 6 || password.length > 64) {
      throw new BadRequestException('密码长度需为 6-64 位');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('邮箱格式不正确');
    }

    if (IS_DEMO()) {
      throw new BadRequestException('演示模式不支持注册，请配置数据库后使用完整模式');
    }

    const exists = await this.db.query<{ c: string }>(
      'SELECT COUNT(*)::text AS c FROM users WHERE username = $1 OR email = $2',
      [username, email],
    );
    if (Number(exists[0]?.c ?? 0) > 0) {
      throw new ConflictException('账号或邮箱已被注册');
    }

    const passwordHash = await this.hashPassword(password);
    const created = await this.db.query<UserRow>(
      `INSERT INTO users (username, password_hash, email, nickname)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SIGNED_COLS}, password_hash`,
      [username, passwordHash, email, dto.nickname?.trim() || username],
    );
    const user = created[0];
    return { token: this.signToken(user), user: this.toClient(user) };
  }

  // ---------- 登录 ----------
  async login(account: string, password: string) {
    account = (account ?? '').trim();
    if (!account || !password) throw new UnauthorizedException('请输入账号和密码');

    if (IS_DEMO()) {
      const admin = process.env.ADMIN_USERNAME ?? 'admin';
      const pwd = process.env.ADMIN_PASSWORD ?? 'admin123';
      if (account === admin && password === pwd) {
        const user: UserRow = {
          id: 'demo-admin',
          username: admin,
          email: null,
          phone: '13800000000',
          role: 'admin',
          status: 'active',
          password_hash: null,
        };
        return { token: this.signToken(user), user: this.toClient(user) };
      }
      throw new UnauthorizedException('账号或密码错误');
    }

    const rows = await this.db.query<UserRow>(
      `SELECT ${SIGNED_COLS}, password_hash FROM users
       WHERE username = $1 OR email = $1 OR phone = $1
       LIMIT 1`,
      [account],
    );
    const user = rows[0];
    if (!user?.password_hash) throw new UnauthorizedException('账号或密码错误');
    if (user.status === 'banned') throw new UnauthorizedException('账号已被封禁');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('账号或密码错误');

    return { token: this.signToken(user), user: this.toClient(user) };
  }

  // ---------- 找回密码（邮箱验证码） ----------
  async forgotPassword(account: string) {
    account = (account ?? '').trim();
    if (IS_DEMO()) throw new BadRequestException('演示模式不支持找回密码');

    const rows = await this.db.query<UserRow>(
      `SELECT ${SIGNED_COLS} FROM users WHERE username = $1 OR email = $1 OR phone = $1 LIMIT 1`,
      [account],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('账号不存在');

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 8);
    await this.db.query(
      `INSERT INTO password_resets (user_id, code_hash, expires_at)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [user.id, codeHash],
    );

    const delivered = await this.deliverResetCode(user.email ?? '', code);
    if (!delivered) {
      console.log(`[找回密码] 用户 ${account}（${user.username ?? user.phone}）验证码：${code}（30 分钟内有效）`);
    }
    return {
      ok: true,
      message: '验证码已发送，30 分钟内有效',
      // 仅演示/未配置邮箱服务时，便于本地联调；生产环境建议关闭
      devEmail: user.email,
      devCode: process.env.SMTP_HOST ? undefined : code,
    };
  }

  // ---------- 重置密码 ----------
  async resetPassword(account: string, code: string, newPassword: string) {
    account = (account ?? '').trim();
    if (!code || !newPassword || newPassword.length < 6 || newPassword.length > 64) {
      throw new BadRequestException('验证码无效或新密码长度需为 6-64 位');
    }
    if (IS_DEMO()) throw new BadRequestException('演示模式不支持重置密码');

    const users = await this.db.query<UserRow>(
      `SELECT ${SIGNED_COLS} FROM users WHERE username = $1 OR email = $1 OR phone = $1 LIMIT 1`,
      [account],
    );
    const user = users[0];
    if (!user) throw new UnauthorizedException('账号不存在');

    const resets = await this.db.query<{ id: string; code_hash: string; expires_at: string }>(
      `SELECT id, code_hash, expires_at FROM password_resets
       WHERE user_id = $1 AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    );
    const reset = resets[0];
    if (!reset) throw new BadRequestException('验证码已过期，请重新获取');
    const ok = await bcrypt.compare(code, reset.code_hash);
    if (!ok) throw new BadRequestException('验证码错误');

    const passwordHash = await this.hashPassword(newPassword);
    await this.db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
      user.id,
      passwordHash,
    ]);
    await this.db.query('DELETE FROM password_resets WHERE id = $1', [reset.id]);
    return { ok: true };
  }

  // ---------- 修改密码（需登录） ----------
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6 || newPassword.length > 64) {
      throw new BadRequestException('新密码长度需为 6-64 位');
    }
    if (IS_DEMO()) throw new BadRequestException('演示模式不支持修改密码');

    const rows = await this.db.query<UserRow>(
      `SELECT ${SIGNED_COLS}, password_hash FROM users WHERE id = $1`,
      [userId],
    );
    const user = rows[0];
    if (!user?.password_hash) throw new UnauthorizedException('用户不存在');
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) throw new UnauthorizedException('原密码错误');

    const passwordHash = await this.hashPassword(newPassword);
    await this.db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
      userId,
      passwordHash,
    ]);
    return { ok: true };
  }

  // ---------- 超级管理员种子 ----------
  /** 启动时确保超级管理员存在；已存在则不修改密码。 */
  async seedSuperAdmin(): Promise<void> {
    if (IS_DEMO()) return;

    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const email = process.env.ADMIN_EMAIL ?? 'admin@taoteching.cn';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';

    try {
      const existing = await this.db.query<UserRow>(
        `SELECT ${SIGNED_COLS}, password_hash FROM users WHERE username = $1 OR role = 'admin' ORDER BY created_at ASC LIMIT 1`,
        [username],
      );
      if (existing[0]) {
        // 确保该账号具备管理员角色
        if (existing[0].role !== 'admin') {
          await this.db.query("UPDATE users SET role = 'admin', updated_at = now() WHERE id = $1", [
            existing[0].id,
          ]);
        }
        return;
      }

      const passwordHash = await this.hashPassword(password);
      await this.db.query(
        `INSERT INTO users (username, password_hash, email, nickname, role)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [username, passwordHash, email, '超级管理员'],
      );
      console.log(`[超级管理员] 已创建账号「${username}」（邮箱 ${email}），请尽快登录并修改密码`);
    } catch (e) {
      console.error('[超级管理员] 初始化失败：', (e as Error).message);
    }
  }

  // ---------- 邮箱投递 ----------
  private async deliverResetCode(email: string, code: string): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    if (!host || !email) return false;
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: process.env.SMTP_USER ?? '',
          pass: process.env.SMTP_PASS ?? '',
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: email,
        subject: '道枢 · 东方智慧 AI 数字人系统 - 找回密码验证码',
        html: `<p>您的验证码为：<strong>${code}</strong></p><p>验证码 30 分钟内有效，请勿泄露。</p>`,
      });
      return true;
    } catch (e) {
      console.error('[找回密码] 邮件发送失败：', (e as Error).message);
      return false;
    }
  }
}