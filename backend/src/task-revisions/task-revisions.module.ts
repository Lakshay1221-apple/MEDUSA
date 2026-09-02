import { Module, Global } from '@nestjs/common';
import { TaskRevisionsService } from './task-revisions.service';

@Global()
@Module({
  providers: [TaskRevisionsService],
  exports: [TaskRevisionsService],
})
export class TaskRevisionsModule {}
