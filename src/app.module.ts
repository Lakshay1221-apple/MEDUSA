import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration';

import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './ai/ai.module';
import { ScoringModule } from './scoring/scoring.module';
import { StreaksModule } from './streaks/streaks.module';
import { TaskRevisionsModule } from './task-revisions/task-revisions.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ArcsModule } from './arcs/arcs.module';
import { ArcDaysModule } from './arc-days/arc-days.module';
import { TasksModule } from './tasks/tasks.module';
import { HabitsModule } from './habits/habits.module';
import { FocusModule } from './focus/focus.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { DocumentsModule } from './documents/documents.module';
import { GithubModule } from './github/github.module';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AccountabilityModule } from './accountability/accountability.module';
import { AchievementsModule } from './achievements/achievements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    StorageModule,
    AiModule,
    ScoringModule,
    StreaksModule,
    TaskRevisionsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ArcsModule,
    ArcDaysModule,
    TasksModule,
    HabitsModule,
    FocusModule,
    SchedulingModule,
    DocumentsModule,
    GithubModule,
    ActivityModule,
    AnalyticsModule,
    AccountabilityModule,
    AchievementsModule,
    NotificationsModule,
    WorkspacesModule,
    RealtimeModule,
    WorkersModule,
  ],
})
export class AppModule {}
