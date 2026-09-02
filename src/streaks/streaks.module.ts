import { Module, Global } from '@nestjs/common';
import { StreaksService } from './streaks.service';

@Global()
@Module({
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
