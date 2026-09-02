import { Module } from '@nestjs/common';
import { ArcDaysService } from './arc-days.service';
import { ArcDaysController } from './arc-days.controller';

@Module({
  controllers: [ArcDaysController],
  providers: [ArcDaysService],
  exports: [ArcDaysService],
})
export class ArcDaysModule {}
