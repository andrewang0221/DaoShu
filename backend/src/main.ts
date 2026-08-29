import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { avatarUploadDir, modelUploadDir } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  // 认养照片静态访问（不受全局前缀影响）：<host>/uploads/avatars/<file>
  const SAFE_NAME = /^[A-Za-z0-9-]+\.(jpg|png|webp)$/;
  const MIME: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  app.getHttpAdapter().get('/uploads/avatars/:name', (req, res) => {
    const name = String(req.params?.name ?? '');
    if (!SAFE_NAME.test(name)) {
      res.status(400).json({ message: '非法文件名' });
      return;
    }
    const file = path.join(avatarUploadDir(), name);
    if (!fs.existsSync(file)) {
      res.status(404).json({ message: '照片不存在' });
      return;
    }
    res.setHeader('Content-Type', MIME[name.split('.').pop() ?? 'jpg']);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(file);
  });

  // 3D 模型（.glb）静态访问：GET /uploads/models/:name
  const SAFE_GLB = /^[A-Za-z0-9-]+\.glb$/;
  app.getHttpAdapter().get('/uploads/models/:name', (req, res) => {
    const name = String(req.params?.name ?? '');
    if (!SAFE_GLB.test(name)) {
      res.status(400).json({ message: '非法文件名' });
      return;
    }
    const file = path.join(modelUploadDir(), name);
    if (!fs.existsSync(file)) {
      res.status(404).json({ message: '模型不存在' });
      return;
    }
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(file);
  });

  // 根路径欢迎页（不受全局前缀影响，方便浏览器直接访问 IP:PORT）
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      name: '道枢 · 东方智慧 AI 数字人系统',
      version: '2.0.0',
      status: 'online',
      note: '账号密码注册登录已启用；接入 LLM API Key 与支付后自动升级为生产模式',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth/login',
        adoption: '/api/v1/adoption/quiz',
        chat: '/api/v1/chat/conversations',
        knowledge: '/api/v1/knowledge/items?keyword=上善若水',
        daoshu: '/api/v1/daoshu/frameworks',
        healing: '/api/v1/healing/patterns',
        growth: '/api/v1/growth/proverb-card',
        industry: '/api/v1/industry/agents',
        subscription: '/api/v1/subscription/plans',
        docs: 'https://github.com/placeholder', // 后续替换
      },
    });
  });

  const port = Number(process.env.PORT ?? 3081);
  await app.listen(port);
  console.log(`✅ 道枢 · 东方智慧 AI 数字人系统后端已启动: http://localhost:${port}`);
  console.log(`   API 入口: http://localhost:${port}/api/v1`);
  console.log(
    process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL
      ? '   [演示模式] 使用本地 JSON 知识库检索，未连接数据库'
      : '   [完整模式] 已连接 PostgreSQL',
  );
}
bootstrap();
