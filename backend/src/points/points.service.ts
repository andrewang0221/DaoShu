import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';

const SHOP = [
  { code: 'meditation', name: '静心导引专辑（30天）', cost: 300 },
  { code: 'avatar_skin', name: '数字人古风皮肤', cost: 500 },
  { code: 'industry_pack', name: '行业对话包 ×1', cost: 800 },
];

@Injectable()
export class PointsService {
  /** 演示模式内存账本 */
  private readonly demoBalances = new Map<string, number>();
  private readonly demoFrozen = new Map<string, number>();

  constructor(private readonly db: DatabaseService) {}

  async getAccount(userId: string) {
    if (IS_DEMO()) {
      const balance = this.demoBalances.get(userId) ?? 1000;
      return { balance, frozen: this.demoFrozen.get(userId) ?? 0, shop: SHOP };
    }
    const rows = await this.db.query<{ balance: number; frozen: number }>(
      `INSERT INTO points_accounts (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING balance, frozen`,
      [userId],
    );
    const acc = rows[0];
    return { balance: acc.balance, frozen: acc.frozen, shop: SHOP };
  }

  /** 积分兑换（乐观锁防并发超扣） */
  async exchange(userId: string, itemCode: string) {
    const item = SHOP.find((s) => s.code === itemCode);
    if (!item) throw new BadRequestException('兑换物品不存在');
    if (IS_DEMO()) {
      const balance = this.demoBalances.get(userId) ?? 1000;
      if (balance < item.cost) throw new BadRequestException('积分不足');
      this.demoBalances.set(userId, balance - item.cost);
      return { ok: true, item: item.name, cost: item.cost, balance: balance - item.cost };
    }
    // 原子扣减：WHERE balance >= cost 保证不超扣
    const rows = await this.db.query<{ balance: number }>(
      `UPDATE points_accounts SET balance = balance - $2, version = version + 1, updated_at = now()
       WHERE user_id = $1 AND balance >= $2
       RETURNING balance`,
      [userId, item.cost],
    );
    if (!rows.length) throw new BadRequestException('积分不足');
    await this.db.query(
      `INSERT INTO points_transactions (account_id, type, amount, biz_type)
       SELECT id, 'spend', $2, 'exchange' FROM points_accounts WHERE user_id = $1`,
      [userId, -item.cost],
    );
    return { ok: true, item: item.name, cost: item.cost, balance: rows[0].balance };
  }

  /** 通用消费扣分（积分商城外场景：行业包解锁等；bizType 须为 pt_biz 枚举值） */
  async spend(userId: string, amount: number, bizType: string, refId?: string) {
    if (amount <= 0) throw new BadRequestException('扣减积分必须为正数');
    if (IS_DEMO()) {
      const balance = this.demoBalances.get(userId) ?? 1000;
      if (balance < amount) throw new BadRequestException('积分不足');
      this.demoBalances.set(userId, balance - amount);
      return { ok: true, cost: amount, balance: balance - amount };
    }
    const rows = await this.db.query<{ balance: number }>(
      `UPDATE points_accounts SET balance = balance - $2, version = version + 1, updated_at = now()
       WHERE user_id = $1 AND balance >= $2
       RETURNING balance`,
      [userId, amount],
    );
    if (!rows.length) throw new BadRequestException('积分不足');
    // biz_id 列为 uuid：非 uuid 的业务标识（如行业包 code）不入 biz_id，避免转型失败
    const bizId = refId && /^[0-9a-f-]{36}$/i.test(refId) ? refId : null;
    await this.db.query(
      `INSERT INTO points_transactions (account_id, type, amount, biz_type, biz_id, balance_after)
       SELECT id, 'spend', $2, $3::pt_biz, $4::uuid, $5 FROM points_accounts WHERE user_id = $1`,
      [userId, -amount, bizType, bizId, rows[0].balance],
    );
    return { ok: true, cost: amount, balance: rows[0].balance };
  }

  /** 冻结积分（有偿发布悬赏时调用） */
  async freeze(userId: string, amount: number, bizType: string, refId?: string) {
    if (amount <= 0) throw new BadRequestException('冻结积分必须为正数');
    if (IS_DEMO()) {
      const balance = this.demoBalances.get(userId) ?? 1000;
      if (balance < amount) throw new BadRequestException('积分不足');
      this.demoBalances.set(userId, balance - amount);
      this.demoFrozen.set(userId, (this.demoFrozen.get(userId) ?? 0) + amount);
      return { ok: true, frozen: amount, balance: balance - amount };
    }
    const rows = await this.db.query<{ balance: number }>(
      `UPDATE points_accounts
       SET balance = balance - $2, frozen = frozen + $2, version = version + 1, updated_at = now()
       WHERE user_id = $1 AND balance >= $2
       RETURNING balance`,
      [userId, amount],
    );
    if (!rows.length) throw new BadRequestException('积分不足');
    await this.db.query(
      `INSERT INTO points_transactions (account_id, type, amount, biz_type, biz_id, balance_after)
       SELECT id, 'freeze', $2, $3, $4::uuid, $5 FROM points_accounts WHERE user_id = $1`,
      [userId, -amount, bizType, refId ?? null, rows[0].balance],
    );
    return { ok: true, frozen: amount, balance: rows[0].balance };
  }

  /** 悬赏结算：从发帖人冻结额划给被采纳者 */
  async settleBounty(askerId: string, answererId: string, amount: number, refId: string) {
    if (amount <= 0) return;
    if (IS_DEMO()) {
      this.demoFrozen.set(askerId, Math.max((this.demoFrozen.get(askerId) ?? 0) - amount, 0));
      this.demoBalances.set(answererId, (this.demoBalances.get(answererId) ?? 1000) + amount);
      return { ok: true, reward: amount };
    }
    await this.db.query(
      `UPDATE points_accounts
       SET frozen = frozen - $2, version = version + 1, updated_at = now()
       WHERE user_id = $1 AND frozen >= $2`,
      [askerId, amount],
    );
    await this.db.query(
      `INSERT INTO points_accounts (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [answererId],
    );
    const rows = await this.db.query<{ balance: number }>(
      `UPDATE points_accounts
       SET balance = balance + $2, version = version + 1, updated_at = now()
       WHERE user_id = $1
       RETURNING balance`,
      [answererId, amount],
    );
    await this.db.query(
      `INSERT INTO points_transactions (account_id, type, amount, biz_type, biz_id, balance_after)
       SELECT id, 'earn', $2, 'dao_bounty', $3::uuid, $4 FROM points_accounts WHERE user_id = $1`,
      [answererId, amount, refId, rows[0]?.balance ?? 0],
    );
    return { ok: true, reward: amount };
  }
}
