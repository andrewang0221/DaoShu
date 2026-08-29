import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RolesGuard } from './common';
import { AppController } from './app.controller';
import { LLMModule } from './llm/llm.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdoptionModule } from './adoption/adoption.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { EvolutionModule } from './evolution/evolution.module';
import { PointsModule } from './points/points.module';
import { MarketModule } from './market/market.module';
import { AdminModule } from './admin/admin.module';
import { DaoshuModule } from './daoshu/daoshu.module';
import { HealingModule } from './healing/healing.module';
import { GrowthModule } from './growth/growth.module';
import { IndustryModule } from './industry/industry.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SymposiumModule } from './symposium/symposium.module';
import { DaoModule } from './dao/dao.module';
import { SpeechModule } from './speech/speech.module';
import { StudyModule } from './study/study.module';
import { IprModule } from './ipr/ipr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LLMModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdoptionModule,
    ChatModule,
    KnowledgeModule,
    EvolutionModule,
    PointsModule,
    MarketModule,
    AdminModule,
    DaoshuModule,
    HealingModule,
    GrowthModule,
    IndustryModule,
    SubscriptionModule,
    SymposiumModule,
    DaoModule,
    SpeechModule,
    StudyModule,
    IprModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
