import { Controller, Get } from '@nestjs/common';
import { KnowledgeRetriever } from './chat/knowledge-retriever.service';
import { Public } from './common';

/** 根路径信息 + 健康检查（演示模式与完整模式通用） */
@Controller()
export class AppController {
  constructor(private readonly retriever: KnowledgeRetriever) {}

  @Public()
  @Get()
  root() {
    return {
      service: 'taoteching-ai-backend',
      version: '0.1.0',
      message: '道枢 · 东方智慧 AI 数字人系统后端',
      health: '/api/v1/health',
      api: {
        auth: '/api/v1/auth/login',
        adoption: '/api/v1/adoption/quiz',
        chat: '/api/v1/chat/conversations',
        knowledge: '/api/v1/knowledge/items?keyword=上善若水',
        market: '/api/v1/market/items',
      },
    };
  }

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      mode: process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL ? 'demo' : 'full',
      kbChapters: this.retriever.chapterCount,
      kbLoaded: this.retriever.loaded,
      timestamp: new Date().toISOString(),
    };
  }
}
