import { Module } from '@nestjs/common';
import { DocumentProcessor } from './document.processor';
import { GithubProcessor } from './github.processor';
import { NotificationProcessor } from './notification.processor';
import { DocumentsModule } from '../documents/documents.module';
import { GithubModule } from '../github/github.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DocumentsModule, GithubModule, NotificationsModule],
  providers: [DocumentProcessor, GithubProcessor, NotificationProcessor],
  exports: [DocumentProcessor, GithubProcessor, NotificationProcessor],
})
export class WorkersModule {}
