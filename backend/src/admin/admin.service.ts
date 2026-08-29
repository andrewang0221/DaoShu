import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IS_DEMO } from '../common';
import { KnowledgeRetriever } from '../chat/knowledge-retriever.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly retriever: KnowledgeRetriever,
  ) {}

  /** 数据看板（四项 MVP 指标 + 基础统计） */
  async dashboard() {
    if (IS_DEMO()) {
      return {
        stats: {
          users: 1,
          digitalHumans: 1,
          knowledgeApproved: this.retriever.chapterCount,
          knowledgePending: 0,
          publishedKnowledge: 0,
          citations: 0,
        },
        metrics: {
          dau: 0,
          retention30d: 0,
          publishRate: 0,
          citationRate: 0,
          exchangeRate: 0,
        },
        mode: 'demo',
        tip: '演示模式：接入 PostgreSQL 后展示真实数据',
      };
    }
    const [users, dhs, approved, pending, published, citations] = await Promise.all([
      this.db.query<{ c: string }>('SELECT COUNT(*)::text AS c FROM users WHERE status = \'active\''),
      this.db.query<{ c: string }>('SELECT COUNT(*)::text AS c FROM digital_humans'),
      this.db.query<{ c: string }>("SELECT COUNT(*)::text AS c FROM knowledge_items WHERE status = 'approved'"),
      this.db.query<{ c: string }>("SELECT COUNT(*)::text AS c FROM knowledge_items WHERE status = 'pending'"),
      this.db.query<{ c: string }>("SELECT COUNT(*)::text AS c FROM public_knowledge WHERE status = 'active'"),
      this.db.query<{ c: string }>('SELECT COUNT(*)::text AS c FROM citations'),
    ]);
    return {
      stats: {
        users: Number(users[0]?.c ?? 0),
        digitalHumans: Number(dhs[0]?.c ?? 0),
        knowledgeApproved: Number(approved[0]?.c ?? 0),
        knowledgePending: Number(pending[0]?.c ?? 0),
        publishedKnowledge: Number(published[0]?.c ?? 0),
        citations: Number(citations[0]?.c ?? 0),
      },
      metrics: {
        dau: 0,
        retention30d: 0,
        publishRate: 0,
        citationRate: 0,
        exchangeRate: 0,
      },
      mode: 'full',
    };
  }

  /** 用户列表 */
  async listUsers() {
    if (IS_DEMO()) {
      return [
        { id: 'demo-user', phone: '13800000000', nickname: '演示用户', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
        { id: 'demo-member', phone: '13900000000', nickname: '试听成员', role: 'member', status: 'active', createdAt: new Date().toISOString() },
      ];
    }
    return this.db.query<Record<string, unknown>>(
      `SELECT id, phone, nickname, role, status, created_at AS "createdAt"
       FROM users ORDER BY created_at DESC LIMIT 200`,
    );
  }

  /** 封禁 / 解封 */
  async setUserStatus(id: string, status: 'active' | 'banned') {
    if (!['active', 'banned'].includes(status)) throw new BadRequestException('非法状态');
    if (IS_DEMO()) {
      return { id, status, ok: true };
    }
    await this.db.query('UPDATE users SET status = $2, updated_at = now() WHERE id = $1', [id, status]);
    return { id, status, ok: true };
  }

  /** 积分流水 */
  async listPointTransactions() {
    if (IS_DEMO()) {
      return {
        list: [],
        tip: '演示模式：兑换在内存中模拟，重启即清空',
      };
    }
    const rows = await this.db.query<Record<string, unknown>>(
      `SELECT pt.id, pt.type, pt.amount, pt.biz_type AS "bizType", pt.balance_after AS "balanceAfter", pt.created_at AS "createdAt",
              u.phone
       FROM points_transactions pt
       JOIN points_accounts pa ON pa.id = pt.account_id
       JOIN users u ON u.id = pa.user_id
       ORDER BY pt.created_at DESC LIMIT 200`,
    );
    return { list: rows };
  }

  /** 审计日志 */
  async listAuditLogs() {
    if (IS_DEMO()) {
      return {
        list: [],
        tip: '演示模式：审核操作不落审计表，接入数据库后自动记录',
      };
    }
    return this.db.query<Record<string, unknown>>(
      `SELECT id, entity_type AS "entityType", entity_id AS "entityId", action, operator_id AS "operatorId", detail, created_at AS "createdAt"
       FROM audit_logs ORDER BY created_at DESC LIMIT 200`,
    );
  }
}
