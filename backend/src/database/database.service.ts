import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * PostgreSQL 连接池（pgvector 通过原生 SQL 使用）
 * 未配置 DATABASE_URL 时 isAvailable=false，业务层应降级或报错。
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;

  get isAvailable(): boolean {
    return !!process.env.DATABASE_URL && process.env.DEMO_MODE !== 'true';
  }

  private getPool(): Pool {
    if (!this.pool) {
      if (!this.isAvailable) {
        throw new Error('未配置 DATABASE_URL（或 DEMO_MODE=true），数据库不可用');
      }
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30_000,
      });
      this.pool.on('error', (e) => this.logger.error(`连接池错误：${e.message}`));
    }
    return this.pool;
  }

  /** 查询，返回行数组 */
  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const r = await this.getPool().query(text, params as never[]);
    return r.rows as T[];
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
