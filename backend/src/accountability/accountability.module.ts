import { Module } from '@nestjs/common';
import { AccountabilityService } from './accountability.service';
import { AccountabilityController } from './accountability.controller';

@Module({
  controllers: [AccountabilityController],
  providers: [AccountabilityService],
  exports: [AccountabilityService],
})
export class AccountabilityModule {}
